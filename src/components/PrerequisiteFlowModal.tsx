import { useEffect, useRef } from 'react'
import {
  getPlannerCorequisiteText,
  extractMinimumUnits,
  getPlannerPrerequisiteText,
  parsePrerequisites,
  type ParsedPrerequisite,
} from '../lib/prereqParser'

interface PrerequisiteFlowModalProps {
  isOpen: boolean
  courseCode: string
  courseTitle: string
  prerequisiteText: string
  corequisiteText?: string
  completedCodes: string[]
  inProgressCodes: string[]
  onClose: () => void
}

/* ---------- graph types ---------- */

interface GraphNode {
  kind: 'course' | 'and' | 'or' | 'credit'
  code: string
  title: string
  childIds?: string[]
  minCredits?: number
}

interface GraphEdge {
  from: string
  to: string
}

interface PrereqGraph {
  nodes: Map<string, GraphNode>
  edges: GraphEdge[]
  targetCode: string
}

/* ---------- graph builder ---------- */

function buildPrereqGraph(
  targetCode: string,
  targetTitle: string,
  prerequisiteText: string
): PrereqGraph {
  const nodes = new Map<string, GraphNode>()
  const edges: GraphEdge[] = []
  const edgeKeys = new Set<string>()

  const addEdge = (from: string, to: string) => {
    const k = `${from}->${to}`
    if (edgeKeys.has(k)) return
    edgeKeys.add(k)
    edges.push({ from, to })
  }

  const ensureCourse = (code: string) => {
    if (!nodes.has(code)) {
      nodes.set(code, { kind: 'course', code, title: 'Specific course requirement' })
    }
    return code
  }

  const ensureCredit = (min: number) => {
    const id = `CREDITS_${min}`
    if (!nodes.has(id)) {
      nodes.set(id, {
        kind: 'credit',
        code: `${min}+ Credits`,
        title: 'Minimum credits required',
        minCredits: min,
      })
    }
    return id
  }

  let groupCounter = 0

  // Add target node
  nodes.set(targetCode, {
    kind: 'course',
    code: targetCode,
    title: targetTitle || 'Target Course',
  })

  // Parse the prerequisite text into a tree
  const parsed = parsePrerequisites(prerequisiteText)

  const materializeNode = (node: ParsedPrerequisite): string | null => {
    if (node.kind === 'course' && node.courseCode) {
      return ensureCourse(node.courseCode.trim().toUpperCase())
    }

    if ((node.kind === 'and' || node.kind === 'or') && node.children?.length) {
      const childIds = node.children
        .map((child) => materializeNode(child))
        .filter((childId): childId is string => Boolean(childId))

      if (childIds.length === 0) {
        return null
      }

      if (childIds.length === 1) {
        return childIds[0]
      }

      const groupId = `${node.kind.toUpperCase()}_${groupCounter++}`
      nodes.set(groupId, {
        kind: node.kind,
        code: node.kind.toUpperCase(),
        title:
          node.kind === 'and' ? 'All of these requirements' : 'Choose one valid pathway',
        childIds,
      })

      for (const childId of childIds) {
        addEdge(childId, groupId)
      }

      return groupId
    }

    return null
  }

  if (parsed) {
    const rootId = materializeNode(parsed)

    if (rootId) {
      addEdge(rootId, targetCode)
    }
  }

  // Handle minimum unit requirements
  const minCredits = extractMinimumUnits(prerequisiteText)
  if (minCredits > 0) {
    const cId = ensureCredit(minCredits)
    addEdge(cId, targetCode)
  }

  return { nodes, edges, targetCode }
}

/* ---------- level computation ---------- */

function computeGraphLevels(graph: PrereqGraph): Map<string, number> {
  const prereqMap = new Map<string, string[]>()
  graph.nodes.forEach((_, code) => prereqMap.set(code, []))
  graph.edges.forEach((e) => {
    const existing = prereqMap.get(e.to) || []
    existing.push(e.from)
    prereqMap.set(e.to, existing)
  })

  const memo = new Map<string, number>()

  function getLevel(code: string, stack = new Set<string>()): number {
    if (memo.has(code)) return memo.get(code)!
    if (stack.has(code)) return 0

    stack.add(code)
    const prereqs = prereqMap.get(code) || []
    const level = prereqs.length
      ? 1 + Math.max(...prereqs.map((p) => getLevel(p, stack)))
      : 0

    memo.set(code, level)
    stack.delete(code)
    return level
  }

  graph.nodes.forEach((_, code) => getLevel(code))
  return memo
}

/* ---------- status helpers ---------- */

