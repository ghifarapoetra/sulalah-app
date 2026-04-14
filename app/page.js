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
    <main style={{ minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'32px 16px', background:'var(--bg)' }}>

      {/* Hero */}
      <div style={{ textAlign:'center', maxWidth:520, marginBottom:40 }}>

        {/* Logo */}
        <div style={{ marginBottom:20 }}>
          <div style={{ width:80, height:80, borderRadius:'50%', background:'var(--t2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:38, margin:'0 auto 16px', border:'3px solid var(--t3)' }}>🌳</div>
          <div style={{ fontSize:38, fontWeight:800, color:'var(--t5)', letterSpacing:'-1px', lineHeight:1 }}>Sulalah</div>
          <div style={{ fontSize:13, color:'var(--tx3)', marginTop:6, letterSpacing:'2px', textTransform:'uppercase', fontWeight:500 }}>سُلالة</div>
        </div>

        <p style={{ fontSize:15, color:'var(--tx2)', lineHeight:1.8, marginBottom:32 }}>
          Pohon silsilah keluarga digital dengan deteksi mahram otomatis.<br/>Jaga nasab, jaga silaturahim, lestarikan warisan keluarga.
        </p>

        {/* Dalil 1 — Al-Quran */}
        <div style={{ background:'var(--surf)', border:'1px solid var(--bd)', borderLeft:'4px solid var(--t4)', borderRadius:12, padding:'16px 20px', marginBottom:16, textAlign:'right' }}>
          <p style={{ fontSize:20, lineHeight:2, color:'var(--tx)', fontWeight:500, marginBottom:10, fontFamily:'serif', direction:'rtl' }}>
            يَٰٓأَيُّهَا ٱلنَّاسُ إِنَّا خَلَقْنَٰكُم مِّن ذَكَرٍ وَأُنثَىٰ وَجَعَلْنَٰكُمْ شُعُوبًا وَقَبَآئِلَ لِتَعَارَفُوٓا۟ ۚ إِنَّ أَكْرَمَكُمْ عِندَ ٱللَّهِ أَتْقَىٰكُمْ
          </p>
          <p style={{ fontSize:12, color:'var(--tx2)', marginBottom:4, textAlign:'left', lineHeight:1.7 }}>
            "Wahai manusia! Sungguh, Kami telah menciptakan kamu dari seorang laki-laki dan perempuan, kemudian Kami jadikan kamu berbangsa-bangsa dan bersuku-suku agar kamu saling mengenal. Sesungguhnya yang paling mulia di antara kamu di sisi Allah ialah orang yang paling bertakwa."
          </p>
          <p style={{ fontSize:11, color:'var(--tx3)', textAlign:'left', fontWeight:600 }}>— QS. Al-Hujurat: 13</p>
        </div>

        {/* Dalil 2 — Hadits */}
        <div style={{ background:'var(--surf)', border:'1px solid var(--bd)', borderLeft:'4px solid var(--amber-t)', borderRadius:12, padding:'16px 20px', marginBottom:32, textAlign:'right' }}>
          <p style={{ fontSize:17, lineHeight:2, color:'var(--tx)', fontWeight:500, marginBottom:10, fontFamily:'serif', direction:'rtl' }}>
            تَعَلَّمُوا مِنْ أَنْسَابِكُمْ مَا تَصِلُونَ بِهِ أَرْحَامَكُمْ
          </p>
          <p style={{ fontSize:12, color:'var(--tx2)', marginBottom:4, textAlign:'left', lineHeight:1.7 }}>
            "Pelajarilah nasab-nasab kalian yang dengannya kalian dapat menyambung tali silaturahmi."
          </p>
          <p style={{ fontSize:11, color:'var(--tx3)', textAlign:'left', fontWeight:600 }}>— HR. Tirmidzi, dari Abu Hurairah</p>
        </div>

        <a href="/auth" className="btn btn-primary btn-pill" style={{ fontSize:15, padding:'13px 40px', textDecoration:'none', display:'inline-flex', alignItems:'center', gap:8 }}>
          Mulai Sekarang →
        </a>
      </div>

      {/* Feature cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(145px,1fr))', gap:12, maxWidth:520, width:'100%' }}>
        {[
          { icon:'🌳', title:'Pohon Silsilah', desc:'Visualisasi lintas generasi' },
          { icon:'✦', title:'Deteksi Mahram', desc:'Otomatis, 7 golongan nasab' },
          { icon:'📇', title:'Kontak Keluarga', desc:'HP, email, foto tersimpan' },
          { icon:'🖨️', title:'Cetak / PDF', desc:'Siap dipajang di rumah' },
        ].map(f => (
          <div key={f.title} className="card" style={{ borderTop:'3px solid var(--t4)', textAlign:'center', padding:'14px 12px' }}>
            <div style={{ fontSize:22, marginBottom:8 }}>{f.icon}</div>
            <div style={{ fontSize:13, fontWeight:700, color:'var(--tx)', marginBottom:4 }}>{f.title}</div>
            <div style={{ fontSize:11, color:'var(--tx2)', lineHeight:1.5 }}>{f.desc}</div>
          </div>
        ))}
      </div>

      <p style={{ marginTop:24, fontSize:11, color:'var(--tx3)' }}>
        Gratis · Aman · Data keluarga Anda terlindungi
      </p>
    </main>
  )
}
