'use client'
import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '../../../lib/supabase'

export default function InvitePage() {
  const { token } = useParams()
  const [invite, setInvite] = useState(null)
  const [tree, setTree] = useState(null)
  const [status, setStatus] = useState('loading') // loading | valid | invalid | expired | joined | error
  const [user, setUser] = useState(null)
  const [joining, setJoining] = useState(false)
  const router = useRouter()

  useEffect(() => {
    init()
  }, [token])

  async function init() {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    setUser(session?.user || null)

    // Cek invite valid
    const { data: inv } = await supabase
      .from('tree_invites')
      .select('*, trees(name, owner_id)')
      .eq('token', token)
      .single()

    if (!inv) { setStatus('invalid'); return }
    if (inv.used_by) { setStatus('joined'); return }
    if (new Date(inv.expires_at) < new Date()) { setStatus('expired'); return }

    setInvite(inv)
    setTree(inv.trees)
    setStatus('valid')
  }

  async function acceptInvite() {
    if (!user) { router.push(`/auth?redirect=/invite/${token}`); return }
    setJoining(true)
    const supabase = createClient()

    // Cek sudah jadi member?
    const { data: existing } = await supabase
      .from('tree_members')
      .select('id')
      .eq('tree_id', invite.tree_id)
      .eq('user_id', user.id)
      .single()

    if (!existing) {
      await supabase.from('tree_members').insert({
        tree_id: invite.tree_id,
        user_id: user.id,
        role: invite.role
      })
      // Mark invite as used
      await supabase.from('tree_invites').update({
        used_by: user.id,
        used_at: new Date().toISOString()
      }).eq('id', invite.id)
    }

    router.push(`/tree/${invite.tree_id}`)
  }

  const ROLE_LABEL = { editor: 'Editor — bisa tambah & edit anggota', viewer: 'Penonton — hanya bisa lihat' }

  return (
    <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: 'var(--bg)' }}>
      <div style={{ maxWidth: 400, width: '100%', textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🌳</div>
        <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--t5)', marginBottom: 6 }}>Sulalah</div>

        {status === 'loading' && (
          <p style={{ color: 'var(--tx2)' }}>Memeriksa undangan...</p>
        )}

        {status === 'invalid' && (
          <div className="card" style={{ marginTop: 20 }}>
            <div style={{ fontSize: 32, marginBottom: 10 }}>❌</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--tx)', marginBottom: 8 }}>Link tidak valid</div>
            <p style={{ fontSize: 13, color: 'var(--tx2)', marginBottom: 16 }}>Link undangan ini tidak ditemukan atau sudah tidak aktif.</p>
            <a href="/" className="btn btn-primary btn-pill" style={{ textDecoration: 'none', fontSize: 13 }}>Ke Beranda</a>
          </div>
        )}

        {status === 'expired' && (
          <div className="card" style={{ marginTop: 20 }}>
            <div style={{ fontSize: 32, marginBottom: 10 }}>⏰</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--tx)', marginBottom: 8 }}>Link sudah kadaluarsa</div>
            <p style={{ fontSize: 13, color: 'var(--tx2)', marginBottom: 16 }}>Link undangan berlaku 7 hari. Minta link baru dari pemilik pohon.</p>
            <a href="/" className="btn btn-ghost btn-pill" style={{ textDecoration: 'none', fontSize: 13 }}>Ke Beranda</a>
          </div>
        )}

        {status === 'valid' && tree && invite && (
          <div className="card" style={{ marginTop: 20 }}>
            <div style={{ fontSize: 13, color: 'var(--tx2)', marginBottom: 4 }}>Anda diundang untuk bergabung ke pohon keluarga</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--tx)', marginBottom: 8 }}>🌳 {tree.name}</div>
            <div style={{ background: 'var(--surf)', border: '1px solid var(--bd)', borderRadius: 8, padding: '8px 12px', marginBottom: 16, fontSize: 12, color: 'var(--tx2)' }}>
              Role Anda: <strong style={{ color: 'var(--t5)' }}>{ROLE_LABEL[invite.role]}</strong>
            </div>

            {user ? (
              <button className="btn btn-primary btn-pill" onClick={acceptInvite} disabled={joining} style={{ width: '100%', justifyContent: 'center', fontSize: 14 }}>
                {joining ? 'Bergabung...' : '✅ Terima Undangan & Buka Pohon'}
              </button>
            ) : (
              <div>
                <p style={{ fontSize: 12, color: 'var(--tx2)', marginBottom: 12 }}>Login atau daftar dulu untuk bergabung.</p>
                <a href={`/auth?redirect=/invite/${token}`} className="btn btn-primary btn-pill" style={{ textDecoration: 'none', fontSize: 14, display: 'block', textAlign: 'center' }}>
                  Login / Daftar →
                </a>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  )
}
