'use client'
import { useState } from 'react'
import { getMahram } from '../lib/mahram'
import WafatPanel from './WafatPanel'

const ini = n => n.trim().split(/\s+/).slice(0,2).map(w=>w[0]||'').join('').toUpperCase()||'?'

export default function DetailPanel({ person, persons, onEdit, onClose, umrohLink }) {
  const [showWafat, setShowWafat] = useState(false)
  if (!person) return null
  const mah = getMahram(person.id, persons)
  const nm = id => persons.find(p=>p.id===id)?.name||'?'

  const cats = [
    { l:'Orang tua & leluhur', ids:mah.ancestors },
    { l:'Anak & keturunan', ids:mah.descendants },
    { l:'Saudara kandung', ids:mah.siblings },
    { l:'Paman / Bibi', ids:mah.unclesAunts },
    { l:'Keponakan', ids:mah.niecesNephews },
  ].filter(c=>c.ids.length)

  const nonMah = persons.filter(p=>p.id!==person.id&&!mah.all.has(p.id))
  const avBg = person.gender==='male'?'var(--t2)':'var(--rose-bg)'
  const avTx = person.gender==='male'?'var(--t6)':'var(--rose-t)'
  const yr = person.birth_year?(person.death_year?`${person.birth_year}–${person.death_year}`:`b. ${person.birth_year}`):'';
  const isDeceased = !!person.death_year

  // Milad info
  const MONTHS = ['','Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des']
  const miladStr = person.birth_day && person.birth_month ? `${person.birth_day} ${MONTHS[person.birth_month]}` : null

  if (showWafat) return <WafatPanel person={person} umrohLink={umrohLink} onClose={()=>setShowWafat(false)} />

  return (
    <div className="card" style={{ marginTop:12 }}>
      {/* Header */}
      <div style={{ display:'flex',alignItems:'flex-start',gap:12,marginBottom:12,flexWrap:'wrap' }}>
        <div style={{ display:'flex',alignItems:'center',gap:12,flex:1,minWidth:200 }}>
          <div style={{ width:56,height:56,borderRadius:'50%',background:avBg,display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,fontWeight:700,color:avTx,flexShrink:0,position:'relative',overflow:'hidden' }}>
            {person.photo_url&&<img src={person.photo_url} alt={person.name} onError={e=>e.target.remove()} style={{ position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'cover',borderRadius:'50%' }} />}
            <span>{ini(person.name)}</span>
          </div>
          <div>
            <div style={{ fontSize:17,fontWeight:700,color:'var(--tx)',letterSpacing:'-.3px' }}>
              {person.name} {person.is_self&&<span style={{ fontSize:11,color:'var(--t4)',fontWeight:500 }}>(Anda)</span>}
              {isDeceased&&<span style={{ fontSize:11,color:'var(--tx3)',fontWeight:400 }}> ☪ Almarhum/ah</span>}
            </div>
            <div style={{ fontSize:12,color:'var(--tx2)',marginTop:2 }}>
              {person.gender==='male'?'Laki-laki':'Perempuan'}{yr?' · '+yr:''}
            </div>
            {miladStr&&!isDeceased&&<div style={{ fontSize:11,color:'var(--t4)',marginTop:1 }}>🌙 Milad: {miladStr}</div>}
            {person.phone&&<a href={`https://wa.me/${person.phone.replace(/\D/g,'')}`} target="_blank" rel="noreferrer" style={{ fontSize:12,color:'var(--t5)',textDecoration:'none',display:'block',marginTop:3,fontWeight:500 }}>📱 {person.phone}</a>}
            {person.email&&<div style={{ fontSize:12,color:'var(--tx2)',marginTop:1 }}>✉️ {person.email}</div>}
          </div>
        </div>
        <div style={{ display:'flex',gap:5,flexShrink:0,flexWrap:'wrap' }}>
          {isDeceased&&<button className="btn btn-ghost" style={{ fontSize:11,padding:'5px 10px',background:'var(--t2)',borderColor:'var(--t3)',color:'var(--t6)' }} onClick={()=>setShowWafat(true)}>☪ Kirim Pahala</button>}
          {onEdit&&<button className="btn btn-ghost" style={{ fontSize:11,padding:'5px 10px' }} onClick={()=>onEdit(person)}>✏️ Edit</button>}
          <button className="btn btn-ghost" style={{ fontSize:11,padding:'5px 10px' }} onClick={onClose}>✕</button>
        </div>
      </div>

      {person.notes&&<div style={{ fontSize:13,color:'var(--tx2)',background:'var(--surf)',border:'1px solid var(--bd)',borderRadius:8,padding:'8px 12px',marginBottom:12,lineHeight:1.6 }}>{person.notes}</div>}

      <div className="divider"><span>{mah.all.size} MAHRAM NASAB</span></div>

      {cats.length>0?(
        <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(155px,1fr))',gap:8,marginBottom:10 }}>
          {cats.map(c=>(
            <div key={c.l} style={{ background:'var(--surf)',border:'1px solid var(--bd)',borderRadius:8,padding:'10px 12px' }}>
              <div style={{ fontSize:9,fontWeight:700,color:'var(--t5)',textTransform:'uppercase',letterSpacing:'.8px',marginBottom:6 }}>{c.l}</div>
              {c.ids.map(id=><div key={id} style={{ fontSize:12,color:'var(--tx)',padding:'3px 0',borderBottom:'1px solid var(--bd)' }}>{nm(id)}</div>)}
            </div>
          ))}
        </div>
      ):(
        <p style={{ fontSize:13,color:'var(--tx3)',textAlign:'center',padding:'10px 0' }}>Belum ada mahram terdeteksi.</p>
      )}

      {nonMah.length>0&&(
        <div style={{ background:'var(--surf)',border:'1px solid var(--bd)',borderRadius:8,padding:'10px 12px',marginBottom:10 }}>
          <div style={{ fontSize:9,fontWeight:700,color:'var(--tx3)',textTransform:'uppercase',letterSpacing:'.8px',marginBottom:6 }}>Bukan mahram nasab ({nonMah.length})</div>
          <div style={{ display:'flex',gap:5,flexWrap:'wrap' }}>
            {nonMah.map(p=><span key={p.id} style={{ fontSize:11,padding:'3px 9px',borderRadius:20,background:'var(--card)',color:'var(--tx2)',border:'1px solid var(--bd)' }}>{p.name}</span>)}
          </div>
        </div>
      )}

      <div style={{ fontSize:11,color:'var(--tx3)',lineHeight:1.6,borderTop:'1px solid var(--bd)',paddingTop:8 }}>
        <strong style={{ color:'var(--tx2)' }}>Catatan fiqh:</strong> Mahram di atas berdasarkan <em>nasab</em>. Mahram <em>mushaharah</em> dan <em>radha'</em> dihitung terpisah.
      </div>
    </div>
  )
}
