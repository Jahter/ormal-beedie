# Prerequisite Flowchart Implementation Guide

This document contains the complete HTML, CSS, and JavaScript required to implement the prerequisite flowchart in another application.

## 1. HTML Container Structure

Add this to your HTML file where you want the flowchart or its modal to appear.

```html
<!-- Modal Container -->
<div id="prereq-modal" class="prereq-modal" aria-hidden="true" role="dialog">
    <div class="prereq-modal-backdrop" onclick="closePrereqModal()"></div>
    <div class="prereq-modal-dialog">
        <div class="prereq-modal-header">
            <div>
                <h4 class="prereq-modal-kicker">Course Requirements</h4>
                <h3 id="prereq-modal-title">Prerequisite Roadmap</h3>
                <p id="prereq-modal-subtitle">Follow arrows left to right.</p>
            </div>
            <button class="prereq-modal-close" onclick="closePrereqModal()">×</button>
        </div>
        
        <!-- The actual flowchart container -->
        <div id="prereq-flowchart" class="prereq-flowchart"></div>
        
        <div class="prereq-legend">
            <span class="legend-item complete">Completed</span>
            <span class="legend-item planned">Scheduled</span>
            <span class="legend-item missing">Missing</span>
        </div>
    </div>
</div>
```

## 2. CSS Styling

Add these styles to your stylesheet to ensure the SVG paths and HTML nodes render correctly.

