'use client'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '../lib/supabase'

const EMPTY = { name:'', gender:'male', photo_url:'', birth_year:'', death_year:'', phone:'', email:'', father_id:'', mother_id:'', notes:'', is_self:false }

export default function PersonForm({ person, persons, onSave, onDelete, onCancel, isFirst }) {
  const [form, setForm] = useState(EMPTY)
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [err, setErr] = useState('')
  const [photoPreview, setPhotoPreview] = useState(null)
  const fileRef = useRef(null)

  useEffect(()=>{
    if (person) {
      setForm({ ...EMPTY, ...person, birth_year:person.birth_year||'', death_year:person.death_year||'', father_id:person.father_id||'', mother_id:person.mother_id||'' })
      setPhotoPreview(person.photo_url||null)
    } else {
      setForm(EMPTY); setPhotoPreview(null)
    }
  }, [person])

  const set = (k,v) => setForm(f=>({...f,[k]:v}))

  async function handlePhotoUpload(e) {
    const file = e.target.files[0]; if (!file) return
    if (file.size > 3 * 1024 * 1024) { setErr('Ukuran foto maksimal 3MB.'); return }
    setUploading(true); setErr('')
    const supabase = createClient()
    const ext = file.name.split('.').pop()
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const { data, error } = await supabase.storage.from('photos').upload(filename, file, { upsert:true })
    if (error) { setErr('Gagal upload foto. Coba lagi.'); setUploading(false); return }
    const { data: { publicUrl } } = supabase.storage.from('photos').getPublicUrl(filename)
    set('photo_url', publicUrl)
    setPhotoPreview(publicUrl)
    setUploading(false)
  }

  async function handleSave() {
    if (!form.name.trim()) { setErr('Nama harus diisi.'); return }
    setErr(''); setLoading(true)
    await onSave({
      ...form,
      birth_year: form.birth_year ? parseInt(form.birth_year) : null,
      death_year: form.death_year ? parseInt(form.death_year) : null,
      father_id: form.father_id || null,
      mother_id: form.mother_id || null,
      is_self: isFirst ? true : form.is_self
    })
    setLoading(false)
  }

  const fathers = persons.filter(p=>p.gender==='male'&&p.id!==person?.id)
  const mothers = persons.filter(p=>p.gender==='female'&&p.id!==person?.id)
  const ini = n => n.trim().split(/\s+/).slice(0,2).map(w=>w[0]||'').join('').toUpperCase()||'?'

  return (
    <div>
      <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:18 }}>
        <h2 style={{ fontSize:17,fontWeight:700,color:'var(--tx)',letterSpacing:'-.3px' }}>
          {isFirst?'Siapa Anda dalam keluarga ini?':person?'Edit Profil':'Tambah Anggota'}
        </h2>
        {!isFirst && <button className="btn btn-ghost" onClick={onCancel} style={{ fontSize:12 }}>← Kembali</button>}
      </div>

      {/* Photo upload */}
      <div style={{ display:'flex',gap:16,alignItems:'center',marginBottom:16 }}>
        <div style={{ width:64,height:64,borderRadius:'50%',background:'var(--surf)',border:'1px solid var(--bd)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,fontWeight:700,color:'var(--tx2)',position:'relative',overflow:'hidden',flexShrink:0 }}>
          {photoPreview ? <img src={photoPreview} style={{ position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'cover' }} onError={()=>setPhotoPreview(null)} /> : (form.name?ini(form.name):'?')}
        </div>
        <div>
          <div style={{ fontSize:12,color:'var(--tx2)',marginBottom:6 }}>Foto profil</div>
          <button type="button" className="btn btn-ghost" style={{ fontSize:12,padding:'5px 12px' }} onClick={()=>fileRef.current?.click()} disabled={uploading}>
            {uploading?'Mengupload...':'📷 Upload Foto'}
          </button>
          <input ref={fileRef} type="file" accept="image/*" onChange={handlePhotoUpload} style={{ display:'none' }} />
          <div style={{ fontSize:10,color:'var(--tx3)',marginTop:4 }}>JPG/PNG, maks 3MB</div>
        </div>
      </div>

      <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0 12px' }}>
        <div className="field" style={{ gridColumn:'1/-1' }}>
          <label>Nama Lengkap *</label>
          <input value={form.name} onChange={e=>set('name',e.target.value)} placeholder="mis. Ahmad bin Hasan Al-Jawi" />
        </div>
        <div className="field">
          <label>Jenis Kelamin</label>
          <select value={form.gender} onChange={e=>set('gender',e.target.value)}>
            <option value="male">Laki-laki</option>
            <option value="female">Perempuan</option>
          </select>
        </div>
        <div className="field">
          <label>Tahun Lahir</label>
          <input type="number" value={form.birth_year} onChange={e=>set('birth_year',e.target.value)} placeholder="1975" min="1800" max="2035" />
        </div>
        <div className="field">
          <label>Tahun Wafat <span style={{ color:'var(--tx3)',fontWeight:400 }}>(kosong = masih hidup)</span></label>
          <input type="number" value={form.death_year} onChange={e=>set('death_year',e.target.value)} placeholder="2020" min="1800" max="2035" />
        </div>
        <div className="field">
          <label>No. HP / WhatsApp</label>
          <input value={form.phone} onChange={e=>set('phone',e.target.value)} placeholder="+62 812 xxxx xxxx" />
        </div>
        <div className="field">
          <label>Email</label>
          <input type="email" value={form.email} onChange={e=>set('email',e.target.value)} placeholder="nama@email.com" />
        </div>
        {!isFirst && <>
          <div className="field">
            <label>Ayah</label>
            <select value={form.father_id} onChange={e=>set('father_id',e.target.value)}>
              <option value="">— tidak ada / tidak diketahui</option>
              {fathers.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Ibu</label>
            <select value={form.mother_id} onChange={e=>set('mother_id',e.target.value)}>
              <option value="">— tidak ada / tidak diketahui</option>
              {mothers.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
        </>}
        <div className="field" style={{ gridColumn:'1/-1' }}>
          <label>Catatan / Riwayat Singkat</label>
          <textarea value={form.notes} onChange={e=>set('notes',e.target.value)} placeholder="mis. Pengasuh Pesantren Al-Falah, lahir di Salatiga..." />
        </div>
      </div>

      {err && <p style={{ color:'var(--rose-t)',fontSize:13,marginBottom:8 }}>⚠ {err}</p>}
      <div style={{ display:'flex',gap:8,justifyContent:'flex-end',alignItems:'center',marginTop:4 }}>
        {person && <button className="btn btn-danger" onClick={onDelete} style={{ marginRight:'auto',fontSize:12 }}>Hapus</button>}
        {!isFirst && <button className="btn btn-ghost" onClick={onCancel} style={{ fontSize:13 }}>Batal</button>}
        <button className="btn btn-primary" onClick={handleSave} disabled={loading||uploading}>
          {loading?'Menyimpan...':'💾 Simpan'}
        </button>
      </div>
    </div>
  )
}
