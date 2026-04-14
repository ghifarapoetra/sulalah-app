'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../lib/supabase'

export default function Home() {
  const router = useRouter()
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.push('/tree')
    })
  }, [router])

  return (
    <main style={{ minHeight:'100vh',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'24px 16px',background:'var(--bg)' }}>
      <div style={{ textAlign:'center',maxWidth:500 }}>
        <div style={{ width:88,height:88,borderRadius:'50%',background:'var(--t2)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:40,margin:'0 auto 20px' }}>🌳</div>
        <h1 style={{ fontSize:34,fontWeight:800,color:'var(--tx)',letterSpacing:'-.6px',marginBottom:10 }}>Nasab</h1>
        <p style={{ fontSize:15,color:'var(--tx2)',lineHeight:1.75,marginBottom:20 }}>
          Pohon silsilah keluarga dengan deteksi mahram otomatis. Simpan kontak, foto, dan riwayat tiap anggota agar silaturahim tetap terjaga.
        </p>

        {/* Dalil */}
        <div style={{ background:'var(--surf)',border:'1px solid var(--bd)',borderLeft:'4px solid var(--t4)',borderRadius:12,padding:'14px 18px',marginBottom:28,textAlign:'right' }}>
          <p style={{ fontSize:18,lineHeight:1.9,color:'var(--tx)',fontWeight:500,marginBottom:8,fontFamily:'serif' }}>
            يَٰٓأَيُّهَا ٱلنَّاسُ إِنَّا خَلَقْنَٰكُم مِّن ذَكَرٍ وَأُنثَىٰ وَجَعَلْنَٰكُمْ شُعُوبًا وَقَبَآئِلَ لِتَعَارَفُوٓا۟
          </p>
          <p style={{ fontSize:12,color:'var(--tx2)',marginBottom:4,textAlign:'left' }}>
            "Wahai manusia! Sungguh, Kami telah menciptakan kamu dari seorang laki-laki dan perempuan, kemudian Kami jadikan kamu berbangsa-bangsa dan bersuku-suku agar kamu saling mengenal."
          </p>
          <p style={{ fontSize:11,color:'var(--tx3)',textAlign:'left' }}>— QS. Al-Hujurat: 13</p>
        </div>

        <a href="/auth" className="btn btn-primary btn-pill" style={{ fontSize:15,padding:'12px 36px',textDecoration:'none' }}>
          Mulai Sekarang →
        </a>
      </div>

      <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(140px,1fr))',gap:12,maxWidth:500,width:'100%',marginTop:40 }}>
        {[
          { icon:'🌳', title:'Pohon Silsilah', desc:'Visualisasi lintas generasi' },
          { icon:'✦', title:'Deteksi Mahram', desc:'Otomatis, 7 golongan nasab' },
          { icon:'🖨️', title:'Cetak / PDF', desc:'Siap dipajang di ruang keluarga' },
        ].map(f => (
          <div key={f.title} className="card" style={{ borderTop:'3px solid var(--t4)',textAlign:'center',padding:'14px 12px' }}>
            <div style={{ fontSize:24,marginBottom:8 }}>{f.icon}</div>
            <div style={{ fontSize:13,fontWeight:700,color:'var(--tx)',marginBottom:4 }}>{f.title}</div>
            <div style={{ fontSize:11,color:'var(--tx2)',lineHeight:1.5 }}>{f.desc}</div>
          </div>
        ))}
      </div>
    </main>
  )
}
