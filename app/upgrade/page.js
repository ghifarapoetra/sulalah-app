'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../../lib/supabase'

export const dynamic = 'force-dynamic'

const FF = [
  { icon:'🌳', t:'1 pohon keluarga', ok:true },
  { icon:'👥', t:'Anggota unlimited', ok:true },
  { icon:'🔍', t:'Deteksi mahram otomatis', ok:true },
  { icon:'📷', t:'Foto & kontak keluarga', ok:true },
  { icon:'🖼️', t:'Ekspor poster (dengan watermark)', ok:true },
  { icon:'🤲', t:'Panel doa & amalan wafat', ok:true },
  { icon:'🌲', t:'5 pohon keluarga', ok:false },
  { icon:'✉️', t:'Undang kolaborator', ok:false },
  { icon:'🔔', t:'Notifikasi milad Islami', ok:false },
  { icon:'⚖️', t:'Kalkulator waris faraid', ok:false },
]
const FP = [
  { icon:'🌲', t:'5 pohon keluarga', ok:true },
  { icon:'👥', t:'Anggota unlimited', ok:true },
  { icon:'🔍', t:'Deteksi mahram (nasab + nikah)', ok:true },
  { icon:'📷', t:'Foto & kontak keluarga', ok:true },
  { icon:'🖼️', t:'Ekspor poster tanpa watermark', ok:true },
  { icon:'✉️', t:'Undang kolaborator keluarga', ok:true },
  { icon:'🔔', t:'Notifikasi milad Islami', ok:true },
  { icon:'⚖️', t:'Kalkulator waris faraid', ok:true },
  { icon:'♾️', t:'Semua fitur mendatang', ok:true },
  { icon:'💳', t:'Bayar sekali, seumur hidup', ok:true },
]

