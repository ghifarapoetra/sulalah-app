'use client'
import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '../../lib/supabase'

const FEATURES_FREE = [
  { text: '1 pohon keluarga', ok: true },
  { text: 'Anggota keluarga unlimited', ok: true },
  { text: 'Deteksi mahram otomatis', ok: true },
  { text: 'Foto & kontak keluarga', ok: true },
  { text: '2 tema cetak PDF', ok: true },
  { text: 'Panel doa & amalan wafat', ok: true },
  { text: '5 pohon keluarga', ok: false },
  { text: 'Undang kolaborator keluarga', ok: false },
  { text: 'Notifikasi milad Islami', ok: false },
  { text: 'Semua 5 tema cetak PDF', ok: false },
  { text: 'Prioritas fitur baru', ok: false },
]

const FEATURES_PREMIUM = [
  { text: '5 pohon keluarga', ok: true },
  { text: 'Anggota keluarga unlimited', ok: true },
  { text: 'Deteksi mahram otomatis', ok: true },
  { text: 'Foto & kontak keluarga', ok: true },
  { text: 'Semua 5 tema cetak PDF', ok: true },
  { text: 'Panel doa & amalan wafat', ok: true },
  { text: 'Undang kolaborator keluarga', ok: true },
  { text: 'Notifikasi milad Islami', ok: true },
  { text: 'Akses semua fitur mendatang', ok: true },
  { text: 'Bayar sekali, seumur hidup', ok: true },
]

