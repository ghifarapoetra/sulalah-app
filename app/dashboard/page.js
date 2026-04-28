'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../../lib/supabase'
import { getPlanLimits } from '../../lib/premium'
import TreeAvatar from '../../components/TreeAvatar'
import TreeIconPicker from '../../components/TreeIconPicker'

export default function Dashboard() {
  const [ownTrees, setOwnTrees] = useState([])
  const [sharedTrees, setSharedTrees] = useState([])
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showNew, setShowNew] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')
  const [editIconTree, setEditIconTree] = useState(null)
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.push('/auth'); return }
      setUser(session.user)
      loadData(session.user.id)
    })
  }, [router])

  async function loadData(uid) {
    const supabase = createClient()
    const { data: prof } = await supabase.from('profiles').select('*').eq('id', uid).single()
    setProfile(prof)
    const { data: own } = await supabase.from('trees').select('*').eq('owner_id', uid).order('created_at')
    const { data: memberships } = await supabase.from('tree_members').select('*, trees(*)').eq('user_id', uid)
    const { data: counts } = await supabase.from('persons').select('tree_id').eq('owner_id', uid)
    const countMap = {}
    counts?.forEach(p => { countMap[p.tree_id] = (countMap[p.tree_id] || 0) + 1 })
    setOwnTrees((own || []).map(t => ({ ...t, memberCount: countMap[t.id] || 0 })))
    setSharedTrees((memberships || []).map(m => ({ ...m.trees, role: m.role })).filter(Boolean))
    setLoading(false)
  }

  async function createTree() {
    const limits = getPlanLimits(profile?.is_premium)
    if (!newName.trim()) { setErr('Nama pohon harus diisi.'); return }
    if (ownTrees.length >= limits.maxTrees) {
      setErr(`Paket ${profile?.is_premium ? 'Premium' : 'Gratis'} sudah mencapai batas pohon.`)
      return
    }
    setSaving(true); setErr('')
    const supabase = createClient()
    const { data, error } = await supabase.from('trees')
      .insert({ name: newName.trim(), description: newDesc.trim(), owner_id: user.id, icon: '🌳' })
      .select().single()
    if (error) { setErr('Gagal membuat pohon.'); setSaving(false); return }
    setSaving(false); setShowNew(false); setNewName(''); setNewDesc('')
    router.push(`/tree/${data.id}`)
  }

  async function deleteTree(id) {
    if (!confirm('Hapus pohon ini beserta semua anggotanya?')) return
    const supabase = createClient()
    await supabase.from('trees').delete().eq('id', id)
    loadData(user.id)
  }

  async function saveTreeIcon(data) {
    if (!editIconTree) return
    const supabase = createClient()
    await supabase.from('trees').update(data).eq('id', editIconTree.id)
    setEditIconTree(null)
    loadData(user.id)
  }

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut(); router.push('/')
  }

  if (loading) return <div style={{ minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',color:'var(--tx2)' }}>Memuat...</div>

  const limits = getPlanLimits(profile?.is_premium)
  const canCreate = ownTrees.length < limits.maxTrees
  const isPremium = profile?.is_premium

  return (
    <main style={{ maxWidth:700,margin:'0 auto',padding:'0 16px 40px' }}>
      <div className="topbar" style={{ borderRadius:'0 0 16px 16px',marginBottom:24 }}>
        <div>
          <div className="topbar-title">🌳 Sulalah</div>
          <div className="topbar-sub" style={{ display:'flex',alignItems:'center',gap:6,marginTop:3 }}>
            Assalamu'alaikum, {profile?.full_name?.split(' ')[0] || 'Sahabat'} 🌙
            {isPremium && <span className="badge-premium">👑 Premium</span>}
          </div>
        </div>
        <div style={{ display:'flex',gap:8,alignItems:'center' }}>
          {!isPremium && (
            <button onClick={()=>router.push('/upgrade')} style={{ background:'#fcd34d',color:'#78350f',border:'none',padding:'7px 14px',borderRadius:20,fontSize:12,cursor:'pointer',fontWeight:700,display:'flex',alignItems:'center',gap:4 }}>
              👑 Upgrade Rp 29k
            </button>
          )}
          <button onClick={handleLogout} style={{ background:'transparent',color:'rgba(255,255,255,.7)',border:'1px solid rgba(255,255,255,.2)',padding:'7px 12px',borderRadius:20,fontSize:12,cursor:'pointer' }}>Keluar</button>
        </div>
      </div>

      {/* Pohon saya */}
      <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12 }}>
        <div>
          <h2 style={{ fontSize:16,fontWeight:700,color:'var(--tx)' }}>Pohon Saya</h2>
          <p style={{ fontSize:11,color:'var(--tx2)',marginTop:2 }}>{ownTrees.length}/{limits.maxTrees} pohon digunakan</p>
        </div>
        {canCreate && <button className="btn btn-primary" style={{ fontSize:12 }} onClick={()=>setShowNew(true)}>+ Pohon Baru</button>}
      </div>

      {!canCreate && (
        <div style={{ background:'var(--amber-bg)',border:'1px solid var(--amber-b)',borderRadius:12,padding:'12px 16px',marginBottom:12 }}>
          <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',gap:12,flexWrap:'wrap' }}>
            <div>
              <div style={{ fontSize:13,fontWeight:600,color:'var(--amber-t)' }}>
                {isPremium ? 'Batas 5 pohon Premium tercapai' : 'Batas 1 pohon Gratis tercapai'}
              </div>
              <div style={{ fontSize:12,color:'var(--tx2)',marginTop:2 }}>
                {isPremium ? 'Anda sudah memiliki 5 pohon keluarga.' : 'Upgrade untuk membuat hingga 5 pohon silsilah.'}
              </div>
            </div>
            {!isPremium && (
              <button onClick={()=>router.push('/upgrade')} className="btn btn-primary btn-pill" style={{ fontSize:12,whiteSpace:'nowrap',background:'var(--amber-t)',borderColor:'var(--amber-t)' }}>
                ✨ Upgrade Rp 29k
              </button>
            )}
          </div>
        </div>
      )}

      {showNew && (
        <div className="card" style={{ marginBottom:12 }}>
          <div style={{ fontSize:14,fontWeight:700,color:'var(--tx)',marginBottom:12 }}>🌱 Pohon Keluarga Baru</div>
          <div className="field"><label>Nama Pohon *</label><input value={newName} onChange={e=>setNewName(e.target.value)} placeholder="mis. Keluarga Besar H. Mashudi" autoFocus /></div>
          <div className="field"><label>Deskripsi</label><input value={newDesc} onChange={e=>setNewDesc(e.target.value)} placeholder="mis. Garis keturunan dari Salatiga" /></div>
          <div style={{ fontSize:11,color:'var(--tx3)',marginBottom:8 }}>💡 Setelah pohon dibuat, Anda bisa pilih ikon atau upload foto cover.</div>
          {err && <p style={{ color:'var(--rose-t)',fontSize:12,marginBottom:8 }}>⚠ {err}</p>}
          <div style={{ display:'flex',gap:8,justifyContent:'flex-end' }}>
            <button className="btn btn-ghost" onClick={()=>{ setShowNew(false);setErr('') }}>Batal</button>
            <button className="btn btn-primary" onClick={createTree} disabled={saving}>{saving?'Membuat...':'Buat'}</button>
          </div>
        </div>
      )}

      {ownTrees.length===0&&!showNew ? (
        <div style={{ textAlign:'center',padding:'40px 20px',background:'var(--surf)',border:'1px solid var(--bd)',borderRadius:12,marginBottom:16 }}>
          <div style={{ fontSize:40,marginBottom:12 }}>🌱</div>
          <h3 style={{ fontSize:16,fontWeight:700,color:'var(--tx)',marginBottom:8 }}>Belum ada pohon silsilah</h3>
          <button className="btn btn-primary btn-pill" onClick={()=>setShowNew(true)} style={{ fontSize:14,padding:'10px 28px' }}>+ Buat Pohon Pertama</button>
        </div>
      ) : (
        <div style={{ display:'grid',gap:10,marginBottom:24 }}>
          {ownTrees.map(tree => (
            <div key={tree.id} className="card" style={{ display:'flex',alignItems:'center',gap:12,cursor:'pointer' }} onClick={()=>router.push(`/tree/${tree.id}`)}>
              <TreeAvatar tree={tree} size={48} />
              <div style={{ flex:1,minWidth:0 }}>
                <div style={{ fontSize:14,fontWeight:700,color:'var(--tx)' }}>{tree.name}</div>
                {tree.description&&<div style={{ fontSize:12,color:'var(--tx2)' }}>{tree.description}</div>}
                <div style={{ fontSize:11,color:'var(--tx3)',marginTop:2 }}>{tree.memberCount} anggota · {new Date(tree.created_at).toLocaleDateString('id-ID',{day:'numeric',month:'long',year:'numeric'})}</div>
              </div>
              <div style={{ display:'flex',gap:5,flexShrink:0,flexWrap:'wrap',justifyContent:'flex-end' }} onClick={e=>e.stopPropagation()}>
                <button className="btn btn-ghost" style={{ fontSize:11,padding:'5px 9px' }} onClick={()=>setEditIconTree(tree)} title="Atur ikon/foto">🎨</button>
                <button className="btn btn-ghost" style={{ fontSize:11,padding:'5px 10px' }} onClick={()=>router.push(`/tree/${tree.id}`)}>Buka →</button>
                <button className="btn btn-danger" style={{ fontSize:11,padding:'5px 10px' }} onClick={()=>deleteTree(tree.id)}>Hapus</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {sharedTrees.length>0&&(
        <>
          <h2 style={{ fontSize:16,fontWeight:700,color:'var(--tx)',marginBottom:12 }}>Diundang ke Pohon Lain</h2>
          <div style={{ display:'grid',gap:10 }}>
            {sharedTrees.map(tree=>(
              <div key={tree.id} className="card" style={{ display:'flex',alignItems:'center',gap:12,cursor:'pointer' }} onClick={()=>router.push(`/tree/${tree.id}`)}>
                <TreeAvatar tree={tree} size={48} style={{ background:'var(--amber-bg)' }} />
                <div style={{ flex:1,minWidth:0 }}>
                  <div style={{ fontSize:14,fontWeight:700,color:'var(--tx)' }}>{tree.name}</div>
                  <div style={{ fontSize:11,color:'var(--tx3)',marginTop:2 }}>Role: <span style={{ color:'var(--amber-t)',fontWeight:600 }}>{tree.role==='editor'?'Editor':'Penonton'}</span></div>
                </div>
                <button className="btn btn-ghost" style={{ fontSize:11,padding:'5px 10px' }}>Buka →</button>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Info paket */}
      {!isPremium&&(
        <div style={{ marginTop:28,background:'var(--surf)',border:'1px solid var(--bd)',borderRadius:12,padding:'16px 18px' }}>
          <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12 }}>
            <div style={{ fontSize:13,fontWeight:700,color:'var(--tx)' }}>Paket Gratis</div>
            <span style={{ fontSize:10,background:'var(--t2)',color:'var(--t6)',padding:'2px 10px',borderRadius:20,fontWeight:700 }}>AKTIF</span>
          </div>
          <div style={{ fontSize:12,color:'var(--tx2)',lineHeight:1.8,marginBottom:14 }}>
            ✓ 1 pohon keluarga · ✓ Anggota unlimited · ✓ Deteksi mahram<br/>
            ✓ Foto & kontak · ✓ Panel doa wafat · ✓ 5 tema PDF
          </div>
          <button onClick={()=>router.push('/upgrade')} className="btn btn-primary btn-pill" style={{ width:'100%',justifyContent:'center',fontSize:13 }}>
            ✨ Upgrade Premium — Rp 29.000 seumur hidup
          </button>
        </div>
      )}

      {/* Footer */}
      <footer style={{ marginTop:40,paddingTop:20,borderTop:'1px solid var(--bd)',textAlign:'center' }}>
        <div style={{ fontSize:11,color:'var(--tx3)',marginBottom:6 }}>
          <a href="/privacy" style={{ color:'var(--tx2)',textDecoration:'none',marginRight:10 }}>Kebijakan Privasi</a>
          ·
          <a href="/terms" style={{ color:'var(--tx2)',textDecoration:'none',margin:'0 10px' }}>Syarat & Ketentuan</a>
          ·
          <a href="/hapus-akun" style={{ color:'var(--tx2)',textDecoration:'none',marginLeft:10 }}>Hapus Akun</a>
        </div>
        <div style={{ fontSize:10,color:'var(--tx3)' }}>
          📧 halo@sulalah.my.id · 💬 <a href="https://wa.me/6285175132050" target="_blank" rel="noreferrer" style={{ color:'var(--tx3)',textDecoration:'none' }}>WhatsApp Support</a>
        </div>
      </footer>

      {/* Icon picker modal */}
      {editIconTree && (
        <TreeIconPicker
          treeId={editIconTree.id}
          currentIcon={editIconTree.icon}
          currentCoverUrl={editIconTree.cover_photo_url}
          onSave={saveTreeIcon}
          onClose={()=>setEditIconTree(null)}
        />
      )}
    </main>
  )
}
