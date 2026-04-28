'use client'
import { useEffect, useRef, useState } from 'react'
import { getMahram } from '../lib/mahram'
import { calculateGenerationLevels } from '../lib/generationLevel'

const NW=172, NH=72, HG=28, VG=90, PAD=36
const ini = n => n.trim().split(/\s+/).slice(0,2).map(w=>w[0]||'').join('').toUpperCase()||'?'

function computeLayout(persons, marriages = []) {
  if (!persons.length) return { positions:{}, gens:[], svgW:300, svgH:200 }
  const map={}; persons.forEach(p=>map[p.id]=p)
  const cache = calculateGenerationLevels(persons, marriages)
  const byGen={}
  persons.forEach(p=>{ const g=cache[p.id]||0; (byGen[g]=byGen[g]||[]).push(p.id) })
  const gens=Object.keys(byGen).map(Number).sort((a,b)=>a-b)
  let maxN=0; Object.values(byGen).forEach(ids=>{ if(ids.length>maxN)maxN=ids.length })
  const svgW=Math.max(maxN*(NW+HG)-HG+PAD*2, NW+PAD*2)

  // Build couple map
  const allCoupleMap = {}
  persons.forEach(p=>{
    if(p.father_id && p.mother_id) { allCoupleMap[p.father_id]=p.mother_id; allCoupleMap[p.mother_id]=p.father_id }
  })
  marriages.forEach(m => {
    if(m.status === 'active') { allCoupleMap[m.person1_id]=m.person2_id; allCoupleMap[m.person2_id]=m.person1_id }
  })

  const positions={}
  gens.forEach(g=>{
    const ids=[...byGen[g]]
    const coupleMap={}
    Object.entries(allCoupleMap).forEach(([a,b])=>{
      if((cache[a]||0)===g && (cache[b]||0)===g) coupleMap[a]=b
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
      if(ax<0&&bx<0) return 0
      if(ax<0) return 1; if(bx<0) return -1
      return ax-bx
    })
    sorted.forEach(id=>{
      if(visited.has(id)) return
      visited.add(id); ordered.push(id)
      const partner=coupleMap[id]
      if(partner && !visited.has(partner) && ids.includes(partner)) { visited.add(partner); ordered.push(partner) }
    })
    const rowW=ordered.length*(NW+HG)-HG
    const sx=PAD+(svgW-PAD*2-rowW)/2
    const y=PAD+g*(NH+VG)
    ordered.forEach((id,i)=>{ const x=sx+i*(NW+HG); positions[id]={x,y,cx:x+NW/2} })
  })
  return { positions, gens, svgW, svgH:Math.max(...gens)*(NH+VG)+NH+PAD*2 }
}