function getCourseStatus(
  code: string,
  completedCodes: string[],
  inProgressCodes: string[]
): 'complete' | 'planned' | 'missing' {
  if (completedCodes.includes(code)) return 'complete'
  if (inProgressCodes.includes(code)) return 'planned'
  return 'missing'
}

function getGroupStatus(
  node: GraphNode,
  graph: PrereqGraph,
  completedCodes: string[],
  inProgressCodes: string[],
  memo = new Map<string, 'complete' | 'planned' | 'missing'>()
): 'complete' | 'planned' | 'missing' {
  const cacheKey = `${node.kind}-${node.code}-${node.childIds?.join('|') ?? ''}`

  if (memo.has(cacheKey)) {
    return memo.get(cacheKey)!
  }

  const childStatuses = (node.childIds ?? [])
    .map((childId) => {
      const child = graph.nodes.get(childId)

      if (!child) {
        return 'missing' as const
      }

      if (child.kind === 'course') {
        return getCourseStatus(child.code, completedCodes, inProgressCodes)
      }

      if (child.kind === 'credit') {
        return 'missing' as const
      }

      return getGroupStatus(child, graph, completedCodes, inProgressCodes, memo)
    })

  const status =
    node.kind === 'and'
      ? childStatuses.every((childStatus) => childStatus === 'complete')
        ? 'complete'
        : childStatuses.every((childStatus) => childStatus !== 'missing')
          ? 'planned'
          : 'missing'
      : childStatuses.some((childStatus) => childStatus === 'complete')
        ? 'complete'
        : childStatuses.some((childStatus) => childStatus !== 'missing')
          ? 'planned'
          : 'missing'

  memo.set(cacheKey, status)
  return status
}

/* ---------- flowchart renderer ---------- */

function FlowchartCanvas({
  graph,
  completedCodes,
  inProgressCodes,
}: {
  graph: PrereqGraph
  completedCodes: string[]
  inProgressCodes: string[]
}) {
  const stageRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const stage = stageRef.current
    if (!stage) return

    stage.innerHTML = ''

    if (!graph.edges.length) {
      const empty = document.createElement('div')
      empty.className = 'prereq-empty'
      empty.textContent = 'No listed prerequisites.'
      stage.appendChild(empty)
      return
    }

    const levels = computeGraphLevels(graph)
    const grouped = new Map<number, Array<{ id: string; node: GraphNode }>>()

    graph.nodes.forEach((node, code) => {
      const lvl = levels.get(code) || 0
      if (!grouped.has(lvl)) grouped.set(lvl, [])
      grouped.get(lvl)!.push({ id: code, node })
    })

    // Layout constants
    const nw = 200
    const nh = 84
    const hgap = 90
    const vgap = 24
    const pad = 28
    const maxLvl = Math.max(...grouped.keys())
    const maxRows = Math.max(...[...grouped.values()].map((n) => n.length))

    const w = pad * 2 + (maxLvl + 1) * nw + maxLvl * hgap
    const h = Math.max(260, pad * 2 + maxRows * nh + Math.max(0, maxRows - 1) * vgap)

    const wrapper = document.createElement('div')
    wrapper.className = 'prereq-flowchart-stage'
    wrapper.style.width = `${w}px`
    wrapper.style.height = `${h}px`

    // SVG for connectors
    const svgNS = 'http://www.w3.org/2000/svg'
    const svg = document.createElementNS(svgNS, 'svg')
    svg.setAttribute('class', 'prereq-connectors')
    svg.setAttribute('viewBox', `0 0 ${w} ${h}`)
    svg.setAttribute('width', String(w))
    svg.setAttribute('height', String(h))

    const defs = document.createElementNS(svgNS, 'defs')
    const marker = document.createElementNS(svgNS, 'marker')
    marker.setAttribute('id', 'prereq-arrow')
    marker.setAttribute('markerWidth', '8')
    marker.setAttribute('markerHeight', '8')
    marker.setAttribute('refX', '7')
    marker.setAttribute('refY', '3.5')
    marker.setAttribute('orient', 'auto')

    const arrow = document.createElementNS(svgNS, 'path')
    arrow.setAttribute('d', 'M0,0 L7,3.5 L0,7 Z')
    arrow.setAttribute('fill', '#be8f82')

    marker.appendChild(arrow)
    defs.appendChild(marker)
    svg.appendChild(defs)

    // Compute positions for nodes
    const pos = new Map<string, { x: number; y: number }>()
    grouped.forEach((entries, lvl) => {
      entries.forEach((e, row) => {
        pos.set(e.id, {
          x: pad + lvl * (nw + hgap),
          y: pad + row * (nh + vgap),
        })
      })
    })

    // Draw SVG bezier edges
    graph.edges.forEach((edge) => {
      const f = pos.get(edge.from)
      const t = pos.get(edge.to)
      if (!f || !t) return

      const path = document.createElementNS(svgNS, 'path')
      path.setAttribute('class', 'prereq-edge')
      path.setAttribute(
        'd',
        `M ${f.x + nw} ${f.y + nh / 2} C ${f.x + nw + 42} ${f.y + nh / 2}, ${t.x - 42} ${t.y + nh / 2}, ${t.x} ${t.y + nh / 2}`
      )
      path.setAttribute('marker-end', 'url(#prereq-arrow)')
      svg.appendChild(path)
    })

    wrapper.appendChild(svg)

    // Create HTML node cards
    graph.nodes.forEach((node, code) => {
      const p = pos.get(code)
      if (!p) return

      const status =
        node.kind === 'credit'
          ? 'missing'
          : node.kind === 'and' || node.kind === 'or'
            ? getGroupStatus(node, graph, completedCodes, inProgressCodes)
            : getCourseStatus(code, completedCodes, inProgressCodes)

      const isTarget = code === graph.targetCode

      const el = document.createElement('div')
      el.className = [
        'prereq-node',
        status,
        isTarget ? 'target' : '',
        node.kind === 'credit' ? 'credit-node' : '',
        node.kind === 'and' ? 'and-node' : '',
        node.kind === 'or' ? 'or-node' : '',
      ]
        .filter(Boolean)
        .join(' ')

      el.style.left = `${p.x}px`
      el.style.top = `${p.y}px`

      const codeEl = document.createElement('div')
      codeEl.className = 'prereq-node-code'
      codeEl.textContent = node.code

      const titleEl = document.createElement('div')
      titleEl.className = 'prereq-node-title'
      titleEl.textContent = node.title

      const tag = document.createElement('div')
      tag.className = 'prereq-node-tag'
      if (isTarget) {
        tag.textContent = 'Target'
      } else if (status === 'complete') {
        tag.textContent = 'Completed'
      } else if (status === 'planned') {
        tag.textContent = 'Scheduled'
      } else {
        tag.textContent = 'Missing'
      }

      el.appendChild(codeEl)
      el.appendChild(titleEl)
      el.appendChild(tag)
      wrapper.appendChild(el)
    })

    stage.appendChild(wrapper)
  }, [graph, completedCodes, inProgressCodes])

  return <div ref={stageRef} className="prereq-flowchart" />
}

