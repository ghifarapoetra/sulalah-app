'use client'
import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '../../lib/supabase'

export default function PaymentSuccess() {
  const [status, setStatus] = useState('checking') // checking | success | pending | error
  const [attempts, setAttempts] = useState(0)
  const router = useRouter()
  const searchParams = useSearchParams()
  const orderId = searchParams.get('order_id')

  useEffect(() => {
    let timer
    let count = 0
    const maxAttempts = 20 // 20 × 3s = 60 detik

    async function check() {
      count++
      setAttempts(count)
      try {
        const supabase = createClient()
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) { router.push('/auth'); return }

        const { data: profile } = await supabase
          .from('profiles')
          .select('is_premium')
          .eq('id', session.user.id)
          .single()

        if (profile?.is_premium) {
          setStatus('success')
          return
        }

        if (count >= maxAttempts) {
          setStatus('pending')
          return
        }

        timer = setTimeout(check, 3000)
      } catch (e) {
        setStatus('error')
      }
    }

    check()
    return () => clearTimeout(timer)
  }, [])

  if (status === 'checking') return (
    <div style={{ minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'var(--bg)',padding:20 }}>
      <div style={{ textAlign:'center',maxWidth:360 }}>
        <div style={{ fontSize:48,marginBottom:16 }}>⏳</div>
        <h2 style={{ fontSize:20,fontWeight:800,color:'var(--tx)',marginBottom:8 }}>Memverifikasi pembayaran...</h2>
        <p style={{ fontSize:13,color:'var(--tx2)',lineHeight:1.7,marginBottom:16 }}>
          Mohon tunggu sebentar. Kami sedang mengkonfirmasi pembayaranmu.
        </p>
        <div style={{ width:'100%',background:'var(--surf)',borderRadius:8,height:6,overflow:'hidden' }}>
          <div style={{ width:`${(attempts/20)*100}%`,background:'var(--t4)',height:'100%',transition:'width .3s',borderRadius:8 }} />
        </div>
        <div style={{ fontSize:11,color:'var(--tx3)',marginTop:8 }}>Cek {attempts}/20...</div>
      </div>
    </div>
  )

  if (status === 'success') return (
    <div style={{ minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'var(--bg)',padding:20 }}>
      <div style={{ textAlign:'center',maxWidth:400 }}>
        <div style={{ fontSize:56,marginBottom:16 }}>🌟</div>
        <h2 style={{ fontSize:24,fontWeight:900,color:'var(--tx)',marginBottom:8 }}>Jazakallah Khayran!</h2>
        <p style={{ fontSize:14,color:'var(--tx2)',lineHeight:1.8,marginBottom:8 }}>
          Akun kamu sudah berhasil di-upgrade ke <strong>Sulalah Premium</strong>.
          Semua fitur sekarang terbuka untukmu.
        </p>
        <p style={{ fontSize:13,color:'var(--tx3)',lineHeight:1.7,marginBottom:24 }}>
          🤲 Semoga pohon silsilah ini menjadi amal jariyah yang mengalir, mempererat silaturahim, dan menjaga nasab keluarga Muslim.
        </p>
        <button className="btn btn-primary" style={{ width:'100%',justifyContent:'center',fontSize:15,padding:'12px' }}
          onClick={() => router.push('/dashboard')}>
          🌳 Mulai Pakai Sulalah Premium
        </button>
      </div>
    </div>
  )

  if (status === 'pending') return (
    <div style={{ minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'var(--bg)',padding:20 }}>
      <div style={{ textAlign:'center',maxWidth:420 }}>
        <div style={{ fontSize:48,marginBottom:16 }}>🕐</div>
        <h2 style={{ fontSize:20,fontWeight:800,color:'var(--tx)',marginBottom:8 }}>Pembayaran sedang diproses</h2>
        <p style={{ fontSize:13,color:'var(--tx2)',lineHeight:1.8,marginBottom:16 }}>
          Kami belum menerima konfirmasi dari Pakasir. Ini biasanya terjadi saat jaringan sedang padat.
        </p>
        <div style={{ background:'var(--t2)',border:'1px solid var(--t3)',borderRadius:10,padding:'14px 16px',marginBottom:20,fontSize:12,color:'var(--tx)',lineHeight:1.8,textAlign:'left' }}>
          <strong>Yang perlu kamu lakukan:</strong><br/>
          1. Tunggu 2–5 menit, lalu cek dashboard<br/>
          2. Kalau sudah lebih dari 10 menit, hubungi kami<br/>
          3. Sertakan bukti transfer ke: <strong>halo@sulalah.my.id</strong>
          {orderId && <><br/>4. Order ID kamu: <code style={{ fontSize:10,background:'var(--surf)',padding:'2px 6px',borderRadius:4 }}>{orderId}</code></>}
        </div>
        <div style={{ display:'flex',gap:8 }}>
          <button className="btn btn-ghost" style={{ flex:1,fontSize:13 }} onClick={() => router.push('/dashboard')}>
            Ke Dashboard
          </button>
          <button className="btn btn-primary" style={{ flex:1,fontSize:13 }} onClick={() => window.location.reload()}>
            Cek Lagi
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'var(--bg)',padding:20 }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ fontSize:36,marginBottom:12 }}>❌</div>
        <h2 style={{ fontSize:18,fontWeight:700,color:'var(--tx)',marginBottom:8 }}>Terjadi kesalahan</h2>
        <p style={{ fontSize:13,color:'var(--tx2)',marginBottom:16 }}>Hubungi kami di halo@sulalah.my.id</p>
        <button className="btn btn-ghost" onClick={() => router.push('/dashboard')}>← Ke Dashboard</button>
      </div>
    </div>
  )
}
