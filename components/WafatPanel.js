'use client'
import { useState } from 'react'
import { AMAL_JARIYAH, AMALAN_WAFAT } from '../lib/islamic'

export default function WafatPanel({ person, umrohLink, onClose }) {
  const [doaCopied, setDoaCopied] = useState(false)
  const [expandHadith, setExpandHadith] = useState(false)

  async function copyDoa() {
    await navigator.clipboard.writeText(AMAL_JARIYAH.hadith_doa.arabic + '\n\n' + AMAL_JARIYAH.hadith_doa.terjemah)
    setDoaCopied(true)
    setTimeout(() => setDoaCopied(false), 2000)
  }

  const defaultUmrohLink = umrohLink || 'https://wa.me/6281234567890?text=Assalamu%27alaikum%2C+saya+ingin+info+badal+umroh'

  return (
    <div style={{ background:'var(--card)', border:'1px solid var(--bd)', borderRadius:14, padding:18, marginTop:12 }}>

      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:16 }}>
        <div>
          <div style={{ fontSize:16, fontWeight:700, color:'var(--tx)' }}>☪ In Memoriam</div>
          <div style={{ fontSize:13, color:'var(--tx2)', marginTop:2 }}>{person.name} — Semoga Allah merahmatinya</div>
          {person.birth_year && person.death_year && (
            <div style={{ fontSize:11, color:'var(--tx3)', marginTop:2 }}>{person.birth_year} – {person.death_year} · {person.death_year - person.birth_year} tahun</div>
          )}
        </div>
        <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--tx3)', fontSize:16 }}>✕</button>
      </div>

      {/* Catatan dari keluarga */}
      {person.wafat_notes && (
        <div style={{ background:'var(--surf)', border:'1px solid var(--bd)', borderRadius:10, padding:'10px 14px', marginBottom:14 }}>
          <div style={{ fontSize:10, fontWeight:700, color:'var(--tx3)', letterSpacing:'.8px', textTransform:'uppercase', marginBottom:6 }}>Catatan Keluarga</div>
          <p style={{ fontSize:13, color:'var(--tx)', lineHeight:1.7 }}>{person.wafat_notes}</p>
        </div>
      )}

      {/* Hadits amal jariyah */}
      <div style={{ background:'var(--t2)', border:'1px solid var(--t3)', borderRadius:10, padding:'12px 14px', marginBottom:14 }}>
        <div style={{ fontSize:10, fontWeight:700, color:'var(--t6)', letterSpacing:'.8px', textTransform:'uppercase', marginBottom:8 }}>Sabda Rasulullah ﷺ</div>
        <p style={{ fontSize:16, textAlign:'right', direction:'rtl', lineHeight:2, color:'var(--tx)', fontFamily:'serif', marginBottom:8 }}>
          {AMAL_JARIYAH.hadith_utama.arabic}
        </p>
        <p style={{ fontSize:12, color:'var(--tx2)', lineHeight:1.7, fontStyle:'italic', marginBottom:4 }}>
          "{AMAL_JARIYAH.hadith_utama.terjemah}"
        </p>
        <p style={{ fontSize:11, color:'var(--t5)', fontWeight:600 }}>— {AMAL_JARIYAH.hadith_utama.sumber}</p>
      </div>

      {/* Amalan yang bisa dilakukan */}
      <div style={{ fontSize:12, fontWeight:700, color:'var(--tx)', marginBottom:10 }}>
        Anda masih bisa mengirim pahala untuk {person.name}:
      </div>

      <div style={{ display:'grid', gap:8, marginBottom:14 }}>
        {AMALAN_WAFAT.map((a, i) => (
          <div key={i} style={{ background:'var(--surf)', border:'1px solid var(--bd)', borderRadius:10, padding:'10px 14px' }}>
            <div style={{ display:'flex', alignItems:'flex-start', gap:10 }}>
              <div style={{ fontSize:20, flexShrink:0 }}>{a.icon}</div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13, fontWeight:700, color:'var(--tx)', marginBottom:2 }}>{a.title}</div>
                <div style={{ fontSize:12, color:'var(--tx2)', marginBottom:a.doa?6:2 }}>{a.desc}</div>
                {a.doa && (
                  <div style={{ background:'var(--card)', border:'1px solid var(--bd)', borderRadius:8, padding:'8px 10px', marginBottom:4 }}>
                    <p style={{ fontSize:15, textAlign:'right', direction:'rtl', lineHeight:2, color:'var(--tx)', fontFamily:'serif', marginBottom:4 }}>{a.doa}</p>
                    <p style={{ fontSize:11, color:'var(--tx2)', fontStyle:'italic', marginBottom:2 }}>{a.doa_id}</p>
                    <button onClick={copyDoa} style={{ background:'none', border:'1px solid var(--bd)', borderRadius:6, padding:'3px 8px', fontSize:10, cursor:'pointer', color:'var(--tx2)' }}>
                      {doaCopied ? '✓ Tersalin' : '📋 Salin doa'}
                    </button>
                  </div>
                )}
                <div style={{ fontSize:10, color:'var(--tx3)' }}>Dalil: {a.sumber}</div>

                {/* CTA Badal Umroh */}
                {a.title === 'Badal Umroh' && (
                  <div style={{ marginTop:8, background:'var(--amber-bg)', border:'1px solid var(--amber-b)', borderRadius:8, padding:'10px 12px' }}>
                    <div style={{ fontSize:12, fontWeight:600, color:'var(--amber-t)', marginBottom:4 }}>
                      🕌 Layanan Badal Umroh
                    </div>
                    <p style={{ fontSize:11, color:'var(--tx2)', lineHeight:1.6, marginBottom:8 }}>
                      Kami menyediakan layanan badal umroh untuk keluarga yang telah berpulang. Diamalkan oleh jemaah terpercaya, disertai laporan dan doa.
                    </p>
                    {/* Hadits badal */}
                    <p style={{ fontSize:11, color:'var(--tx2)', fontStyle:'italic', marginBottom:4 }}>
                      "{AMAL_JARIYAH.hadith_badal.terjemah}" — {AMAL_JARIYAH.hadith_badal.sumber}
                    </p>
                    <a href={defaultUmrohLink} target="_blank" rel="noreferrer"
                      style={{ display:'inline-flex', alignItems:'center', gap:6, background:'var(--t5)', color:'#fff', padding:'8px 16px', borderRadius:20, fontSize:12, fontWeight:600, textDecoration:'none' }}>
                      📲 Tanya Info Badal Umroh →
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Hadits doa jenazah */}
      <div style={{ background:'var(--surf)', border:'1px solid var(--bd)', borderRadius:10, padding:'12px 14px', cursor:'pointer' }} onClick={()=>setExpandHadith(!expandHadith)}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div style={{ fontSize:12, fontWeight:600, color:'var(--tx)' }}>🤲 Doa Lengkap untuk Almarhum/ah</div>
          <span style={{ color:'var(--tx3)', fontSize:12 }}>{expandHadith?'▲':'▼'}</span>
        </div>
        {expandHadith && (
          <div style={{ marginTop:12 }}>
            <p style={{ fontSize:18, textAlign:'right', direction:'rtl', lineHeight:2, color:'var(--tx)', fontFamily:'serif', marginBottom:8 }}>
              {AMAL_JARIYAH.hadith_doa.arabic}
            </p>
            <p style={{ fontSize:12, color:'var(--tx2)', fontStyle:'italic', marginBottom:4 }}>{AMAL_JARIYAH.hadith_doa.terjemah}</p>
            <p style={{ fontSize:11, color:'var(--t5)', fontWeight:600 }}>— {AMAL_JARIYAH.hadith_doa.sumber}</p>
            <button onClick={e=>{e.stopPropagation();copyDoa()}} className="btn btn-ghost" style={{ marginTop:8, fontSize:11, padding:'5px 10px' }}>
              {doaCopied?'✓ Tersalin':'📋 Salin Doa'}
            </button>
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ marginTop:12, fontSize:11, color:'var(--tx3)', textAlign:'center', lineHeight:1.7 }}>
        رَحِمَهُ اللَّهُ — Semoga Allah merahmati {person.name} dan menempatkannya di surga-Nya. Aamiin.
      </div>
    </div>
  )
}
