'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../../lib/supabase'

export default function PaymentSuccess() {
  const [checking, setChecking] = useState(true)
  const [isPremium, setIsPremium] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Poll cek status premium (webhook mungkin agak delay)
    let attempts = 0
    const check = async () => {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/auth'); return }

      const { data: profile } = await supabase.from('profiles').select('is_premium').eq('id', session.user.id).single()

      if (profile?.is_premium) {
        setIsPremium(true); setChecking(false)
      } else if (attempts < 6) {
        attempts++
        setTimeout(check, 2500) // cek tiap 2.5 detik, max 15 detik
      } else {
        setChecking(false) // timeout — tampilkan pesan pending
      }
    }
    check()
  }, [router])

  return (
    <main style={{ minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',padding:24,background:'var(--bg)' }}>
      <div style={{ maxWidth:420,width:'100%',textAlign:'center' }}>

        {checking && (
          <>
            <div style={{ fontSize:48,marginBottom:16 }}>⏳</div>
            <h2 style={{ fontSize:20,fontWeight:700,color:'var(--tx)',marginBottom:8 }}>Mengkonfirmasi pembayaran...</h2>
            <p style={{ fontSize:14,color:'var(--tx2)' }}>Mohon tunggu sebentar, kami sedang mengaktifkan akun Premium Anda.</p>
          </>
        )}

        {!checking && isPremium && (
          <div className="card">
            <div style={{ fontSize:56,marginBottom:16 }}>🌳✨</div>
            <h2 style={{ fontSize:22,fontWeight:800,color:'var(--t5)',marginBottom:8 }}>Alhamdulillah!</h2>
            <p style={{ fontSize:15,color:'var(--tx)',fontWeight:600,marginBottom:8 }}>Akun Premium Anda sudah aktif.</p>
            <p style={{ fontSize:13,color:'var(--tx2)',lineHeight:1.7,marginBottom:16 }}>
              Jazakumullahu khayran atas dukungan Anda untuk Sulalah. Semoga menjadi amal jariyah dan mempererat silaturahim keluarga.
            </p>
            {/* Dalil */}
            <div style={{ background:'var(--surf)',border:'1px solid var(--bd)',borderRadius:10,padding:'12px 14px',marginBottom:20,textAlign:'right' }}>
              <p style={{ fontSize:15,direction:'rtl',lineHeight:2,color:'var(--tx)',fontFamily:'serif',marginBottom:6 }}>
                وَمَا تُنفِقُوا مِنْ خَيْرٍ فَإِنَّ اللَّهَ بِهِ عَلِيمٌ
              </p>
              <p style={{ fontSize:11,color:'var(--tx2)',fontStyle:'italic',textAlign:'left',marginBottom:2 }}>
                "Dan apa saja yang kamu infakkan dari kebaikan, maka sesungguhnya Allah Maha Mengetahuinya."
              </p>
              <p style={{ fontSize:10,color:'var(--t5)',fontWeight:600,textAlign:'left' }}>— QS. Al-Baqarah: 273</p>
            </div>
            <button className="btn btn-primary btn-pill" onClick={()=>router.push('/dashboard')} style={{ width:'100%',justifyContent:'center',fontSize:14,padding:'12px' }}>
              Mulai Gunakan Premium →
            </button>
          </div>
        )}

        {!checking && !isPremium && (
          <div className="card">
            <div style={{ fontSize:48,marginBottom:16 }}>⏰</div>
            <h2 style={{ fontSize:20,fontWeight:700,color:'var(--tx)',marginBottom:8 }}>Pembayaran sedang diproses</h2>
            <p style={{ fontSize:13,color:'var(--tx2)',lineHeight:1.7,marginBottom:16 }}>
              Pembayaran Anda sedang dikonfirmasi oleh sistem. Premium akan aktif otomatis dalam beberapa menit. Anda bisa langsung lanjut menggunakan Sulalah.
            </p>
            <button className="btn btn-primary btn-pill" onClick={()=>router.push('/dashboard')} style={{ width:'100%',justifyContent:'center',fontSize:14 }}>
              Ke Dashboard
            </button>
          </div>
        )}
      </div>
    </main>
  )
}
