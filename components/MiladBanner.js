'use client'
import { useState, useEffect } from 'react'
import { getMiladMessage } from '../lib/islamic'

export default function MiladBanner({ persons, onDismiss }) {
  const [todayMilad, setTodayMilad] = useState([])
  const [current, setCurrent] = useState(0)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    const today = new Date()
    const todayMM = today.getMonth() + 1
    const todayDD = today.getDate()

    // Cek dismissed hari ini
    const key = `sulalah-milad-dismissed-${today.toDateString()}`
    if (localStorage.getItem(key)) { setDismissed(true); return }

    // Cari yang milad hari ini
    const milad = persons.filter(p => {
      if (!p.birth_year || p.death_year) return false
      // Cek tanggal lahir — jika ada birth_month & birth_day (akan kita tambah nanti)
      // Sementara gunakan approximation: cek apakah birth_year bisa dipakai
      // Untuk sekarang: tampilkan semua yang lahir di bulan ini sebagai demo
      // TODO: tambah birth_month dan birth_day di form
      return false // disable dulu sampai field birth_month/day ada
    })

    // Demo mode — tampilkan kalau ada yang birth_year ada
    // Untuk sekarang, cek manual dari nama bulan
    const withDates = persons.filter(p => p.birth_month && p.birth_day && !p.death_year &&
      parseInt(p.birth_month) === todayMM && parseInt(p.birth_day) === todayDD)

    setTodayMilad(withDates)
  }, [persons])

  function dismiss() {
    const key = `sulalah-milad-dismissed-${new Date().toDateString()}`
    localStorage.setItem(key, '1')
    setDismissed(true)
    if (onDismiss) onDismiss()
  }

  if (dismissed || todayMilad.length === 0) return null

  const p = todayMilad[current]
  const age = new Date().getFullYear() - p.birth_year
  const msg = getMiladMessage(p.name, age)

  return (
    <div style={{ background:'var(--t2)', border:'1px solid var(--t3)', borderRadius:12, padding:'14px 16px', marginBottom:14, position:'relative' }}>
      <button onClick={dismiss} style={{ position:'absolute', top:10, right:12, background:'none', border:'none', cursor:'pointer', color:'var(--t6)', fontSize:14 }}>✕</button>

      <div style={{ display:'flex', alignItems:'flex-start', gap:12 }}>
        <div style={{ fontSize:28, flexShrink:0 }}>🌙</div>
        <div style={{ flex:1, paddingRight:20 }}>
          <div style={{ fontSize:14, fontWeight:700, color:'var(--t6)', marginBottom:4 }}>{msg.title}</div>
          <p style={{ fontSize:12, color:'var(--tx2)', lineHeight:1.7, marginBottom:8 }}>{msg.body}</p>

          {/* Hadits */}
          <div style={{ background:'rgba(255,255,255,.5)', borderRadius:8, padding:'8px 10px', marginBottom:8 }}>
            <p style={{ fontSize:14, textAlign:'right', direction:'rtl', lineHeight:1.9, color:'var(--tx)', fontFamily:'serif', marginBottom:4 }}>{msg.hadith}</p>
            <p style={{ fontSize:11, color:'var(--tx2)', fontStyle:'italic' }}>{msg.hadith_id}</p>
          </div>

          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            {p.phone && (
              <a href={`https://wa.me/${p.phone.replace(/\D/g,'')}`} target="_blank" rel="noreferrer"
                style={{ display:'inline-flex', alignItems:'center', gap:5, background:'var(--t5)', color:'#fff', padding:'6px 14px', borderRadius:20, fontSize:12, fontWeight:600, textDecoration:'none' }}>
                📱 Hubungi {p.name.split(' ')[0]}
              </a>
            )}
            <button onClick={dismiss} style={{ background:'transparent', border:'1px solid var(--t4)', color:'var(--t6)', padding:'6px 14px', borderRadius:20, fontSize:12, cursor:'pointer' }}>
              Tutup
            </button>
          </div>
        </div>
      </div>

      {todayMilad.length > 1 && (
        <div style={{ display:'flex', justifyContent:'center', gap:6, marginTop:10 }}>
          {todayMilad.map((_, i) => (
            <button key={i} onClick={()=>setCurrent(i)} style={{ width:i===current?16:6, height:6, borderRadius:3, background:i===current?'var(--t5)':'var(--t3)', border:'none', cursor:'pointer', transition:'all .3s', padding:0 }} />
          ))}
        </div>
      )}
    </div>
  )
}
