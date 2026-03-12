import type { OutlineLookupResult, WqbTag } from '../types'

const API_BASE = 'https://api.sfucourses.com'

export const parseDesignationText = (designationText: string): WqbTag[] => {
  const tags = new Set<WqbTag>()
  const normalized = designationText.toLowerCase()
  const hasBreadth = normalized.includes('breadth')

  if (/\bwriting\b/i.test(designationText)) {
    tags.add('W')
  }

  if (/\bquantitative\b|\bq\b/i.test(designationText)) {
    tags.add('Q')
  }

  if (hasBreadth && (normalized.includes('humanities') || /\bhum\b/.test(normalized))) {
    tags.add('B-Hum')
  }

  if (
    hasBreadth &&
    (normalized.includes('social sci') ||
      normalized.includes('social science') ||
      normalized.includes('social sciences') ||
      /\bsoc\b/.test(normalized))
  ) {
    tags.add('B-Soc')
  }

  if (hasBreadth && normalized.includes('science')) {
    tags.add('B-Sci')
  }

  return [...tags]
}

interface OutlineResponse {
  corequisites?: string
  designation?: string
  description?: string
  dept?: string
  number?: string
  prerequisites?: string
  title?: string
  units?: string
}

const normalizeCourseCode = (department: string, number: string) =>
  `${department.trim().toUpperCase()} ${number.trim().toUpperCase()}`.trim()

const normalizeOutline = (outline: OutlineResponse): OutlineLookupResult => {
  const department = outline.dept?.toUpperCase() ?? ''
  const number = outline.number?.toUpperCase() ?? ''
  const code = `${department} ${number}`.trim()
  const designationText = outline.designation ?? ''

  return {
    code,
    title: outline.title ?? code,
    units: Number(outline.units ?? '0') || 0,
    designationText,
    designations: parseDesignationText(designationText),
    prerequisites: outline.prerequisites ?? '',
    corequisites: outline.corequisites ?? '',
    description: outline.description ?? '',
  }
}

export const fetchOutlineByCourse = async (
  department: string,
  number: string
): Promise<OutlineLookupResult | null> => {
  const requestedCode = normalizeCourseCode(department, number)
  const search = new URLSearchParams({
    dept: department,
    number,
  })

  const response = await fetch(`${API_BASE}/v1/rest/outlines?${search.toString()}`)

  if (!response.ok) {
    return null
  }

  const data = (await response.json()) as OutlineResponse[]
  const exactMatch =
    data.find(
      (outline) =>
        normalizeCourseCode(outline.dept ?? '', outline.number ?? '') === requestedCode
    ) ?? null

  return exactMatch ? normalizeOutline(exactMatch) : null
}

export const searchOutlines = async (
  department: string,
  number: string
): Promise<OutlineLookupResult[]> => {
  const search = new URLSearchParams()

  if (department.trim()) {
    search.set('dept', department.trim())
  }

  if (number.trim()) {
    search.set('number', number.trim())
  }

  const response = await fetch(`${API_BASE}/v1/rest/outlines?${search.toString()}`)

  if (!response.ok) {
    return []
  }

  const data = (await response.json()) as OutlineResponse[]
  return data.map(normalizeOutline)
}