export default function FamilyTree({ persons, selected, onSelect, theme, treeName, marriages = [] }) {
  const containerRef=useRef(null)
  const [zoom, setZoom] = useState(1)
  const { positions, gens, svgW, svgH } = computeLayout(persons, marriages)
  const mah = selected ? getMahram(selected, persons, marriages) : null

  const zoomIn = () => setZoom(z => Math.min(2, +(z+0.15).toFixed(2)))
  const zoomOut = () => setZoom(z => Math.max(0.4, +(z-0.15).toFixed(2)))
  const zoomFit = () => setZoom(1)

  useEffect(() => {
    const cw = document.getElementById('cw'); if(!cw) return
    const handler = e => { if(e.ctrlKey||e.metaKey) { e.preventDefault(); e.deltaY<0?zoomIn():zoomOut() } }
    cw.addEventListener('wheel', handler, { passive:false })
    return () => cw.removeEventListener('wheel', handler)
  }, [])

  useEffect(()=>{
    const ci=containerRef.current; if(!ci) return
    ci.querySelectorAll('.pnode,.gen-label').forEach(e=>e.remove())

    // Gen labels
    gens.forEach(g=>{
      const lbl=document.createElement('div'); lbl.className='gen-label'
      lbl.style.top=(PAD+g*(NH+VG)+NH/2-8)+'px'
      lbl.textContent='GEN '+(g+1); ci.appendChild(lbl)
    })

    persons.forEach(p=>{
      const pos=positions[p.id]; if(!pos) return
      const isSel=selected===p.id
      const isNasab = mah?.nasab.has(p.id)
      const isMush = mah?.mushaharah.has(p.id)

      let cls = `pnode ${p.gender}`
      if(isSel) cls += ' selected'
      else if(isNasab) cls += ' mahram-nasab'
      else if(isMush) cls += ' mahram-mushaharah'
      if(p.death_year) cls += ' deceased'

      const d=document.createElement('div')
      d.className=cls
      d.style.left=pos.x+'px'; d.style.top=pos.y+'px'

      const avCls = isSel ? 'node-avatar avatar-sel' : `node-avatar avatar-${p.gender==='male'?'m':'f'}`
      const yr = p.birth_year ? (p.death_year ? `${p.birth_year}–${p.death_year}` : `b.${p.birth_year}`) : ''

      // Badge — mahram type aware
      let badge = ''
      if(p.is_self) badge = `<div class="node-badge badge-you">● Anda</div>`
      else if(isSel) badge = `<div class="node-badge badge-sel">● dipilih</div>`
      else if(isNasab) badge = `<div class="node-badge badge-nasab">✦ mahram nasab</div>`
      else if(isMush) badge = `<div class="node-badge badge-mushaharah">✦ mahram nikah</div>`

      // Micro icons — tanda data tersedia
      const micros = []
      if(p.photo_url) micros.push('📷')
      if(p.phone) micros.push('📞')
      if(p.address) micros.push('📍')
      const microHtml = micros.length ? `<div class="node-micro">${micros.map(m=>`<span>${m}</span>`).join('')}</div>` : ''

      const photo = p.photo_url ? `<img src="${p.photo_url}" alt="${p.name}" onerror="this.remove()">` : ''

      d.innerHTML=`
        <div class="${avCls}">${photo}<span>${ini(p.name)}</span></div>
        <div class="node-info">
          <div class="node-name">${p.name}</div>
          ${yr ? `<div class="node-year">${yr}</div>` : ''}
          ${microHtml}
          ${badge}
        </div>`
      d.onclick=()=>onSelect(selected===p.id?null:p.id)
      ci.appendChild(d)
    })
  })

  // SVG lines — multi-color
  let lines = ''
  const couples = new Set()

  // Couple lines (dashed)
  persons.forEach(p=>{
    if(!p.father_id||!p.mother_id) return
    const key=[p.father_id,p.mother_id].sort().join('|')
    if(couples.has(key)) return; couples.add(key)
    const fp=positions[p.father_id], mp=positions[p.mother_id]
    if(!fp||!mp) return
    const lx1=Math.min(fp.x+NW,mp.x+NW), lx2=Math.max(fp.x,mp.x)
    if(lx2>lx1) lines+=`<line x1="${lx1}" y1="${fp.y+NH/2}" x2="${lx2}" y2="${fp.y+NH/2}" stroke="var(--line-couple)" stroke-width="1.5" stroke-dasharray="5 3"/>`
  })
  marriages.forEach(m=>{
    if(m.status!=='active') return
    const key=[m.person1_id,m.person2_id].sort().join('|')
    if(couples.has(key)) return; couples.add(key)
    const fp=positions[m.person1_id], mp=positions[m.person2_id]
    if(!fp||!mp) return
    const lx1=Math.min(fp.x+NW,mp.x+NW), lx2=Math.max(fp.x,mp.x)
    if(lx2>lx1) lines+=`<line x1="${lx1}" y1="${fp.y+NH/2}" x2="${lx2}" y2="${fp.y+NH/2}" stroke="var(--line-couple)" stroke-width="1.5" stroke-dasharray="5 3"/>`
  })

  // Parent→child lines — color based on mahram type
  persons.forEach(p=>{
    [p.father_id,p.mother_id].filter(Boolean).forEach(par=>{
      if(!positions[par]||!positions[p.id]) return
      const px=positions[par].cx, py=positions[par].y+NH
      const cx=positions[p.id].cx, cy=positions[p.id].y, mid=(py+cy)/2

      // Warna garis: nasab hijau, mushaharah oranye, default abu
      const pIsNasab = mah?.nasab.has(par) || mah?.nasab.has(p.id)
      const pIsMush = mah?.mushaharah.has(par) || mah?.mushaharah.has(p.id)
      const parIsSel = par === selected
      const childIsSel = p.id === selected

      let stroke = 'var(--line-default)'
      let sw = 1.5
      if(parIsSel || childIsSel) { stroke='var(--line-nasab)'; sw=2.5 }
      else if(pIsNasab) { stroke='var(--line-nasab)'; sw=2 }
      else if(pIsMush) { stroke='var(--line-mushaharah)'; sw=2 }

      lines+=`<path d="M${px},${py} C${px},${mid} ${cx},${mid} ${cx},${cy}" fill="none" stroke="${stroke}" stroke-width="${sw}"/>`
    })
  })

  return (
    <div>
      <div className="print-title">{treeName ? `Silsilah Keluarga ${treeName}` : ''}</div>
      <div className="print-sub">Dicetak dari sulalah.my.id</div>
      <div id="cw" style={{ overflow:'auto',height:460,border:'1px solid var(--bd)',borderRadius:14,background:'var(--surf)',position:'relative' }}>
        {/* Zoom controls */}
        <div style={{ position:'absolute',top:10,right:10,zIndex:10,display:'flex',flexDirection:'column',gap:3,background:'var(--card)',border:'1px solid var(--bd)',borderRadius:10,padding:4,boxShadow:'var(--shadow-md)' }}>
          <button onClick={zoomIn} title="Zoom in" style={{ width:30,height:30,border:'none',background:'transparent',cursor:'pointer',fontSize:17,fontWeight:700,color:'var(--tx)',borderRadius:7,display:'flex',alignItems:'center',justifyContent:'center' }}>+</button>
          <button onClick={zoomFit} title="Reset" style={{ width:30,height:20,border:'none',background:'transparent',cursor:'pointer',fontSize:9,color:'var(--tx2)',borderRadius:7,fontWeight:700 }}>{Math.round(zoom*100)}%</button>
          <button onClick={zoomOut} title="Zoom out" style={{ width:30,height:30,border:'none',background:'transparent',cursor:'pointer',fontSize:18,fontWeight:700,color:'var(--tx)',borderRadius:7,display:'flex',alignItems:'center',justifyContent:'center' }}>−</button>
        </div>

        <div id="ci" ref={containerRef} style={{ position:'relative',width:svgW,height:svgH,transform:`scale(${zoom})`,transformOrigin:'top left',transition:'transform .15s ease-out' }}>
          <svg width={svgW} height={svgH} viewBox={`0 0 ${svgW} ${svgH}`} style={{ position:'absolute',top:0,left:0,pointerEvents:'none',overflow:'visible' }} dangerouslySetInnerHTML={{ __html:lines }} />
        </div>
      </div>

      {/* Legend */}
      <div style={{ marginTop:10,display:'flex',gap:14,flexWrap:'wrap',fontSize:11,color:'var(--tx3)',alignItems:'center' }}>
        <span style={{ display:'flex',alignItems:'center',gap:5 }}>
          <span style={{ width:20,height:3,borderRadius:2,background:'var(--line-nasab)',display:'inline-block' }}></span>
          Mahram nasab
        </span>
        <span style={{ display:'flex',alignItems:'center',gap:5 }}>
          <span style={{ width:20,height:3,borderRadius:2,background:'var(--line-mushaharah)',display:'inline-block' }}></span>
          Mahram nikah
        </span>
        <span style={{ display:'flex',alignItems:'center',gap:5 }}>
          <span style={{ width:8,height:8,borderRadius:'50%',background:'var(--rose-t)',display:'inline-block' }}></span>
          Perempuan
        </span>
        <span style={{ display:'flex',alignItems:'center',gap:5 }}>
          <span style={{ width:8,height:8,borderRadius:'50%',background:'var(--t4)',display:'inline-block' }}></span>
          Laki-laki
        </span>
        <span style={{ marginLeft:'auto',fontSize:10,opacity:.6 }}>Ctrl+Scroll untuk zoom</span>
      </div>
    </div>
  )
}
