'use client'
import { useState } from 'react'
import { POSTER_THEMES, exportPoster } from '../lib/pdfExport'

export default function PdfThemeModal({ treeName, memberCount, persons=[], isPremium, onClose }) {
  const [selected, setSelected] = useState('clean')
  const [format, setFormat] = useState('pdf')
  const [exporting, setExporting] = useState(false)
  const [progress, setProgress] = useState('')
  const [err, setErr] = useState('')

  async function handleExport() {
    setExporting(true); setErr('')
    try {
      setProgress('Menggambar pohon...')
      await new Promise(r => setTimeout(r, 60))
      setProgress('Membuat poster...')
      await exportPoster({ themeId:selected, treeName, memberCount, persons, isPremium, format })
      setProgress('Selesai! ✓')
      setTimeout(() => { setExporting(false); setProgress(''); onClose() }, 1500)
    } catch (e) {
      setErr(e.message || 'Gagal ekspor. Coba lagi.')
      setExporting(false); setProgress('')
    }
  }

  const free    = POSTER_THEMES.filter(t=>!t.premium)
  const premium = POSTER_THEMES.filter(t=> t.premium)

  return (
    <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,.6)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000,padding:16 }}>
      <div style={{ background:'var(--card)',borderRadius:18,padding:24,maxWidth:620,width:'100%',maxHeight:'92vh',overflowY:'auto',boxShadow:'0 24px 60px rgba(0,0,0,.3)' }}>

        <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6 }}>
          <div>
            <h3 style={{ fontSize:17,fontWeight:800,color:'var(--tx)' }}>🖼️ Ekspor Poster Silsilah</h3>
            <p style={{ fontSize:12,color:'var(--tx2)',marginTop:2 }}>Kualitas cetak tinggi — cocok dipajang di rumah</p>
          </div>
          <button onClick={onClose} style={{ background:'none',border:'none',fontSize:20,cursor:'pointer',color:'var(--tx3)',padding:'4px 8px' }}>✕</button>
        </div>

        {/* Format */}
        <div style={{ display:'flex',gap:8,margin:'14px 0 16px' }}>
          {[{id:'pdf',label:'📄 PDF',desc:'Siap cetak'},{id:'png',label:'🖼️ PNG',desc:'Resolusi tinggi'}].map(f=>(
            <button key={f.id} onClick={()=>setFormat(f.id)}
              style={{ flex:1,padding:'10px',borderRadius:10,border:`2px solid ${format===f.id?'var(--t4)':'var(--bd)'}`,background:format===f.id?'var(--t2)':'transparent',cursor:'pointer',transition:'all .15s' }}>
              <div style={{ fontSize:14,fontWeight:700,color:format===f.id?'var(--t6)':'var(--tx)' }}>{f.label}</div>
              <div style={{ fontSize:10,color:'var(--tx3)',marginTop:2 }}>{f.desc}</div>
            </button>
          ))}
        </div>

        {/* Free themes */}
        <div style={{ fontSize:10,fontWeight:700,color:'var(--tx3)',letterSpacing:'.8px',textTransform:'uppercase',marginBottom:8 }}>Tema Gratis</div>
        <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:16 }}>
          {free.map(t=><ThemeCard key={t.id} theme={t} selected={selected} onSelect={setSelected} locked={false}/>)}
        </div>

        {/* Premium themes */}
        <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:8 }}>
          <div style={{ fontSize:10,fontWeight:700,color:'var(--tx3)',letterSpacing:'.8px',textTransform:'uppercase' }}>Tema Premium</div>
          {!isPremium&&<span style={{ fontSize:10,fontWeight:700,padding:'2px 8px',borderRadius:20,background:'var(--amber-bg)',color:'var(--amber-t)',border:'1px solid var(--amber-b)' }}>✨ Upgrade Rp 29k</span>}
        </div>
        <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:20 }}>
          {premium.map(t=><ThemeCard key={t.id} theme={t} selected={selected} onSelect={setSelected} locked={!isPremium}/>)}
        </div>

        <div style={{ background:'var(--surf)',border:'1px solid var(--bd)',borderRadius:10,padding:'10px 14px',marginBottom:16,fontSize:12,color:'var(--tx2)',lineHeight:1.7 }}>
          💡 Output <strong>A3 landscape beresolusi tinggi</strong> — pohon digambar ulang dari data, bukan screenshot, jadi tajam di semua ukuran zoom. Siap cetak di print shop atau dijadikan figura.
        </div>

        {err&&<div style={{ background:'var(--rose-bg)',border:'1px solid var(--rose-b)',borderRadius:8,padding:'8px 12px',marginBottom:12,fontSize:12,color:'var(--rose-t)' }}>⚠ {err}</div>}

        <div style={{ display:'flex',gap:8,justifyContent:'flex-end' }}>
          <button className="btn btn-ghost" onClick={onClose} disabled={exporting}>Batal</button>
          <button className="btn btn-primary btn-pill" onClick={handleExport} disabled={exporting}
            style={{ minWidth:190,justifyContent:'center',fontSize:14,padding:'10px 24px' }}>
            {exporting
              ? <span style={{ display:'flex',alignItems:'center',gap:8 }}><Spinner/>{progress||'Memproses...'}</span>
              : `${format==='pdf'?'📄':'🖼️'} Ekspor ${format.toUpperCase()}`}
          </button>
        </div>
      </div>
    </div>
  )
}

function ThemeCard({ theme, selected, onSelect, locked }) {
  const isSel=selected===theme.id
  return (
    <div onClick={()=>!locked&&onSelect(theme.id)}
      style={{ display:'flex',alignItems:'center',gap:10,padding:'10px 12px',borderRadius:10,border:`2px solid ${isSel?'var(--t4)':'var(--bd)'}`,background:isSel?'var(--surf)':'transparent',cursor:locked?'not-allowed':'pointer',opacity:locked?0.6:1,transition:'all .15s' }}>
      <div style={{ width:44,height:36,borderRadius:7,background:theme.previewBg,border:`2px solid ${theme.previewBorder}`,flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',position:'relative',overflow:'hidden' }}>
        <div style={{ width:8,height:8,borderRadius:'50%',background:theme.previewAccent,boxShadow:`0 0 6px ${theme.previewAccent}` }}/>
        {locked&&<div style={{ position:'absolute',inset:0,background:'rgba(0,0,0,.35)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:13 }}>🔒</div>}
      </div>
      <div style={{ flex:1,minWidth:0 }}>
        <div style={{ fontSize:13,fontWeight:700,color:'var(--tx)',display:'flex',alignItems:'center',gap:5 }}>
          {theme.name}
          {theme.premium&&<span style={{ fontSize:9,fontWeight:700,padding:'1px 5px',borderRadius:8,background:'var(--amber-bg)',color:'var(--amber-t)' }}>PRO</span>}
        </div>
        <div style={{ fontSize:10,color:'var(--tx2)',marginTop:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{theme.desc}</div>
      </div>
      {isSel&&<span style={{ color:'var(--t4)',fontSize:16,flexShrink:0 }}>✓</span>}
    </div>
  )
}

function Spinner() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" style={{ animation:'spin .7s linear infinite',flexShrink:0 }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <circle cx="8" cy="8" r="6" fill="none" stroke="rgba(255,255,255,.3)" strokeWidth="2"/>
      <path d="M8 2 A6 6 0 0 1 14 8" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  )
}
