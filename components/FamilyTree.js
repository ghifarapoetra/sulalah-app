'use client'
import { useEffect, useRef, useState } from 'react'
import { getMahram } from '../lib/mahram'
import { calculateGenerationLevels } from '../lib/generationLevel'

const NW=172, NH=70, HG=28, VG=90, PAD=36
const ini = n => n.trim().split(/\s+/).slice(0,2).map(w=>w[0]||'').join('').toUpperCase()||'?'

function computeLayout(persons) {
  if (!persons.length) return { positions:{}, gens:[], svgW:300, svgH:200 }
  const map={}; persons.forEach(p=>map[p.id]=p)
  // Use smart calculator (handles pasangan/partner)
  const cache = calculateGenerationLevels(persons)
  const byGen={}
  persons.forEach(p=>{ const g=cache[p.id]||0; (byGen[g]=byGen[g]||[]).push(p.id) })
  const gens=Object.keys(byGen).map(Number).sort((a,b)=>a-b)
  let maxN=0; Object.values(byGen).forEach(ids=>{ if(ids.length>maxN)maxN=ids.length })
  const svgW=Math.max(maxN*(NW+HG)-HG+PAD*2, NW+PAD*2)
  const positions={}

  gens.forEach(g=>{
    const ids=[...byGen[g]]
    // Build partner map for this generation
    const coupleMap={}
    persons.forEach(p=>{
      if(p.father_id && p.mother_id && (cache[p.father_id]||0)===g && (cache[p.mother_id]||0)===g) {
        coupleMap[p.father_id]=p.mother_id
        coupleMap[p.mother_id]=p.father_id
      }
    })
    const pcx = id => {
      const p=map[id]; if(!p) return -1
      const xs=[p.father_id,p.mother_id].filter(Boolean).map(x=>positions[x]?.cx??-1).filter(x=>x>=0)
      return xs.length ? xs.reduce((a,b)=>a+b,0)/xs.length : -1
    }
    const visited=new Set(), ordered=[]
    const sorted=[...ids].sort((a,b)=>{
      const pa=map[a],pb=map[b],ax=pcx(a),bx=pcx(b)
      const sameParent=pa?.father_id&&pb?.father_id&&pa.father_id===pb.father_id
      if(sameParent&&pa?.birth_order&&pb?.birth_order) return pa.birth_order-pb.birth_order
      if(ax<0&&bx<0)return 0
      if(ax<0)return 1
      if(bx<0)return -1
      return ax-bx
    })
    sorted.forEach(id=>{
      if(visited.has(id)) return
      visited.add(id); ordered.push(id)
      const partner=coupleMap[id]
      if(partner && !visited.has(partner) && ids.includes(partner)) {
        visited.add(partner); ordered.push(partner)
      }
    })
    const rowW=ordered.length*(NW+HG)-HG
    const sx=PAD+(svgW-PAD*2-rowW)/2
    const y=PAD+g*(NH+VG)
    ordered.forEach((id,i)=>{
      const x=sx+i*(NW+HG)
      positions[id]={x,y,cx:x+NW/2}
    })
  })
  return { positions, gens, svgW, svgH:Math.max(...gens)*(NH+VG)+NH+PAD*2 }
}

// Build L-shape path with rounded corner (slightly curved at the corner)
function lShapePath(x1, y1, x2, y2, midY, r=8) {
  // From (x1,y1) straight down to midY, then horizontal to x2, then straight down to (x2,y2)
  // with rounded corners at (x1, midY) and (x2, midY)
  if (x1 === x2) {
    return `M${x1},${y1} L${x2},${y2}`
  }
  const goRight = x2 > x1
  const rr = Math.min(r, Math.abs(x2-x1)/2, Math.abs(midY-y1), Math.abs(y2-midY))
  const cx1 = goRight ? x1 + rr : x1 - rr
  const cx2 = goRight ? x2 - rr : x2 + rr
  return `M${x1},${y1} L${x1},${midY-rr} Q${x1},${midY} ${cx1},${midY} L${cx2},${midY} Q${x2},${midY} ${x2},${midY+rr} L${x2},${y2}`
}

