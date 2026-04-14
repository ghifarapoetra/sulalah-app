'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../../lib/supabase'
import FamilyTree from '../../components/FamilyTree'
import PersonForm from '../../components/PersonForm'
import DetailPanel from '../../components/DetailPanel'

export default function TreePage() {
  const [persons, setPersons] = useState([])
  const [selected, setSelected] = useState(null)
  const [view, setView] = useState('tree')
  const [editPerson, setEditPerson] = useState(null)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [theme, setTheme] = useState('light')
  const router = useRouter()

  // Apply theme to document
  useEffect(()=>{
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  // Load saved theme
  useEffect(()=>{
    const saved = localStorage.getItem('nasab-theme')
    if (saved) { setTheme(saved); document.documentElement.setAttribute('data-theme', saved) }
  }, [])

  function toggleTheme() {
    const next = theme==='light'?'dark':'light'
    setTheme(next); localStorage.setItem('nasab-theme', next)
  }

  useEffect(()=>{
    const supabase = createClient()
    supabase.auth.getSession().then(({ data: { session } })=>{
      if (!session) { router.push('/auth'); return }
      setUser(session.user); loadPersons(session.user.id)
    })
  }, [router])

  async function loadPersons(uid) {
    const supabase = createClient()
    const { data } = await supabase.from('persons').select('*').eq('owner_id', uid).order('created_at')
    setPersons(data||[]); setLoading(false)
  }

  async function handleSave(formData) {
    const supabase = createClient()
    if (editPerson) await supabase.from('persons').update(formData).eq('id', editPerson.id)
    else await supabase.from('persons').insert({ ...formData, owner_id:user.id })
    await loadPersons(user.id)
    setView('tree'); setEditPerson(null)
  }

  async function handleDelete() {
    if (!editPerson) return
    const supabase = createClient()
    await supabase.from('persons').delete().eq('id', editPerson.id)
    if (selected===editPerson.id) setSelected(null)
    await loadPersons(user.id)
    setView('tree'); setEditPerson(null)
  }

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut(); router.push('/')
  }

  function handlePrint() {
    window.print()
  }

  const selectedPerson = persons.find(p=>p.id===selected)
  const selfPerson = persons.find(p=>p.is_self)
  const isFirst = persons.length===0

  if (loading) return (
    <div style={{ minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',color:'var(--tx2)' }}>
      Memuat silsilah...
    </div>
  )

  return (
    <main style={{ maxWidth:960,margin:'0 auto',padding:'0 16px 40px' }}>
      {/* Topbar */}
      <div className="topbar no-print" style={{ borderRadius:'0 0 14px 14px',marginBottom:16 }}>
        <div>
          <div className="topbar-title">🌳 Nasab</div>
          <div className="topbar-sub">
            {selfPerson?`Silsilah keluarga ${selfPerson.name} · ${persons.length} anggota`:`${persons.length} anggota keluarga`}
          </div>
        </div>
        <div style={{ display:'flex',gap:8,alignItems:'center',flexWrap:'wrap' }}>
          {view==='tree' && persons.length>0 && (
            <button onClick={handlePrint} style={{ background:'rgba(255,255,255,.15)',color:'#fff',border:'1px solid rgba(255,255,255,.3)',padding:'6px 14px',borderRadius:20,fontSize:12,cursor:'pointer',fontWeight:600 }}>
              🖨️ Cetak / PDF
            </button>
          )}
          {view==='tree' && (
            <button onClick={()=>{ setEditPerson(null); setView('form') }} style={{ background:'rgba(255,255,255,.15)',color:'#fff',border:'1px solid rgba(255,255,255,.3)',padding:'6px 16px',borderRadius:20,fontSize:13,cursor:'pointer',fontWeight:600 }}>
              + Tambah Anggota
            </button>
          )}
          {/* Theme toggle */}
          <button onClick={toggleTheme} title={theme==='light'?'Mode Gelap':'Mode Terang'} style={{ background:'rgba(255,255,255,.15)',color:'#fff',border:'1px solid rgba(255,255,255,.3)',padding:'6px 10px',borderRadius:20,fontSize:16,cursor:'pointer',lineHeight:1 }}>
            {theme==='light'?'🌙':'☀️'}
          </button>
          <button onClick={handleLogout} style={{ background:'transparent',color:'rgba(255,255,255,.7)',border:'1px solid rgba(255,255,255,.2)',padding:'6px 12px',borderRadius:20,fontSize:12,cursor:'pointer' }}>
            Keluar
          </button>
        </div>
      </div>

      {/* Empty state */}
      {isFirst && view==='tree' && (
        <div style={{ textAlign:'center',padding:'48px 20px' }}>
          <div style={{ fontSize:52,marginBottom:16 }}>🌳</div>
          <h2 style={{ fontSize:20,fontWeight:700,color:'var(--tx)',marginBottom:8 }}>Pohon nasab Anda masih kosong</h2>
          <p style={{ fontSize:14,color:'var(--tx2)',marginBottom:24 }}>Mulai dengan menambahkan diri Anda sebagai titik awal silsilah.</p>
          <button className="btn btn-primary btn-pill" onClick={()=>{ setEditPerson(null); setView('form') }} style={{ fontSize:15,padding:'10px 32px' }}>
            Mulai Tambah Anggota →
          </button>
        </div>
      )}

      {/* Tree */}
      {view==='tree' && persons.length>0 && (
        <>
          <FamilyTree persons={persons} selected={selected} onSelect={setSelected} theme={theme} />
          {selectedPerson && (
            <DetailPanel person={selectedPerson} persons={persons}
              onEdit={p=>{ setEditPerson(p); setView('form') }}
              onClose={()=>setSelected(null)} />
          )}
        </>
      )}

      {/* Form */}
      {view==='form' && (
        <div className="card">
          <PersonForm person={editPerson} persons={persons} isFirst={isFirst}
            onSave={handleSave} onDelete={handleDelete}
            onCancel={()=>{ setView('tree'); setEditPerson(null) }} />
        </div>
      )}
    </main>
  )
}