```css
/* Prerequisite Modal */
.prereq-modal {
    position: fixed;
    inset: 0;
    z-index: 1200;
    display: none;
}

.prereq-modal.open {
    display: block;
}

.prereq-modal-backdrop {
    position: absolute;
    inset: 0;
    background: rgba(2, 6, 23, 0.72);
    backdrop-filter: blur(3px);
}

.prereq-modal-dialog {
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    width: min(1080px, 94vw);
    max-height: 88vh;
    background: linear-gradient(165deg, rgba(15, 23, 42, 0.98), rgba(30, 41, 59, 0.96));
    border: 1px solid rgba(125, 211, 252, 0.28);
    border-radius: 16px;
    box-shadow: 0 24px 55px rgba(2, 6, 23, 0.55);
    padding: 18px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    gap: 14px;
}

.prereq-modal-header {
    display: flex;
    justify-content: space-between;
    gap: 16px;
    align-items: flex-start;
}

.prereq-modal-kicker {
    margin: 0 0 5px;
    color: #7dd3fc;
    font-size: 0.76rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    font-weight: 700;
}

.prereq-modal-header h3 {
    margin: 0;
    font-size: 1.16rem;
    color: #fff;
}

.prereq-modal-subtitle {
    margin: 6px 0 0;
    color: #b8c9df;
    font-size: 0.88rem;
}

.prereq-modal-close {
    border: 1px solid rgba(148, 163, 184, 0.5);
    background: rgba(15, 23, 42, 0.7);
    color: #f8fafc;
    border-radius: 999px;
    width: 30px;
    height: 30px;
    cursor: pointer;
    font-size: 0.92rem;
    font-weight: 700;
}

.prereq-modal-close:hover {
    border-color: rgba(125, 211, 252, 0.8);
    color: #e0f2fe;
}

.prereq-flowchart {
    border: 1px solid rgba(148, 163, 184, 0.25);
    border-radius: 12px;
    background: rgba(15, 23, 42, 0.62);
    min-height: 280px;
    max-height: 58vh;
    overflow: auto;
    padding: 8px;
}

.prereq-empty {
    height: 260px;
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    color: #c1d2e8;
    font-size: 0.92rem;
    padding: 20px;
}

.prereq-flowchart-stage {
    position: relative;
}

.prereq-connectors {
    position: absolute;
    inset: 0;
}

.prereq-edge {
    fill: none;
    stroke: #7dd3fc;
    stroke-width: 2;
    opacity: 0.72;
}

.prereq-node {
    position: absolute;
    width: 200px;
    min-height: 84px;
    border-radius: 12px;
    border: 1px solid rgba(148, 163, 184, 0.35);
    background: rgba(30, 41, 59, 0.9);
    padding: 10px;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    gap: 4px;
    color: #e2e8f0;
    box-shadow: 0 10px 18px rgba(2, 6, 23, 0.35);
}

.prereq-node.target {
    border-color: rgba(251, 191, 36, 0.85);
    box-shadow: 0 12px 26px rgba(245, 158, 11, 0.28);
}

.prereq-node.complete {
    border-color: rgba(16, 185, 129, 0.72);
    background: rgba(6, 78, 59, 0.62);
}

.prereq-node.planned {
    border-color: rgba(59, 130, 246, 0.72);
    background: rgba(30, 58, 138, 0.58);
}

.prereq-node.missing {
    border-color: rgba(148, 163, 184, 0.45);
}

.prereq-node.credit-node {
    border-style: dashed;
}

.prereq-node.or-node {
    border-style: dashed;
}

.prereq-node.or-node.missing {
    border-color: rgba(244, 114, 182, 0.78);
    background: rgba(131, 24, 67, 0.62);
}

.prereq-node.or-node.missing .prereq-node-code {
    color: #fbcfe8;
}

.prereq-node.or-node.missing .prereq-node-title {
    color: #fce7f3;
}

.prereq-node.or-node.missing .prereq-node-tag {
    border-color: rgba(244, 114, 182, 0.75);
    background: rgba(76, 5, 25, 0.58);
    color: #fbcfe8;
}

.prereq-node-code {
    font-size: 0.9rem;
    font-weight: 700;
}

.prereq-node-title {
    color: #bfdbfe;
    font-size: 0.76rem;
    line-height: 1.3;
}

.prereq-node-tag {
    margin-top: auto;
    display: inline-block;
    align-self: flex-start;
    padding: 2px 8px;
    border-radius: 999px;
    font-size: 0.68rem;
    font-weight: 700;
    background: rgba(15, 23, 42, 0.56);
    border: 1px solid rgba(148, 163, 184, 0.45);
}

.prereq-legend {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    font-size: 0.78rem;
}

.legend-item {
    padding: 4px 10px;
    border-radius: 999px;
    border: 1px solid rgba(148, 163, 184, 0.45);
    background: rgba(15, 23, 42, 0.7);
    color: #fff;
}

.legend-item.complete {
    border-color: rgba(16, 185, 129, 0.72);
    color: #d1fae5;
}

.legend-item.planned {
    border-color: rgba(59, 130, 246, 0.7);
    color: #dbeafe;
}

.legend-item.missing {
    border-color: rgba(148, 163, 184, 0.45);
    color: #e2e8f0;
}
```

## 3. JavaScript Implementation

You'll need a state tracking system and some course metadata for this to work. Here is the logic adapted to be standalone.