export default function UpgradePage() {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [paying, setPaying] = useState(false)
  const [err, setErr] = useState('')
  const router = useRouter()
  const params = useSearchParams()
  const hasError = params.get('error')
  const hasPending = params.get('pending')

  useEffect(() => {
    // Load Midtrans Snap script
    const script = document.createElement('script')
    script.src = process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === 'true'
      ? 'https://app.midtrans.com/snap/snap.js'
      : 'https://app.sandbox.midtrans.com/snap/snap.js'
    script.setAttribute('data-client-key', process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || '')
    document.head.appendChild(script)
    return () => document.head.removeChild(script)
  }, [])

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.push('/auth'); return }
      setUser(session.user)
      supabase.from('profiles').select('*').eq('id', session.user.id).single()
        .then(({ data }) => { setProfile(data); setLoading(false) })
    })
  }, [router])

  async function handlePayment() {
    if (!user) return
    setPaying(true); setErr('')

    try {
      // Buat transaksi
      const res = await fetch('/api/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          userEmail: user.email,
          userName: profile?.full_name || '',
        }),
      })

      const data = await res.json()
      if (data.error) { setErr('Gagal memulai pembayaran. Coba lagi.'); setPaying(false); return }

      // Buka Midtrans Snap popup
      if (window.snap) {
        window.snap.pay(data.token, {
          onSuccess: () => { router.push('/payment-success') },
          onPending: () => { router.push('/upgrade?pending=1') },
          onError: () => { setErr('Pembayaran gagal. Silakan coba lagi.'); setPaying(false) },
          onClose: () => { setPaying(false) },
        })
      } else {
        // Fallback — redirect ke halaman Midtrans
        window.location.href = data.redirect_url
      }
    } catch (e) {
      setErr('Terjadi kesalahan. Coba lagi.'); setPaying(false)
    }
  }

  if (loading) return <div style={{ minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center' }}>Memuat...</div>

  if (profile?.is_premium) {
    return (
      <main style={{ minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',padding:24,background:'var(--bg)' }}>
        <div style={{ maxWidth:400,width:'100%',textAlign:'center' }}>
          <div style={{ fontSize:52,marginBottom:16 }}>✨</div>
          <h2 style={{ fontSize:22,fontWeight:800,color:'var(--t5)',marginBottom:8 }}>Anda sudah Premium!</h2>
          <p style={{ fontSize:14,color:'var(--tx2)',marginBottom:24 }}>Terima kasih telah mendukung Sulalah. Semua fitur premium sudah aktif.</p>
          <button className="btn btn-primary btn-pill" onClick={()=>router.push('/dashboard')} style={{ fontSize:14,padding:'10px 28px' }}>
            Kembali ke Dashboard →
          </button>
        </div>
      </main>
    )
  }

  return (
    <main style={{ maxWidth:680,margin:'0 auto',padding:'0 16px 40px' }}>
      {/* Topbar */}
      <div className="topbar" style={{ borderRadius:'0 0 14px 14px',marginBottom:24 }}>
        <div>
          <div className="topbar-title">🌳 Sulalah</div>
          <div className="topbar-sub">Upgrade ke Premium</div>
        </div>
        <button onClick={()=>router.push('/dashboard')} style={{ background:'rgba(255,255,255,.15)',color:'#fff',border:'1px solid rgba(255,255,255,.3)',padding:'6px 12px',borderRadius:20,fontSize:12,cursor:'pointer' }}>
          ← Kembali
        </button>
      </div>

      {/* Status alerts */}
      {hasError && (
        <div style={{ background:'var(--rose-bg)',border:'1px solid var(--rose-b)',borderRadius:10,padding:'10px 14px',marginBottom:14,fontSize:13,color:'var(--rose-t)' }}>
          ⚠ Pembayaran gagal atau dibatalkan. Silakan coba lagi.
        </div>
      )}
      {hasPending && (
        <div style={{ background:'var(--amber-bg)',border:'1px solid var(--amber-b)',borderRadius:10,padding:'10px 14px',marginBottom:14,fontSize:13,color:'var(--amber-t)' }}>
          ⏳ Pembayaran sedang diproses. Premium akan aktif otomatis setelah pembayaran dikonfirmasi.
        </div>
      )}

      {/* Hero */}
      <div style={{ textAlign:'center',marginBottom:28 }}>
        <div style={{ fontSize:40,marginBottom:8 }}>✨</div>
        <h1 style={{ fontSize:26,fontWeight:800,color:'var(--tx)',letterSpacing:'-.5px',marginBottom:8 }}>Sulalah Premium</h1>
        <p style={{ fontSize:15,color:'var(--tx2)',lineHeight:1.7,marginBottom:16 }}>
          Bayar sekali, nikmati seumur hidup.<br/>Dukung pengembangan aplikasi silsilah Islami ini.
        </p>
        <div style={{ display:'inline-flex',alignItems:'baseline',gap:6 }}>
          <span style={{ fontSize:40,fontWeight:800,color:'var(--t5)' }}>Rp 29.000</span>
          <span style={{ fontSize:14,color:'var(--tx3)' }}>/ seumur hidup</span>
        </div>
      </div>

      {/* Perbandingan */}
      <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:24 }}>
        {/* Free */}
        <div className="card">
          <div style={{ fontSize:13,fontWeight:700,color:'var(--tx3)',marginBottom:12 }}>Gratis</div>
          {FEATURES_FREE.map((f,i) => (
            <div key={i} style={{ display:'flex',alignItems:'center',gap:6,padding:'5px 0',borderBottom:'1px solid var(--bd)',fontSize:12 }}>
              <span style={{ color:f.ok?'var(--t5)':'var(--tx3)',flexShrink:0 }}>{f.ok?'✓':'✗'}</span>
              <span style={{ color:f.ok?'var(--tx)':'var(--tx3)' }}>{f.text}</span>
            </div>
          ))}
        </div>
        {/* Premium */}
        <div className="card" style={{ border:'2px solid var(--t4)',position:'relative' }}>
          <div style={{ position:'absolute',top:-12,left:'50%',transform:'translateX(-50%)',background:'var(--t5)',color:'#fff',fontSize:10,fontWeight:700,padding:'3px 12px',borderRadius:20,whiteSpace:'nowrap' }}>DIREKOMENDASIKAN</div>
          <div style={{ fontSize:13,fontWeight:700,color:'var(--t5)',marginBottom:12 }}>Premium ✨</div>
          {FEATURES_PREMIUM.map((f,i) => (
            <div key={i} style={{ display:'flex',alignItems:'center',gap:6,padding:'5px 0',borderBottom:'1px solid var(--bd)',fontSize:12 }}>
              <span style={{ color:'var(--t5)',flexShrink:0 }}>✓</span>
              <span style={{ color:'var(--tx)',fontWeight:500 }}>{f.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Dalil sedekah */}
      <div style={{ background:'var(--surf)',border:'1px solid var(--bd)',borderLeft:'4px solid var(--t4)',borderRadius:12,padding:'14px 18px',marginBottom:24 }}>
        <p style={{ fontSize:16,textAlign:'right',direction:'rtl',lineHeight:2,color:'var(--tx)',fontFamily:'serif',marginBottom:8 }}>
          مَنْ يَشْفَعْ شَفَاعَةً حَسَنَةً يَكُنْ لَهُ نَصِيبٌ مِنْهَا
        </p>
        <p style={{ fontSize:12,color:'var(--tx2)',fontStyle:'italic',marginBottom:4 }}>
          "Barang siapa yang memberikan syafaat yang baik, maka ia akan mendapatkan bagian dari kebaikan tersebut."
        </p>
        <p style={{ fontSize:11,color:'var(--t5)',fontWeight:600 }}>— QS. An-Nisa: 85</p>
        <p style={{ fontSize:12,color:'var(--tx3)',marginTop:8,lineHeight:1.6 }}>
          Dengan upgrade Premium, Anda juga turut mendukung pengembangan aplikasi yang membantu ribuan keluarga Muslim menjaga nasab dan silaturahim. Semoga menjadi amal jariyah.
        </p>
      </div>

      {/* CTA */}
      {err && <p style={{ color:'var(--rose-t)',fontSize:13,marginBottom:10,textAlign:'center' }}>⚠ {err}</p>}

      <button
        onClick={handlePayment}
        disabled={paying}
        className="btn btn-primary btn-pill"
        style={{ width:'100%',justifyContent:'center',fontSize:16,padding:'14px',marginBottom:12 }}>
        {paying ? '⏳ Membuka pembayaran...' : '✨ Upgrade Sekarang — Rp 29.000'}
      </button>

      <div style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8,marginBottom:16 }}>
        {['QRIS','Transfer Bank','GoPay / OVO / Dana'].map(m => (
          <div key={m} style={{ background:'var(--surf)',border:'1px solid var(--bd)',borderRadius:8,padding:'8px',textAlign:'center',fontSize:11,color:'var(--tx2)' }}>✓ {m}</div>
        ))}
      </div>

      <p style={{ fontSize:11,color:'var(--tx3)',textAlign:'center',lineHeight:1.7 }}>
        Pembayaran diproses oleh Midtrans — platform pembayaran terpercaya Indonesia.<br/>
        Premium aktif otomatis setelah pembayaran berhasil. Tidak ada biaya tersembunyi.
      </p>
    </main>
  )
}
