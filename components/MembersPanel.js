'use client'
import { useState, useEffect } from 'react'
import { createClient } from '../lib/supabase'

const ROLE_LABEL = { owner: 'Pemilik', editor: 'Editor', viewer: 'Penonton' }
const ROLE_DESC = { owner: 'Akses penuh', editor: 'Bisa tambah & edit anggota', viewer: 'Hanya bisa lihat' }
const ROLE_COLOR = { owner: 'var(--t5)', editor: 'var(--amber-t)', viewer: 'var(--tx3)' }

export default function MembersPanel({ tree, currentUserId, onClose }) {
  const [members, setMembers] = useState([])
  const [invites, setInvites] = useState([])
  const [loading, setLoading] = useState(true)
  const [inviteRole, setInviteRole] = useState('editor')
  const [creating, setCreating] = useState(false)
  const [newInvite, setNewInvite] = useState(null)
  const [copied, setCopied] = useState(false)
  const isOwner = tree.owner_id === currentUserId

  useEffect(() => { loadData() }, [tree.id])

  async function loadData() {
    const supabase = createClient()
    const { data: mems } = await supabase
      .from('tree_members')
      .select('*, profiles(full_name)')
      .eq('tree_id', tree.id)
    const { data: invs } = await supabase
      .from('tree_invites')
      .select('*')
      .eq('tree_id', tree.id)
      .is('used_by', null)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
    setMembers(mems || [])
    setInvites(invs || [])
    setLoading(false)
  }

  async function createInvite() {
    setCreating(true)
    const supabase = createClient()
    const { data, error } = await supabase
      .from('tree_invites')
      .insert({ tree_id: tree.id, invited_by: currentUserId, role: inviteRole })
      .select().single()
    if (!error) {
      setNewInvite(data)
      loadData()
    }
    setCreating(false)
  }

  async function revokeInvite(id) {
    const supabase = createClient()
    await supabase.from('tree_invites').delete().eq('id', id)
    loadData()
  }

  async function removeMember(memberId) {
    if (!confirm('Hapus anggota ini dari pohon?')) return
    const supabase = createClient()
    await supabase.from('tree_members').delete().eq('id', memberId)
    loadData()
  }

  function getInviteUrl(token) {
    return `${window.location.origin}/invite/${token}`
  }

  async function copyLink(token) {
    await navigator.clipboard.writeText(getInviteUrl(token))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="card" style={{ marginTop: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--tx)' }}>👥 Anggota Pohon</div>
          <div style={{ fontSize: 12, color: 'var(--tx2)', marginTop: 2 }}>{tree.name}</div>
        </div>
        <button className="btn btn-ghost" onClick={onClose} style={{ fontSize: 12, padding: '5px 10px' }}>✕ Tutup</button>
      </div>

      {/* Daftar anggota */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--tx3)', letterSpacing: '.8px', textTransform: 'uppercase', marginBottom: 8 }}>Anggota Aktif ({members.length + 1})</div>

        {/* Owner sendiri */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--bd)' }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--t2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: 'var(--t6)', flexShrink: 0 }}>
            {(tree.owner_name || 'P').charAt(0).toUpperCase()}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--tx)' }}>{tree.owner_name || 'Anda'} <span style={{ fontSize: 10, color: 'var(--t4)' }}>(Anda)</span></div>
            <div style={{ fontSize: 11, color: 'var(--tx3)' }}>Pemilik pohon</div>
          </div>
          <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 20, background: 'var(--t2)', color: 'var(--t6)' }}>Pemilik</span>
        </div>

        {members.map(m => (
          <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--bd)' }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--surf)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: 'var(--tx2)', flexShrink: 0 }}>
              {(m.profiles?.full_name || '?').charAt(0).toUpperCase()}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--tx)' }}>{m.profiles?.full_name || 'Anggota'}</div>
              <div style={{ fontSize: 11, color: 'var(--tx3)' }}>{ROLE_DESC[m.role]}</div>
            </div>
            <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 20, background: 'var(--surf)', color: ROLE_COLOR[m.role], border: '1px solid var(--bd)' }}>{ROLE_LABEL[m.role]}</span>
            {isOwner && (
              <button onClick={() => removeMember(m.id)} style={{ background: 'none', border: 'none', color: 'var(--rose-t)', cursor: 'pointer', fontSize: 14, padding: '0 4px' }} title="Hapus anggota">✕</button>
            )}
          </div>
        ))}
      </div>

      {/* Buat undangan */}
      {isOwner && (
        <div style={{ background: 'var(--surf)', border: '1px solid var(--bd)', borderRadius: 10, padding: '12px 14px', marginBottom: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--tx)', marginBottom: 10 }}>🔗 Buat Link Undangan</div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
            {['editor', 'viewer'].map(r => (
              <button key={r} onClick={() => setInviteRole(r)}
                style={{ flex: 1, padding: '7px', borderRadius: 8, border: `1px solid ${inviteRole === r ? 'var(--t4)' : 'var(--bd)'}`, background: inviteRole === r ? 'var(--t2)' : 'transparent', color: inviteRole === r ? 'var(--t6)' : 'var(--tx2)', cursor: 'pointer', fontSize: 12, fontWeight: 600, transition: 'all .15s' }}>
                {ROLE_LABEL[r]}
                <div style={{ fontSize: 10, fontWeight: 400, color: inviteRole === r ? 'var(--t5)' : 'var(--tx3)', marginTop: 2 }}>{ROLE_DESC[r]}</div>
              </button>
            ))}
          </div>
          <button className="btn btn-primary" onClick={createInvite} disabled={creating} style={{ width: '100%', justifyContent: 'center', fontSize: 13 }}>
            {creating ? 'Membuat link...' : '+ Buat Link Undangan'}
          </button>
        </div>
      )}

      {/* Link undangan baru */}
      {newInvite && (
        <div style={{ background: 'var(--t2)', border: '1px solid var(--t3)', borderRadius: 10, padding: '12px 14px', marginBottom: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--t6)', marginBottom: 8 }}>✅ Link siap dibagikan!</div>
          <div style={{ display: 'flex', gap: 6 }}>
            <input readOnly value={getInviteUrl(newInvite.token)} style={{ flex: 1, fontSize: 11, padding: '6px 10px', borderRadius: 6, border: '1px solid var(--t3)', background: '#fff', color: 'var(--tx)' }} />
            <button onClick={() => copyLink(newInvite.token)} className="btn btn-primary" style={{ fontSize: 12, padding: '6px 12px', whiteSpace: 'nowrap' }}>
              {copied ? '✓ Tersalin!' : '📋 Salin'}
            </button>
          </div>
          <div style={{ fontSize: 10, color: 'var(--t6)', marginTop: 6 }}>Link berlaku 7 hari · Role: {ROLE_LABEL[newInvite.role]}</div>
        </div>
      )}

      {/* Link aktif */}
      {invites.length > 0 && (
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--tx3)', letterSpacing: '.8px', textTransform: 'uppercase', marginBottom: 8 }}>Link Undangan Aktif ({invites.length})</div>
          {invites.map(inv => (
            <div key={inv.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 0', borderBottom: '1px solid var(--bd)' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, color: 'var(--tx)', fontFamily: 'monospace' }}>...{inv.token.slice(-12)}</div>
                <div style={{ fontSize: 10, color: 'var(--tx3)' }}>Role: {ROLE_LABEL[inv.role]} · Berlaku hingga {new Date(inv.expires_at).toLocaleDateString('id-ID')}</div>
              </div>
              <button onClick={() => copyLink(inv.token)} style={{ background: 'none', border: '1px solid var(--bd)', borderRadius: 6, padding: '4px 8px', fontSize: 11, cursor: 'pointer', color: 'var(--tx2)' }}>📋</button>
              {isOwner && <button onClick={() => revokeInvite(inv.id)} style={{ background: 'none', border: 'none', color: 'var(--rose-t)', cursor: 'pointer', fontSize: 14 }}>✕</button>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
