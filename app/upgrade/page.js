'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../../lib/supabase'

export const dynamic = 'force-dynamic'

const FF = [
  { t:'1 pohon keluarga', ok:true },{ t:'Anggota unlimited', ok:true },
  { t:'Deteksi mahram otomatis', ok:true },{ t:'Foto & kontak keluarga', ok:true },
  { t:'5 tema ekspor poster', ok:true },{ t:'Panel doa & amalan wafat', ok:true },
  { t:'5 pohon keluarga', ok:false },{ t:'Undang kolaborator', ok:false },
  { t:'Notifikasi milad Islami', ok:false },{ t:'10 tema poster premium', ok:false },
]
const FP = [
  { t:'5 pohon keluarga', ok:true },{ t:'Anggota unlimited', ok:true },
  { t:'Deteksi mahram otomatis', ok:true },{ t:'Foto & kontak keluarga', ok:true },
  { t:'Semua 10 tema poster', ok:true },{ t:'Panel doa & amalan wafat', ok:true },
  { t:'Undang kolaborator keluarga', ok:true },{ t:'Notifikasi milad Islami', ok:true },
  { t:'Akses semua fitur mendatang', ok:true },{ t:'Bayar sekali, seumur hidup', ok:true },
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
              <div key={i} style={{ display:'flex',alignItems:'center',gap:8,marginBottom:7,fontSize:13,color:f.ok?'var(--tx)':'var(--tx3)' }}>
                <span style={{ width:16,textAlign:'center' }}>{f.ok?'✓':'·'}</span>{f.t}
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
              <div key={i} style={{ display:'flex',alignItems:'center',gap:8,marginBottom:7,fontSize:13,color:'var(--tx)' }}>
                <span style={{ width:16,textAlign:'center',color:'var(--t5)' }}>✓</span>{f.t}
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
