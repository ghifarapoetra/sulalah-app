'use client'
import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '../../../lib/supabase'
import FamilyTree from '../../../components/FamilyTree'
import PersonForm from '../../../components/PersonForm'
import DetailPanel from '../../../components/DetailPanel'
import PdfThemeModal, { THEMES } from '../../../components/PdfThemeModal'
import MiladBanner from '../../../components/MiladBanner'
import MembersPanel from '../../../components/MembersPanel'

export default function TreePage() {
  const { id: treeId } = useParams()
  const [tree, setTree] = useState(null)
  const [persons, setPersons] = useState([])
  const [selected, setSelected] = useState(null)
  const [view, setView] = useState('tree')
  const [editPerson, setEditPerson] = useState(null)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [theme, setTheme] = useState('light')
  const [showPdfModal, setShowPdfModal] = useState(false)
  const [showMembers, setShowMembers] = useState(false)
  const [userRole, setUserRole] = useState('owner')
  const router = useRouter()

  useEffect(() => {
    const saved = localStorage.getItem('sulalah-theme')
    if (saved) { setTheme(saved); document.documentElement.setAttribute('data-theme', saved) }
  }, [])

  useEffect(() => { document.documentElement.setAttribute('data-theme', theme) }, [theme])

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.push('/auth'); return }
      setUser(session.user)
      loadData(session.user.id)
    })
  }, [treeId, router])

  async function loadData(uid) {
    const supabase = createClient()
    const { data: treeData } = await supabase.from('trees').select('*, profiles(full_name)').eq('id', treeId).single()
    if (!treeData) { router.push('/dashboard'); return }
    setTree({ ...treeData, owner_name: treeData.profiles?.full_name })
    // Cek role user
    if (treeData.owner_id === uid) setUserRole('owner')
    else {
      const { data: mem } = await supabase.from('tree_members').select('role').eq('tree_id', treeId).eq('user_id', uid).single()
      setUserRole(mem?.role || 'viewer')
    }
    const { data: personsData } = await supabase.from('persons').select('*').eq('tree_id', treeId).order('created_at')
    setPersons(personsData || [])
    setLoading(false)
  }

  async function handleSave(formData) {
    const supabase = createClient()
    const payload = { ...formData, owner_id: user.id, tree_id: treeId }
    if (editPerson) await supabase.from('persons').update(payload).eq('id', editPerson.id)
    else await supabase.from('persons').insert(payload)
    await loadData(user.id)
    setView('tree'); setEditPerson(null)
  }

  async function handleDelete() {
    if (!editPerson) return
    const supabase = createClient()
    await supabase.from('persons').delete().eq('id', editPerson.id)
    if (selected === editPerson.id) setSelected(null)
    await loadData(user.id)
    setView('tree'); setEditPerson(null)
  }

  function toggleTheme() {
    const next = theme === 'light' ? 'dark' : 'light'
    setTheme(next); localStorage.setItem('sulalah-theme', next)
  }

  function handlePrint(themeId) {
    const t = THEMES.find(x => x.id === themeId) || THEMES[0]
    setShowPdfModal(false)
    const root = document.documentElement
    root.style.setProperty('--print-bg', t.preview.bg)
    root.style.setProperty('--print-card', t.preview.card)
    root.style.setProperty('--print-accent', t.preview.accent)
    root.style.setProperty('--print-text', t.preview.text)
    root.style.setProperty('--print-border', t.preview.border)
    root.setAttribute('data-print-theme', themeId)
    setTimeout(() => { window.print(); root.removeAttribute('data-print-theme') }, 200)
  }

  const canEdit = userRole === 'owner' || userRole === 'editor'
  const isOwner = userRole === 'owner'
  const selectedPerson = persons.find(p => p.id === selected)
  const isFirst = persons.length === 0

  if (loading) return <div style={{ minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',color:'var(--tx2)' }}>Memuat silsilah...</div>

  return (
    <main style={{ maxWidth:960,margin:'0 auto',padding:'0 16px 40px' }}>
      <div className="topbar no-print" style={{ borderRadius:'0 0 14px 14px',marginBottom:16 }}>
        <div style={{ display:'flex',alignItems:'center',gap:10 }}>
          <button onClick={()=>router.push('/dashboard')} style={{ background:'rgba(255,255,255,.15)',color:'#fff',border:'1px solid rgba(255,255,255,.3)',padding:'5px 10px',borderRadius:20,fontSize:12,cursor:'pointer' }}>← Semua Pohon</button>
          <div>
            <div className="topbar-title">🌳 {tree?.name}</div>
            <div className="topbar-sub">{persons.length} anggota · Role: {userRole==='owner'?'Pemilik':userRole==='editor'?'Editor':'Penonton'}</div>
          </div>
        </div>
        <div style={{ display:'flex',gap:8,alignItems:'center',flexWrap:'wrap' }}>
          {persons.length > 0 && <button onClick={()=>setShowPdfModal(true)} style={{ background:'rgba(255,255,255,.15)',color:'#fff',border:'1px solid rgba(255,255,255,.3)',padding:'6px 12px',borderRadius:20,fontSize:12,cursor:'pointer',fontWeight:600 }}>🖨️ Cetak</button>}
          {isOwner && <button onClick={()=>{ setShowMembers(!showMembers);setSelected(null) }} style={{ background:'rgba(255,255,255,.15)',color:'#fff',border:'1px solid rgba(255,255,255,.3)',padding:'6px 12px',borderRadius:20,fontSize:12,cursor:'pointer',fontWeight:600 }}>👥 Anggota</button>}
          {canEdit && view==='tree' && <button onClick={()=>{ setEditPerson(null);setView('form') }} style={{ background:'rgba(255,255,255,.15)',color:'#fff',border:'1px solid rgba(255,255,255,.3)',padding:'6px 14px',borderRadius:20,fontSize:13,cursor:'pointer',fontWeight:600 }}>+ Tambah</button>}
          <button onClick={toggleTheme} style={{ background:'rgba(255,255,255,.15)',color:'#fff',border:'1px solid rgba(255,255,255,.3)',padding:'6px 10px',borderRadius:20,fontSize:16,cursor:'pointer',lineHeight:1 }}>{theme==='light'?'🌙':'☀️'}</button>
        </div>
      </div>

      {isFirst && view==='tree' && !showMembers && (
        <div style={{ textAlign:'center',padding:'48px 20px' }}>
          <div style={{ fontSize:52,marginBottom:16 }}>🌳</div>
          <h2 style={{ fontSize:20,fontWeight:700,color:'var(--tx)',marginBottom:8 }}>Pohon ini masih kosong</h2>
          <p style={{ fontSize:14,color:'var(--tx2)',marginBottom:24 }}>Mulai dengan menambahkan anggota pertama pohon <strong>{tree?.name}</strong>.</p>
          {canEdit && <button className="btn btn-primary btn-pill" onClick={()=>{ setEditPerson(null);setView('form') }} style={{ fontSize:15,padding:'10px 32px' }}>Mulai Tambah →</button>}
        </div>
      )}

      {view==='tree' && persons.length>0 && !showMembers && (
        <>
          <FamilyTree persons={persons} selected={selected} onSelect={setSelected} theme={theme} treeName={tree?.name} />
          {selectedPerson && (
            <DetailPanel person={selectedPerson} persons={persons}
              onEdit={canEdit ? p=>{ setEditPerson(p);setView('form') } : null}
              onClose={()=>setSelected(null)} umrohLink={process.env.NEXT_PUBLIC_UMROH_LINK} />
          )}
        </>
      )}

      {showMembers && tree && (
        <MembersPanel tree={tree} currentUserId={user?.id} onClose={()=>setShowMembers(false)} />
      )}

      {view==='form' && canEdit && (
        <div className="card">
          <PersonForm person={editPerson} persons={persons} isFirst={isFirst}
            onSave={handleSave} onDelete={handleDelete}
            onCancel={()=>{ setView('tree');setEditPerson(null) }} />
        </div>
      )}

      {showPdfModal && <PdfThemeModal treeName={tree?.name} onPrint={handlePrint} onClose={()=>setShowPdfModal(false)} />}
    </main>
  )
}