/* ---------- modal component ---------- */

export const PrerequisiteFlowModal = ({
  isOpen,
  courseCode,
  courseTitle,
  prerequisiteText,
  corequisiteText,
  completedCodes,
  inProgressCodes,
  onClose,
}: PrerequisiteFlowModalProps) => {
  if (!isOpen) return null

  const plannerPrerequisiteText = getPlannerPrerequisiteText(courseCode, prerequisiteText)
  const plannerCorequisiteText = getPlannerCorequisiteText(courseCode, corequisiteText ?? '')
  const graph = buildPrereqGraph(courseCode, courseTitle, plannerPrerequisiteText)

  return (
    <div className="prereq-modal open" role="dialog" aria-modal="true" aria-labelledby="prereq-modal-title">
      <div className="prereq-modal-backdrop" onClick={onClose} />
      <div className="prereq-modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="prereq-modal-header">
          <div>
            <h4 className="prereq-modal-kicker">Course Requirements</h4>
            <h3 id="prereq-modal-title">
              {courseCode} Prerequisite Roadmap
            </h3>
            <p className="prereq-modal-subtitle">
              {courseTitle}. Follow arrows left to right.
            </p>
          </div>
          <button className="prereq-modal-close" onClick={onClose} type="button">
            ×
          </button>
        </div>

        <FlowchartCanvas
          graph={graph}
          completedCodes={completedCodes}
          inProgressCodes={inProgressCodes}
        />

        <div className="prereq-legend">
          <span className="legend-item complete">Completed</span>
          <span className="legend-item planned">Scheduled</span>
          <span className="legend-item missing">Missing</span>
        </div>

        {plannerPrerequisiteText && plannerPrerequisiteText !== prerequisiteText ? (
          <div className="prereq-info-section">
            <strong>Planner prerequisite interpretation</strong>
            <p>{plannerPrerequisiteText}</p>
          </div>
        ) : null}

        {plannerCorequisiteText?.trim() ? (
          <div className="prereq-info-section">
            <strong>Corequisites</strong>
            <p>{plannerCorequisiteText}</p>
          </div>
        ) : null}

        <div className="prereq-info-section">
          <strong>Raw prerequisite text</strong>
          <p>{prerequisiteText || 'No prerequisite text available.'}</p>
        </div>
      </div>
    </div>
  )
}
