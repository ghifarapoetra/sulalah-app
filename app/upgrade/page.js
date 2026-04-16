'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../../lib/supabase'

export const dynamic = 'force-dynamic'

const FF = [
  { t:'1 pohon keluarga', ok:true },{ t:'Anggota unlimited', ok:true },
  { t:'Deteksi mahram otomatis', ok:true },{ t:'Foto & kontak keluarga', ok:true },
  { t:'2 tema cetak PDF', ok:true },{ t:'Panel doa & amalan wafat', ok:true },
  { t:'5 pohon keluarga', ok:false },{ t:'Undang kolaborator', ok:false },
  { t:'Notifikasi milad Islami', ok:false },{ t:'Semua 5 tema PDF', ok:false },
]
const FP = [
  { t:'5 pohon keluarga', ok:true },{ t:'Anggota unlimited', ok:true },
  { t:'Deteksi mahram otomatis', ok:true },{ t:'Foto & kontak keluarga', ok:true },
  { t:'Semua 5 tema cetak PDF', ok:true },{ t:'Panel doa & amalan wafat', ok:true },
  { t:'Undang kolaborator keluarga', ok:true },{ t:'Notifikasi milad Islami', ok:true },
  { t:'Akses semua fitur mendatang', ok:true },{ t:'Bayar sekali, seumur hidup', ok:true },
]

