'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../../lib/supabase'
import { calculateFaraid, formatResult } from '../../lib/faraid'

export default function WarisPage() {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [trees, setTrees] = useState([])
  const [persons, setPersons] = useState([])
  const [marriages, setMarriages] = useState([])
  const [selectedTree, setSelectedTree] = useState(null)
  const [selectedDeceased, setSelectedDeceased] = useState(null)
  const [harta, setHarta] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(true)
  const [calculating, setCalculating] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { router.push('/auth'); return }
      setUser(session.user)
      const [{ data: profileData }, { data: treesData }] = await Promise.all([
        supabase.from('profiles').select('is_premium, full_name').eq('id', session.user.id).single(),
        supabase.from('trees').select('*').eq('owner_id', session.user.id).order('created_at'),
      ])
      setProfile(profileData)
      setTrees(treesData || [])
      setLoading(false)
    })
  }, [])

  async function loadTree(treeId) {
    const supabase = createClient()
    const [{ data: personsData }, { data: marriagesData }] = await Promise.all([
      supabase.from('persons').select('*').eq('tree_id', treeId),
      supabase.from('marriages').select('*').eq('tree_id', treeId).catch(() => ({ data: [] })),
    ])
    setPersons(personsData || [])
    setMarriages(marriagesData || [])
    setSelectedDeceased(null)
    setResult(null)
  }

  function handleCalculate() {
    if (!selectedDeceased) return
    setCalculating(true)
    setTimeout(() => {
      const raw = calculateFaraid(selectedDeceased, persons, marriages)
      const nominalHarta = harta ? parseInt(harta.replace(/\D/g, '')) : null
      const formatted = formatResult(raw, nominalHarta)
      setResult({ raw, formatted, nominalHarta })
      setCalculating(false)
    }, 300)
  }

  function fmtRupiah(n) {
    if (!n) return ''
    return 'Rp ' + n.toLocaleString('id-ID')
  }

  function handleHartaInput(e) {
    const raw = e.target.value.replace(/\D/g, '')
    setHarta(raw ? parseInt(raw).toLocaleString('id-ID') : '')
  }

  const deceasedPerson = persons.find(p => p.id === selectedDeceased)
  const aliveCandidates = persons.filter(p => !p.death_year)
  const deceasedCandidates = persons.filter(p => p.death_year)
    .sort((a, b) => (a.name || '').localeCompare(b.name || '', 'id'))

  if (loading) return (
    <div style={{ minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'var(--bg)' }}>
      <div style={{ color:'var(--tx2)' }}>Memuat...</div>
    </div>
  )

  if (!profile?.is_premium) return (
    <div style={{ minHeight:'100vh',background:'var(--bg)',display:'flex',alignItems:'center',justifyContent:'center',padding:20 }}>
      <div style={{ textAlign:'center',maxWidth:380 }}>
        <div style={{ fontSize:52,marginBottom:16 }}>⚖️</div>
        <h2 style={{ fontSize:22,fontWeight:800,color:'var(--tx)',marginBottom:8 }}>Kalkulator Waris Faraid</h2>
        <p style={{ fontSize:14,color:'var(--tx2)',lineHeight:1.7,marginBottom:20 }}>
          Fitur ini eksklusif untuk pengguna <strong>Sulalah Premium</strong>. Hitung pembagian waris Islam (faraid) secara akurat berdasarkan data pohon keluargamu.
        </p>
        <button className="btn btn-primary btn-pill" style={{ fontSize:15,padding:'12px 28px',marginBottom:12 }}
          onClick={() => router.push('/upgrade')}>
          👑 Upgrade Premium — Rp 29.000
        </button>
        <div><button className="btn btn-ghost" style={{ fontSize:13 }} onClick={() => router.back()}>← Kembali</button></div>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight:'100vh',background:'var(--bg)',paddingBottom:40 }}>
      <div className="topbar" style={{ borderRadius:'0 0 16px 16px',marginBottom:0 }}>
        <div>
          <div className="topbar-title">⚖️ Kalkulator Waris</div>
          <div className="topbar-sub">Faraid · Mazhab Syafi'i</div>
        </div>
        <button onClick={() => router.back()} style={{ background:'rgba(255,255,255,.15)',color:'#fff',border:'1px solid rgba(255,255,255,.2)',padding:'7px 14px',borderRadius:20,fontSize:12,cursor:'pointer',fontWeight:600 }}>← Kembali</button>
      </div>

      <div style={{ maxWidth:680,margin:'0 auto',padding:'20px 16px' }}>

        {/* Step 1 — Pilih pohon */}
        <div className="card" style={{ marginBottom:14 }}>
          <div className="divider"><span>1 · PILIH POHON KELUARGA</span></div>
          <div style={{ display:'grid',gap:8,gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))' }}>
            {trees.map(t => (
              <button key={t.id}
                onClick={() => { setSelectedTree(t.id); loadTree(t.id) }}
                style={{ padding:'12px 14px',borderRadius:12,border:`2px solid ${selectedTree===t.id?'var(--t4)':'var(--bd)'}`,background:selectedTree===t.id?'var(--t2)':'var(--card)',cursor:'pointer',textAlign:'left',transition:'all .15s' }}>
                <div style={{ fontSize:18,marginBottom:4 }}>{t.icon || '🌳'}</div>
                <div style={{ fontSize:13,fontWeight:700,color:selectedTree===t.id?'var(--t6)':'var(--tx)' }}>{t.name}</div>
                <div style={{ fontSize:10,color:'var(--tx3)',marginTop:2 }}>{t.description || ''}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Step 2 — Pilih almarhum/ah */}
        {selectedTree && (
          <div className="card" style={{ marginBottom:14 }}>
            <div className="divider"><span>2 · SIAPA YANG MENINGGAL?</span></div>
            {deceasedCandidates.length === 0 ? (
              <div style={{ textAlign:'center',padding:'20px',color:'var(--tx3)',fontSize:13 }}>
                Belum ada anggota yang tercatat wafat di pohon ini.<br/>
                <span style={{ fontSize:11 }}>Set tahun wafat di profil anggota terlebih dahulu.</span>
              </div>
            ) : (
              <div style={{ display:'grid',gap:8 }}>
                {deceasedCandidates.map(p => (
                  <button key={p.id}
                    onClick={() => { setSelectedDeceased(p.id); setResult(null) }}
                    style={{ padding:'12px 14px',borderRadius:12,border:`2px solid ${selectedDeceased===p.id?'var(--t4)':'var(--bd)'}`,background:selectedDeceased===p.id?'var(--t2)':'var(--surf)',cursor:'pointer',textAlign:'left',display:'flex',alignItems:'center',gap:12 }}>
                    <div style={{ width:40,height:40,borderRadius:'50%',background:selectedDeceased===p.id?'var(--t4)':'var(--bd)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,fontWeight:700,color:selectedDeceased===p.id?'#fff':'var(--tx3)',flexShrink:0 }}>
                      {p.name.split(' ').slice(0,2).map(w=>w[0]).join('').toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontSize:14,fontWeight:700,color:selectedDeceased===p.id?'var(--t6)':'var(--tx)' }}>
                        {p.name}
                        <span style={{ fontSize:10,color:'var(--tx3)',marginLeft:8 }}>☪</span>
                      </div>
                      <div style={{ fontSize:11,color:'var(--tx3)',marginTop:2 }}>
                        {p.gender === 'male' ? 'Laki-laki' : 'Perempuan'} · wafat {p.death_year}
                        {p.birth_year ? ` · ${p.death_year - p.birth_year} tahun` : ''}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 3 — Input harta */}
        {selectedDeceased && (
          <div className="card" style={{ marginBottom:14 }}>
            <div className="divider"><span>3 · TOTAL HARTA (OPSIONAL)</span></div>
            <p style={{ fontSize:12,color:'var(--tx2)',marginBottom:10,lineHeight:1.6 }}>
              Harta bersih setelah dikurangi hutang, biaya pemakaman, dan wasiat (maks 1/3). Kosongkan jika hanya ingin lihat pecahan/persentase.
            </p>
            <div className="field" style={{ marginBottom:0 }}>
              <label>Total Harta Warisan</label>
              <input
                value={harta ? `Rp ${harta}` : ''}
                onChange={handleHartaInput}
                placeholder="Rp 0 (opsional)"
                style={{ fontSize:16,fontWeight:700 }}
              />
            </div>
          </div>
        )}

        {/* Hitung */}
        {selectedDeceased && (
          <button className="btn btn-primary btn-pill"
            onClick={handleCalculate}
            disabled={calculating}
            style={{ width:'100%',justifyContent:'center',fontSize:15,padding:'13px',marginBottom:20,fontWeight:800 }}>
            {calculating ? '⏳ Menghitung...' : `⚖️ Hitung Waris ${deceasedPerson ? `— ${deceasedPerson.name}` : ''}`}
          </button>
        )}

        {/* Hasil */}
        {result && (
          <div>
            {/* Header hasil */}
            <div className="card" style={{ marginBottom:12,background:'var(--t2)',border:'1px solid var(--t3)' }}>
              <div style={{ fontSize:11,fontWeight:700,color:'var(--t5)',letterSpacing:.5,marginBottom:4 }}>HASIL PERHITUNGAN</div>
              <div style={{ fontSize:17,fontWeight:800,color:'var(--tx)',marginBottom:4 }}>
                Waris Almarhum/ah {result.raw.deceasedName}
              </div>
              <div style={{ fontSize:12,color:'var(--tx2)' }}>
                Mazhab {result.raw.madzhab} · {result.formatted.length} ahli waris berhak
                {result.nominalHarta && ` · Total harta: ${fmtRupiah(result.nominalHarta)}`}
              </div>
              {result.raw.isAul && (
                <div style={{ marginTop:10,padding:'8px 12px',background:'#fff7ed',borderRadius:8,fontSize:12,color:'#92400e',fontWeight:600 }}>
                  ⚠️ Berlaku kaidah <strong>Aul</strong> — jumlah furudh melebihi harta, semua bagian dikurangi secara proporsional.
                </div>
              )}
              {result.raw.isRadd && (
                <div style={{ marginTop:10,padding:'8px 12px',background:'var(--t2)',borderRadius:8,fontSize:12,color:'var(--t6)',fontWeight:600 }}>
                  ℹ️ Berlaku kaidah <strong>Radd</strong> — sisa harta dikembalikan ke ahli waris selain pasangan.
                </div>
              )}
            </div>

            {/* Tabel hasil */}
            <div className="card" style={{ marginBottom:12,padding:'0',overflow:'hidden' }}>
              {result.formatted.map((h, i) => (
                <div key={h.id || i} style={{
                  display:'flex',alignItems:'center',gap:12,padding:'14px 18px',
                  borderBottom: i < result.formatted.length-1 ? '1px solid var(--bd)' : 'none',
                  background: i % 2 === 0 ? 'var(--card)' : 'var(--surf)',
                }}>
                  {/* Avatar */}
                  <div style={{ width:40,height:40,borderRadius:'50%',background:'var(--t2)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,fontWeight:700,color:'var(--t6)',flexShrink:0 }}>
                    {h.name.split(' ').slice(0,2).map(w=>w[0]).join('').toUpperCase()}
                  </div>
                  {/* Info */}
                  <div style={{ flex:1,minWidth:0 }}>
                    <div style={{ fontSize:14,fontWeight:700,color:'var(--tx)' }}>{h.name}</div>
                    <div style={{ fontSize:11,color:'var(--tx3)',marginTop:1 }}>
                      {h.role}
                      {h.note && <span style={{ marginLeft:6,color:'var(--amber-t)' }}>· {h.note}</span>}
                    </div>
                  </div>
                  {/* Bagian */}
                  <div style={{ textAlign:'right',flexShrink:0 }}>
                    <div style={{ fontSize:18,fontWeight:900,color:'var(--t5)',fontFamily:'monospace' }}>{h.shareStr}</div>
                    <div style={{ fontSize:11,color:'var(--tx3)' }}>{h.pct}%</div>
                    {h.nominal && (
                      <div style={{ fontSize:12,fontWeight:700,color:'var(--tx)',marginTop:2 }}>
                        {fmtRupiah(h.nominal)}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Disclaimer */}
            <div style={{ padding:'14px 16px',background:'var(--surf)',borderRadius:12,border:'1px solid var(--bd)',fontSize:11,color:'var(--tx3)',lineHeight:1.8 }}>
              <strong style={{ color:'var(--tx2)' }}>⚠️ Disclaimer:</strong><br/>
              Hasil ini dihitung berdasarkan data pohon keluarga dan ilmu faraid mazhab Syafi'i. Kemungkinan terdapat perbedaan dengan mazhab Hanafi, Maliki, atau Hanbali — terutama pada posisi kakek, nenek, dan saudara seibu.<br/><br/>
              <strong style={{ color:'var(--tx2)' }}>Hasil ini hanya untuk referensi.</strong> Untuk penetapan resmi, konsultasikan dengan ahli waris, notaris, atau Pengadilan Agama setempat.
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