export default function FamilyTree({ persons, selected, onSelect, theme, treeName }) {
  const containerRef=useRef(null)
  const [zoom, setZoom] = useState(1)
  const { positions, gens, svgW, svgH } = computeLayout(persons)
  const mah = selected ? getMahram(selected, persons) : null

  // Line colors based on theme
  const lc = theme==='dark' ? '#475569' : '#94a3b8'
  const lm = theme==='dark' ? '#d97706' : '#f59e0b'
  const ls = theme==='dark' ? '#64748b' : '#94a3b8'

  // Zoom controls
  const zoomIn = () => setZoom(z => Math.min(2, +(z + 0.15).toFixed(2)))
  const zoomOut = () => setZoom(z => Math.max(0.4, +(z - 0.15).toFixed(2)))
  const zoomFit = () => setZoom(1)

  // Wheel zoom (Ctrl + wheel)
  useEffect(() => {
    const cw = document.getElementById('cw')
    if (!cw) return
    const handler = (e) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault()
        if (e.deltaY < 0) zoomIn()
        else zoomOut()
      }
    }
    cw.addEventListener('wheel', handler, { passive: false })
    return () => cw.removeEventListener('wheel', handler)
  }, [])

  useEffect(()=>{
    const ci=containerRef.current; if(!ci) return
    ci.querySelectorAll('.pnode,.gen-label').forEach(e=>e.remove())
    gens.forEach(g=>{
      const lbl=document.createElement('div'); lbl.className='gen-label'
      lbl.style.top=(PAD+g*(NH+VG)+NH/2-8)+'px'
      lbl.textContent='GEN '+(g+1); ci.appendChild(lbl)
    })
    persons.forEach(p=>{
      const pos=positions[p.id]; if(!pos) return
      const isSel=selected===p.id, isMah=mah?.all.has(p.id)
      const d=document.createElement('div')
      d.className=`pnode ${p.gender}${isSel?' selected':''}${isMah&&!isSel?' mahram':''}${p.death_year?' deceased':''}`
      d.style.left=pos.x+'px'; d.style.top=pos.y+'px'
      const avCls=isSel?'node-avatar avatar-sel':`node-avatar avatar-${p.gender==='male'?'m':'f'}`
      const yr=p.birth_year?(p.death_year?`${p.birth_year}–${p.death_year}`:`b.${p.birth_year}`):''
      const badge=p.is_self?`<div class="node-badge badge-you">● Anda</div>`:isMah&&!isSel?`<div class="node-badge badge-mah">✦ mahram</div>`:isSel?`<div class="node-badge badge-sel">● dipilih</div>`:''
      d.innerHTML=`<div class="${avCls}">${p.photo_url?`<img src="${p.photo_url}" alt="${p.name}" onerror="this.remove()">`:''}<span>${ini(p.name)}</span></div><div class="node-info"><div class="node-name">${p.name}</div>${yr?`<div class="node-year">${yr}</div>`:''}${badge}</div>`
      d.onclick=()=>onSelect(selected===p.id?null:p.id)
      ci.appendChild(d)
    })
  })

  // Build SVG lines - L-shape with rounded corners
  let lines=''
  const couples=new Set()

  // Couple connector (horizontal double line between partners)
  persons.forEach(p=>{
    if(!p.father_id||!p.mother_id) return
    const key=[p.father_id,p.mother_id].sort().join('|')
    if(couples.has(key)) return; couples.add(key)
    const fp=positions[p.father_id], mp=positions[p.mother_id]
    if(!fp||!mp) return
    // Only connect if on same generation
    if(fp.y !== mp.y) return
    const lx1=Math.min(fp.x+NW,mp.x+NW), lx2=Math.max(fp.x,mp.x)
    if(lx2>lx1) {
      lines+=`<line x1="${lx1}" y1="${fp.y+NH/2}" x2="${lx2}" y2="${fp.y+NH/2}" stroke="${ls}" stroke-width="1.5" stroke-dasharray="4 4" opacity="0.7"/>`
    }
  })

  // Parent→child lines with L-shape and rounded corners
  persons.forEach(p=>{
    const parents = [p.father_id, p.mother_id].filter(Boolean).filter(id => positions[id])
    if (parents.length === 0 || !positions[p.id]) return

    // If both parents exist, draw single line from midpoint of parent couple
    if (parents.length === 2 && positions[parents[0]].y === positions[parents[1]].y) {
      const p1 = positions[parents[0]], p2 = positions[parents[1]]
      const parentMidX = (p1.cx + p2.cx) / 2
      const parentBottomY = p1.y + NH
      const childTopY = positions[p.id].y
      const midY = (parentBottomY + childTopY) / 2
      const hi = mah?.all.has(parents[0]) || mah?.all.has(parents[1]) || mah?.all.has(p.id)
      const color = hi ? lm : lc
      const sw = hi ? 2 : 1.3
      lines += `<path d="${lShapePath(parentMidX, parentBottomY, positions[p.id].cx, childTopY, midY, 8)}" fill="none" stroke="${color}" stroke-width="${sw}" stroke-linecap="round"/>`
    } else {
      // Single parent or parents in different generations
      parents.forEach(parId => {
        const pp = positions[parId]
        const childPos = positions[p.id]
        const py = pp.y + NH
        const cy = childPos.y
        const midY = (py + cy) / 2
        const hi = mah?.all.has(parId) || mah?.all.has(p.id)
        const color = hi ? lm : lc
        const sw = hi ? 2 : 1.3
        lines += `<path d="${lShapePath(pp.cx, py, childPos.cx, cy, midY, 8)}" fill="none" stroke="${color}" stroke-width="${sw}" stroke-linecap="round"/>`
      })
    }
  })

  const self=persons.find(p=>p.is_self)||{name:treeName||'Keluarga'}

  return (
    <div>
      <div className="print-title">{self?`Silsilah Keluarga ${self.name}`:''}</div>
      <div className="print-sub">Dicetak dari sulalah.my.id</div>
      <div id="cw" style={{ overflow:'auto',height:460,border:'1px solid var(--bd)',borderRadius:12,background:'var(--surf)',position:'relative' }}>
        {/* Zoom controls */}
        <div style={{ position:'absolute',top:10,right:10,zIndex:10,display:'flex',flexDirection:'column',gap:4,background:'var(--card)',border:'1px solid var(--bd)',borderRadius:8,padding:4,boxShadow:'0 2px 8px rgba(0,0,0,.08)' }}>
          <button onClick={zoomIn} title="Zoom in (Ctrl+Scroll up)" style={{ width:28,height:28,border:'none',background:'transparent',cursor:'pointer',fontSize:16,fontWeight:700,color:'var(--tx)',borderRadius:6 }}>+</button>
          <button onClick={zoomFit} title="Reset zoom" style={{ width:28,height:24,border:'none',background:'transparent',cursor:'pointer',fontSize:9,color:'var(--tx2)',borderRadius:6,fontWeight:600 }}>{Math.round(zoom*100)}%</button>
          <button onClick={zoomOut} title="Zoom out (Ctrl+Scroll down)" style={{ width:28,height:28,border:'none',background:'transparent',cursor:'pointer',fontSize:18,fontWeight:700,color:'var(--tx)',borderRadius:6 }}>−</button>
        </div>

        <div id="ci" ref={containerRef} style={{
          position:'relative',
          width:svgW,height:svgH,
          transform:`scale(${zoom})`,
          transformOrigin:'top left',
          transition:'transform .15s ease-out'
        }}>
          <svg width={svgW} height={svgH} viewBox={`0 0 ${svgW} ${svgH}`} style={{ position:'absolute',top:0,left:0,pointerEvents:'none',overflow:'visible' }} dangerouslySetInnerHTML={{ __html:lines }} />
        </div>
      </div>
      <div style={{ marginTop:8,display:'flex',gap:12,flexWrap:'wrap',fontSize:10,color:'var(--tx3)',alignItems:'center' }}>
        {[['var(--t4)','Laki-laki'],['var(--rose-t)','Perempuan'],['var(--amber-t)','Mahram']].map(([c,l])=>(
          <span key={l} style={{ display:'flex',alignItems:'center',gap:4 }}>
            <span style={{ width:8,height:8,borderRadius:'50%',background:c,display:'inline-block' }}></span>{l}
          </span>
        ))}
        <span style={{ opacity:.5,display:'flex',alignItems:'center',gap:4 }}>
          <span style={{ width:8,height:8,borderRadius:'50%',background:'var(--tx3)',display:'inline-block' }}></span>Almarhum/ah
        </span>
        <span style={{ marginLeft:'auto' }}>🔍 Ctrl + Scroll untuk zoom</span>
      </div>
    </div>
  )
}