export default function UpgradePage() {
  const [mounted, setMounted] = useState(false)
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [paying, setPaying] = useState(false)
  const [err, setErr] = useState('')
  const [hasError, setHasError] = useState(false)
  const [hasPending, setHasPending] = useState(false)
  const router = useRouter()

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (!mounted) return
    const params = new URLSearchParams(window.location.search)
    setHasError(params.get('error') === '1')
    setHasPending(params.get('pending') === '1')
    const isProd = process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === 'true'
    const script = document.createElement('script')
    script.src = isProd ? 'https://app.midtrans.com/snap/snap.js' : 'https://app.sandbox.midtrans.com/snap/snap.js'
    script.setAttribute('data-client-key', process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || '')
    document.head.appendChild(script)
    const supabase = createClient()
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.push('/auth'); return }
      setUser(session.user)
      supabase.from('profiles').select('*').eq('id', session.user.id).single()
        .then(({ data }) => { setProfile(data); setLoading(false) })
    })
    return () => { if (document.head.contains(script)) document.head.removeChild(script) }
  }, [mounted, router])

  async function handlePayment() {
    if (!user) return
    setPaying(true); setErr('')
    try {
      const res = await fetch('/api/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, userEmail: user.email, userName: profile?.full_name || '' }),
      })
      const data = await res.json()
      if (data.error) { setErr('Gagal memulai pembayaran. Coba lagi.'); setPaying(false); return }
      if (window.snap) {
        window.snap.pay(data.token, {
          onSuccess: () => router.push('/payment-success'),
          onPending: () => router.push('/upgrade?pending=1'),
          onError: () => { setErr('Pembayaran gagal. Silakan coba lagi.'); setPaying(false) },
          onClose: () => setPaying(false),
        })
      } else { window.location.href = data.redirect_url }
    } catch (e) { setErr('Terjadi kesalahan. Coba lagi.'); setPaying(false) }
  }

  if (!mounted) return null
  if (loading) return <div style={{ minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'var(--bg)',color:'var(--tx2)' }}>Memuat...</div>

  if (profile?.is_premium) return (
    <main style={{ minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',padding:24,background:'var(--bg)' }}>
      <div style={{ maxWidth:400,width:'100%',textAlign:'center' }}>
        <div style={{ fontSize:52,marginBottom:16 }}>✨</div>
        <h2 style={{ fontSize:22,fontWeight:800,color:'var(--t5)',marginBottom:8 }}>Anda sudah Premium!</h2>
        <p style={{ fontSize:14,color:'var(--tx2)',marginBottom:24 }}>Semua fitur premium sudah aktif. Jazakumullahu khayran!</p>
        <button className="btn btn-primary btn-pill" onClick={()=>router.push('/dashboard')} style={{ fontSize:14,padding:'10px 28px' }}>Ke Dashboard →</button>
      </div>
    </main>
  )

  return (
    <main style={{ maxWidth:680,margin:'0 auto',padding:'0 16px 40px' }}>
      <div className="topbar" style={{ borderRadius:'0 0 14px 14px',marginBottom:24 }}>
        <div>
          <div className="topbar-title">🌳 Sulalah</div>
          <div className="topbar-sub">Upgrade ke Premium</div>
        </div>
        <button onClick={()=>router.push('/dashboard')} style={{ background:'rgba(255,255,255,.15)',color:'#fff',border:'1px solid rgba(255,255,255,.3)',padding:'6px 12px',borderRadius:20,fontSize:12,cursor:'pointer' }}>← Kembali</button>
      </div>

      {hasError && <div style={{ background:'var(--rose-bg)',border:'1px solid var(--rose-b)',borderRadius:10,padding:'10px 14px',marginBottom:14,fontSize:13,color:'var(--rose-t)' }}>⚠ Pembayaran gagal. Silakan coba lagi.</div>}
      {hasPending && <div style={{ background:'var(--amber-bg)',border:'1px solid var(--amber-b)',borderRadius:10,padding:'10px 14px',marginBottom:14,fontSize:13,color:'var(--amber-t)' }}>⏳ Pembayaran sedang diproses. Premium aktif otomatis setelah dikonfirmasi.</div>}

      <div style={{ textAlign:'center',marginBottom:28 }}>
        <div style={{ fontSize:40,marginBottom:8 }}>✨</div>
        <h1 style={{ fontSize:26,fontWeight:800,color:'var(--tx)',letterSpacing:'-.5px',marginBottom:8 }}>Sulalah Premium</h1>
        <p style={{ fontSize:15,color:'var(--tx2)',lineHeight:1.7,marginBottom:16 }}>Bayar sekali, nikmati seumur hidup.<br/>Dukung pengembangan aplikasi silsilah Islami ini.</p>
        <div style={{ display:'inline-flex',alignItems:'baseline',gap:6 }}>
          <span style={{ fontSize:40,fontWeight:800,color:'var(--t5)' }}>Rp 29.000</span>
          <span style={{ fontSize:14,color:'var(--tx3)' }}>/ seumur hidup</span>
        </div>
      </div>

      <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:24 }}>
        <div className="card">
          <div style={{ fontSize:13,fontWeight:700,color:'var(--tx3)',marginBottom:12 }}>Gratis</div>
          {FF.map((f,i) => (
            <div key={i} style={{ display:'flex',alignItems:'center',gap:6,padding:'5px 0',borderBottom:'1px solid var(--bd)',fontSize:12 }}>
              <span style={{ color:f.ok?'var(--t5)':'var(--tx3)',flexShrink:0 }}>{f.ok?'✓':'✗'}</span>
              <span style={{ color:f.ok?'var(--tx)':'var(--tx3)' }}>{f.t}</span>
            </div>
          ))}
        </div>
        <div className="card" style={{ border:'2px solid var(--t4)',position:'relative' }}>
          <div style={{ position:'absolute',top:-12,left:'50%',transform:'translateX(-50%)',background:'var(--t5)',color:'#fff',fontSize:10,fontWeight:700,padding:'3px 12px',borderRadius:20,whiteSpace:'nowrap' }}>DIREKOMENDASIKAN</div>
          <div style={{ fontSize:13,fontWeight:700,color:'var(--t5)',marginBottom:12 }}>Premium ✨</div>
          {FP.map((f,i) => (
            <div key={i} style={{ display:'flex',alignItems:'center',gap:6,padding:'5px 0',borderBottom:'1px solid var(--bd)',fontSize:12 }}>
              <span style={{ color:'var(--t5)',flexShrink:0 }}>✓</span>
              <span style={{ color:'var(--tx)',fontWeight:500 }}>{f.t}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ background:'var(--surf)',border:'1px solid var(--bd)',borderLeft:'4px solid var(--t4)',borderRadius:12,padding:'14px 18px',marginBottom:24 }}>
        <p style={{ fontSize:16,textAlign:'right',direction:'rtl',lineHeight:2,color:'var(--tx)',fontFamily:'serif',marginBottom:8 }}>مَنْ يَشْفَعْ شَفَاعَةً حَسَنَةً يَكُنْ لَهُ نَصِيبٌ مِنْهَا</p>
        <p style={{ fontSize:12,color:'var(--tx2)',fontStyle:'italic',marginBottom:4 }}>"Barang siapa yang memberikan syafaat yang baik, maka ia akan mendapatkan bagian dari kebaikan tersebut." — QS. An-Nisa: 85</p>
        <p style={{ fontSize:12,color:'var(--tx3)',marginTop:8,lineHeight:1.6 }}>Dengan upgrade Premium, Anda turut mendukung pengembangan aplikasi yang membantu keluarga Muslim menjaga nasab dan silaturahim. Semoga menjadi amal jariyah.</p>
      </div>

      {err && <p style={{ color:'var(--rose-t)',fontSize:13,marginBottom:10,textAlign:'center' }}>⚠ {err}</p>}

      <button onClick={handlePayment} disabled={paying} className="btn btn-primary btn-pill" style={{ width:'100%',justifyContent:'center',fontSize:16,padding:'14px',marginBottom:12 }}>
        {paying ? '⏳ Membuka pembayaran...' : '✨ Upgrade Sekarang — Rp 29.000 seumur hidup'}
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