export default function UpgradePage() {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [paying, setPaying] = useState(false)
  const [err, setErr] = useState('')
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.push('/auth'); return }
      setUser(session.user)
      supabase.from('profiles').select('is_premium, full_name').eq('id', session.user.id).single()
        .then(({ data }) => { setProfile(data); setLoading(false) })
    })
  }, [])

  async function handleUpgrade() {
    if (paying) return
    setPaying(true); setErr('')
    try {
      const res = await fetch('/api/pakasir-create', { method: 'POST' })
      const data = await res.json()
      if (!res.ok || !data.paymentUrl) throw new Error(data.error || 'Gagal membuat transaksi')
      // Redirect ke halaman bayar Pakasir
      window.location.href = data.paymentUrl
    } catch (e) {
      setErr(e.message || 'Terjadi kesalahan. Coba lagi.')
      setPaying(false)
    }
  }

  if (loading) return (
    <div style={{ minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'var(--bg)' }}>
      <div style={{ fontSize:14,color:'var(--tx2)' }}>Memuat...</div>
    </div>
  )

  if (profile?.is_premium) return (
    <div style={{ minHeight:'100vh',background:'var(--bg)',display:'flex',alignItems:'center',justifyContent:'center',padding:20 }}>
      <div style={{ textAlign:'center',maxWidth:400 }}>
        <div style={{ fontSize:48,marginBottom:12 }}>🌟</div>
        <h2 style={{ fontSize:22,fontWeight:800,color:'var(--tx)',marginBottom:8 }}>Kamu sudah Premium!</h2>
        <p style={{ fontSize:14,color:'var(--tx2)',lineHeight:1.7,marginBottom:20 }}>Jazakallah khayran atas dukunganmu untuk Sulalah. Semua fitur sudah terbuka untukmu.</p>
        <button className="btn btn-primary" onClick={() => router.push('/dashboard')}>← Ke Dashboard</button>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight:'100vh',background:'var(--bg)',padding:'32px 16px' }}>
      <div style={{ maxWidth:680,margin:'0 auto' }}>

        {/* Header */}
        <div style={{ textAlign:'center',marginBottom:32 }}>
          <div style={{ fontSize:42,marginBottom:10 }}>🌳</div>
          <h1 style={{ fontSize:26,fontWeight:900,color:'var(--tx)',letterSpacing:'-.5px',marginBottom:8 }}>
            Upgrade ke Sulalah Premium
          </h1>
          <p style={{ fontSize:15,color:'var(--tx2)',lineHeight:1.7 }}>
            Bayar sekali, nikmati selamanya. Dukung pengembangan app silsilah Muslim yang berkelanjutan.
          </p>
        </div>

        {/* Pricing cards */}
        <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:28 }}>
          {/* Gratis */}
          <div style={{ background:'var(--card)',border:'1px solid var(--bd)',borderRadius:16,padding:'22px 18px' }}>
            <div style={{ fontSize:12,fontWeight:700,color:'var(--tx3)',letterSpacing:1,marginBottom:8 }}>GRATIS</div>
            <div style={{ fontSize:28,fontWeight:900,color:'var(--tx)',marginBottom:16 }}>Rp 0</div>
            {FF.map((f,i)=>(
              <div key={i} className={`feature-item${f.ok?'':' locked'}`}>
                <span className="fi-icon" style={{ background: f.ok ? 'var(--t2)' : 'var(--surf)' }}>{f.icon}</span>
                <span>{f.t}</span>
                {!f.ok && <span style={{ marginLeft:'auto',fontSize:10,color:'var(--t5)',fontWeight:700 }}>Premium</span>}
              </div>
            ))}
          </div>

          {/* Premium */}
          <div style={{ background:'var(--t2)',border:'2px solid var(--t4)',borderRadius:16,padding:'22px 18px',position:'relative' }}>
            <div style={{ position:'absolute',top:-10,left:'50%',transform:'translateX(-50%)',background:'var(--t5)',color:'#fff',fontSize:10,fontWeight:800,padding:'3px 14px',borderRadius:20,letterSpacing:.5 }}>TERPOPULER</div>
            <div style={{ fontSize:12,fontWeight:700,color:'var(--t6)',letterSpacing:1,marginBottom:8 }}>PREMIUM</div>
            <div style={{ fontSize:28,fontWeight:900,color:'var(--tx)',marginBottom:4 }}>Rp 29.000</div>
            <div style={{ fontSize:11,color:'var(--tx3)',marginBottom:16 }}>Pembayaran sekali, akses seumur hidup</div>
            {FP.map((f,i)=>(
              <div key={i} className="feature-item">
                <span className="fi-icon" style={{ background:'rgba(255,255,255,.15)' }}>{f.icon}</span>
                <span>{f.t}</span>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div style={{ background:'var(--card)',border:'1px solid var(--bd)',borderRadius:16,padding:'24px 20px',textAlign:'center' }}>
          <div style={{ fontSize:14,color:'var(--tx2)',marginBottom:6 }}>Bayar aman via</div>
          <div style={{ fontSize:17,fontWeight:800,color:'var(--tx)',marginBottom:4 }}>QRIS · Transfer Bank · E-Wallet</div>
          <div style={{ fontSize:12,color:'var(--tx3)',marginBottom:20,lineHeight:1.6 }}>
            GoPay · OVO · Dana · ShopeePay · BCA · Mandiri · BNI · BRI · dan lainnya
          </div>

          {err && (
            <div style={{ background:'var(--rose-bg)',border:'1px solid var(--rose-b)',color:'var(--rose-t)',padding:'10px 14px',borderRadius:8,fontSize:12,marginBottom:16 }}>
              ⚠ {err}
            </div>
          )}

          <button
            onClick={handleUpgrade}
            disabled={paying}
            className="btn btn-primary"
            style={{ width:'100%',justifyContent:'center',fontSize:16,padding:'14px',fontWeight:800,background:'var(--t5)',borderColor:'var(--t5)' }}>
            {paying ? (
              <span>⏳ Memproses...</span>
            ) : (
              <span>🌟 Upgrade Sekarang — Rp 29.000</span>
            )}
          </button>

          <div style={{ fontSize:11,color:'var(--tx3)',marginTop:14,lineHeight:1.8 }}>
            🔒 Pembayaran diproses oleh <strong>Pakasir</strong> (PT Geksa, berizin BI)<br/>
            ✅ Setelah bayar, akun otomatis ter-upgrade dalam hitungan detik<br/>
            💬 Ada masalah? Hubungi <a href="mailto:halo@sulalah.my.id" style={{ color:'var(--t5)' }}>halo@sulalah.my.id</a>
          </div>
        </div>

        {/* Islamic framing */}
        <div style={{ textAlign:'center',marginTop:24,fontSize:13,color:'var(--tx3)',lineHeight:1.8 }}>
          <div style={{ fontSize:18,marginBottom:4 }}>🤲</div>
          Dengan mendukung Sulalah, kamu ikut memelihara tradisi menjaga nasab keluarga Muslim.<br/>
          <em>"تَعَلَّمُوا مِنْ أَنْسَابِكُمْ مَا تَصِلُونَ بِهِ أَرْحَامَكُمْ"</em><br/>
          <span style={{ fontSize:11 }}>— Hadits riwayat Tirmidzi</span>
        </div>

        <div style={{ textAlign:'center',marginTop:20 }}>
          <button className="btn btn-ghost" style={{ fontSize:13 }} onClick={() => router.back()}>← Kembali</button>
        </div>

      </div>
    </div>
  )
}