```javascript
/**
 * You will need to define or replace these dependencies based on your app:
 * - courseMap: An object mapping course codes to their metadata (title, units, prereqs)
 * - getCourseRoadmapStatus(code): Returns 'complete', 'planned', or 'missing'
 * - getOrRoadmapStatus(options): Evaluates an OR condition
 * - getCreditRoadmapStatus(minCredits, target): Evaluates if minimum credits are met
 * - getCoursePrereqRequirements(course): Parses prereq string into structured object
 */

function buildPrereqGraph(targetCode) {
    const nodes = new Map(); 
    const edges = []; 
    const edgeKeys = new Set();
    
    function addEdge(from, to) { 
        const k = `${from}->${to}`; 
        if (edgeKeys.has(k)) return; 
        edgeKeys.add(k); 
        edges.push({ from, to }); 
    }
    
    function ensureCourse(code) { 
        if (!nodes.has(code)) {
            nodes.set(code, { 
                kind: 'course', 
                code, 
                title: courseMap[code]?.title || 'Prerequisite' 
            }); 
        }
        return code; 
    }
    
    function ensureCredit(min) { 
        const id = `CREDITS_${min}`; 
        if (!nodes.has(id)) {
            nodes.set(id, { 
                kind: 'credit', 
                code: `${min}+ Credits`, 
                title: 'Minimum credits required', 
                minCredits: min 
            }); 
        }
        return id; 
    }
    
    function ensureOr(parent, idx, opts) { 
        const id = `OR_${parent}_${idx}`; 
        if (!nodes.has(id)) {
            nodes.set(id, { 
                kind: 'or', 
                code: opts.join(' OR '), 
                title: 'One of the following', 
                options: [...new Set(opts)] 
            }); 
        }
        return id; 
    }
    
    ensureCourse(targetCode);
    
    // Replace this with your own prerequisite parser logic
    const req = getCoursePrereqRequirements(courseMap[targetCode]);
    
    (req.courseGroups || []).forEach((g, i) => {
        const norm = [...new Set(g.map(c => c.trim().toUpperCase()).filter(Boolean))];
        if (!norm.length) return;
        
        if (norm.length === 1) { 
            ensureCourse(norm[0]); 
            addEdge(norm[0], targetCode); 
        } else { 
            const orId = ensureOr(targetCode, i, norm); 
            addEdge(orId, targetCode); 
        }
    });
    
    if (req.minCredits != null) { 
        const cId = ensureCredit(req.minCredits); 
        addEdge(cId, targetCode); 
    }
    
    return { nodes, edges, targetCode };
}

function computeGraphLevels(graph) {
    const prereqMap = new Map();
    graph.nodes.forEach((_, code) => prereqMap.set(code, []));
    graph.edges.forEach(e => { 
        const ex = prereqMap.get(e.to) || []; 
        ex.push(e.from); 
        prereqMap.set(e.to, ex); 
    });
    
    const memo = new Map();
    
    function getLevel(code, stack = new Set()) {
        if (memo.has(code)) return memo.get(code);
        if (stack.has(code)) return 0; // Prevent infinite loops from circular dependencies
        
        stack.add(code);
        const prereqs = prereqMap.get(code) || [];
        const level = prereqs.length ? 1 + Math.max(...prereqs.map(p => getLevel(p, stack))) : 0;
        
        memo.set(code, level); 
        stack.delete(code); 
        return level;
    }
    
    graph.nodes.forEach((_, code) => getLevel(code));
    return memo;
}

function renderPrereqFlowchart(targetCode) {
    const container = document.getElementById('prereq-flowchart');
    if (!container) return;
    
    container.innerHTML = '';
    const graph = buildPrereqGraph(targetCode);
    
    if (!graph.edges.length) { 
        container.innerHTML = '<div class="prereq-empty">No listed prerequisites.</div>'; 
        return; 
    }
    
    const levels = computeGraphLevels(graph);
    const grouped = new Map();
    
    graph.nodes.forEach((node, code) => { 
        const lvl = levels.get(code) || 0; 
        if (!grouped.has(lvl)) grouped.set(lvl, []); 
        grouped.get(lvl).push({ id: code, node }); 
    });
    
    // Layout constants
    const nw = 200, nh = 84, hgap = 90, vgap = 24, pad = 28;
    const maxLvl = Math.max(...grouped.keys()); 
    const maxRows = Math.max(...[...grouped.values()].map(n => n.length));
    
    // Canvas dimensions
    const w = pad * 2 + (maxLvl + 1) * nw + maxLvl * hgap; 
    const h = Math.max(260, pad * 2 + maxRows * nh + Math.max(0, maxRows - 1) * vgap);
    
    const stage = document.createElement('div');
    stage.className = 'prereq-flowchart-stage';
    stage.style.width = `${w}px`; 
    stage.style.height = `${h}px`;
    
    // Create SVG for connectors (bezier curves)
    const svgNS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('class', 'prereq-connectors');
    svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
    svg.setAttribute('width', String(w)); 
    svg.setAttribute('height', String(h));
    
    const defs = document.createElementNS(svgNS, 'defs');
    const marker = document.createElementNS(svgNS, 'marker');
    marker.setAttribute('id', 'prereq-arrow'); 
    marker.setAttribute('markerWidth', '8'); 
    marker.setAttribute('markerHeight', '8');
    marker.setAttribute('refX', '7'); 
    marker.setAttribute('refY', '3.5'); 
    marker.setAttribute('orient', 'auto');
    
    const arrow = document.createElementNS(svgNS, 'path');
    arrow.setAttribute('d', 'M0,0 L7,3.5 L0,7 Z'); 
    arrow.setAttribute('fill', '#7dd3fc');
    
    marker.appendChild(arrow); 
    defs.appendChild(marker); 
    svg.appendChild(defs);
    
    // Compute positions for all nodes
    const pos = new Map();
    grouped.forEach((entries, lvl) => {
        entries.forEach((e, row) => {
            pos.set(e.id, { 
                x: pad + lvl * (nw + hgap), 
                y: pad + row * (nh + vgap) 
            });
        });
    });
    
    // Draw SVG edges (cubic bezier curves)
    graph.edges.forEach(edge => {
        const f = pos.get(edge.from), t = pos.get(edge.to); 
        if (!f || !t) return;
        
        const path = document.createElementNS(svgNS, 'path');
        path.setAttribute('class', 'prereq-edge');
        path.setAttribute('d', `M ${f.x + nw} ${f.y + nh / 2} C ${f.x + nw + 42} ${f.y + nh / 2}, ${t.x - 42} ${t.y + nh / 2}, ${t.x} ${t.y + nh / 2}`);
        path.setAttribute('marker-end', 'url(#prereq-arrow)');
        svg.appendChild(path);
    });
    
    stage.appendChild(svg);
    
    // Generate HTML DOM elements for the cards
    graph.nodes.forEach((node, code) => {
        const p = pos.get(code); 
        if (!p) return;
        
        // Define statuses based on your app's logic
        const status = node.kind === 'credit' 
            ? getCreditRoadmapStatus(node.minCredits, targetCode) 
            : node.kind === 'or' 
                ? getOrRoadmapStatus(node.options) 
                : getCourseRoadmapStatus(code);
                
        const el = document.createElement('div');
        el.className = `prereq-node ${status} ${code === targetCode ? 'target' : ''} ${node.kind === 'credit' ? 'credit-node' : ''} ${node.kind === 'or' ? 'or-node' : ''}`;
        el.style.left = `${p.x}px`; 
        el.style.top = `${p.y}px`;
        
        const t = document.createElement('div'); 
        t.className = 'prereq-node-code'; 
        t.textContent = node.code;
        
        const s = document.createElement('div'); 
        s.className = 'prereq-node-title'; 
        s.textContent = node.title;
        
        const tag = document.createElement('div'); 
        tag.className = 'prereq-node-tag';
        
        // Populate standard tags
        if (code === targetCode) {
            tag.textContent = 'Target';
        } else if (status === 'complete') {
            tag.textContent = 'Completed';
        } else if (status === 'planned') {
            tag.textContent = 'Scheduled';
        } else {
            tag.textContent = 'Missing';
        }
        
        el.appendChild(t); 
        el.appendChild(s); 
        el.appendChild(tag);
        stage.appendChild(el);
    });
    
    container.appendChild(stage);
}

// Modal Toggle Functions
function openPrereqModal(code) {
    const modal = document.getElementById('prereq-modal');
    const titleEl = document.getElementById('prereq-modal-title');
    const subEl = document.getElementById('prereq-modal-subtitle');
    
    if (!modal || !titleEl || !subEl) return;
    
    titleEl.textContent = `${code} Prerequisite Roadmap`;
    subEl.textContent = `${courseMap[code]?.title || 'Course'}. Follow arrows left to right.`;
    
    renderPrereqFlowchart(code);
    
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
}

function closePrereqModal() {
    const modal = document.getElementById('prereq-modal');
    if (!modal || !modal.classList.contains('open')) return;
    
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
}
```
