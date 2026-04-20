// Gemini Prompt Generator v2 — Lebih akurat, lebih terstruktur
// Memastikan AI tidak ngarang data, hubungan keluarga presisi

import { calculateFamilyStats } from './posterStats'
import { calculateGenerationLevels } from './generationLevel'

export const PROMPT_STYLES = [
  {
    id: 'islami-klasik',
    name: 'Islami Klasik',
    emoji: '🕌',
    desc: 'Kaligrafi Arab, ornamen arabesque, emas-hijau',
    aesthetic: 'traditional Islamic manuscript aesthetic, ornate arabesque geometric patterns (8-pointed stars, interlocking polygons), Ottoman-Andalusian art influence, elegant Naskh Arabic calligraphy accents, warm candlelight tones, gold leaf detailing on deep forest green',
    palette: 'deep emerald green (#0f5132) background, rich gold (#d4af37) for ornaments and accents, warm cream (#fef3d0) for card fills, deep forest green text on cream',
    special: 'Add Arabic calligraphy at the very top in elegant Thuluth or Naskh script: "تَعَلَّمُوا مِنْ أَنْسَابِكُمْ" (translation: "Learn your lineage"). Use thin gold double-border frame. Subtle 8-pointed star pattern in background at very low opacity.',
  },
  {
    id: 'modern-minimalis',
    name: 'Modern Minimalis',
    emoji: '✨',
    desc: 'Bersih, serif elegan, netral',
    aesthetic: 'contemporary minimalist design, generous white space, precise geometric grid layout, refined typography pairing (serif for names, sans-serif for meta), subtle micro-shadows, editorial magazine feel',
    palette: 'off-white background (#fafaf9), charcoal text (#1c1917), single accent color deep indigo (#4338ca), light gray dividers (#e7e5e4)',
    special: 'NO decorative patterns or ornaments. Rely purely on typography hierarchy, whitespace, and subtle horizontal rule dividers. Each person in a clean rounded rectangle with 1px border. Very thin connector lines.',
  },
  {
    id: 'vintage-manuskrip',
    name: 'Vintage Manuskrip',
    emoji: '📜',
    desc: 'Naskah kuno, sepia, floral Victorian',
    aesthetic: 'aged parchment manuscript aesthetic, weathered paper texture with subtle stains and paper fiber details, ornate Victorian floral border illustrations, hand-lettered calligraphy character, nostalgic family heirloom document',
    palette: 'aged cream paper background (#f5ecd9) with natural aging stains at corners, dark sepia brown text (#3f2a14), burnished gold accents (#b8935e), muted burgundy for highlights',
    special: 'Add decorative Victorian scroll ornaments at four corners. Subtle paper texture throughout. Each person card looks like aged paper label. Feel: "a family tree document passed down for 100 years".',
  },
  {
    id: 'nusantara-batik',
    name: 'Nusantara Batik',
    emoji: '🌸',
    desc: 'Motif batik Indonesia, warna sogan',
    aesthetic: 'Indonesian heritage design with traditional Javanese batik patterns (parang, kawung, or mega mendung motifs) as subtle background texture, wayang-inspired ornamental borders, blend of tradition with modern clarity',
    palette: 'traditional sogan batik palette: deep brown (#5d3a1a) primary, rich indigo (#1e3a5f) secondary, cream (#f5ecd6) for cards, burnt sienna accents',
    special: 'Very low-opacity batik parang pattern in background (decorative only, not distracting). Wayang-inspired ornamental frames at top and bottom. Heritage Indonesian feel.',
  },
  {
    id: 'elegan-malam',
    name: 'Elegan Malam',
    emoji: '🌙',
    desc: 'Dark mode premium, emas, starfield',
    aesthetic: 'luxurious dark elegant design, deep midnight background with subtle starfield, premium magazine aesthetic, celestial Islamic night sky feel, gold metallic accents with slight shimmer effect',
    palette: 'midnight navy background (#0b1437) with hint of violet, burnished gold (#e0b849) for text and ornaments, soft cream highlights (#f5e9c8), deep purple undertones',
    special: 'Subtle starfield or delicate constellation pattern in background. Thin gold double-border frame. Small crescent moon ornament at top. Cards have slight gold glow. Feel: "premium heritage document under candlelight".',
  },
]

export function getStyle(id) {
  return PROMPT_STYLES.find(s => s.id === id) || PROMPT_STYLES[0]
}

export function buildGeminiPrompt({ persons, treeName, treeDesc, sizeId, styleId, ownerName }) {
  const stats = calculateFamilyStats(persons)
  const style = getStyle(styleId)
  const sizeInfo = getSizeInfo(sizeId)

  // Build structured tree data — KEY IMPROVEMENT
  const { hierarchy, flatList, relationships } = buildTreeHierarchy(persons)

  const today = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })

  return `Kamu adalah designer grafis profesional yang bertugas membuat poster silsilah keluarga (family tree poster). TUGAS UTAMA: buat 1 gambar tunggal yang menampilkan pohon silsilah ini dengan akurat — SEMUA hubungan keluarga HARUS sama persis dengan data yang diberikan, JANGAN DITAMBAH, JANGAN DIKURANGI, JANGAN DIUBAH.

═══════════════════════════════════════════
📐 SPESIFIKASI OUTPUT
═══════════════════════════════════════════
• Format gambar: ${sizeInfo.label}
• Aspect ratio: ${sizeInfo.ratio}
• Orientasi: ${sizeInfo.orientation}
• Bahasa: Indonesia

═══════════════════════════════════════════
🎨 GAYA VISUAL: ${style.name}
═══════════════════════════════════════════
Aesthetic: ${style.aesthetic}

Palet warna: ${style.palette}

Detail khusus: ${style.special}

═══════════════════════════════════════════
📛 HEADER POSTER
═══════════════════════════════════════════
• Label kecil di atas judul (huruf kapital, letter-spacing lebar): "SILSILAH KELUARGA"
• Judul utama (paling besar, font serif elegan): "${treeName || 'Keluarga Besar'}"
${treeDesc ? `• Subtitle (italic, di bawah judul): "${treeDesc}"` : ''}
${ownerName ? `• Meta (font kecil): "Disusun oleh ${ownerName} · ${today}"` : `• Meta (font kecil): "Dicetak ${today}"`}

═══════════════════════════════════════════
🌳 DATA POHON SILSILAH — WAJIB AKURAT
═══════════════════════════════════════════
⚠️ Perhatian penting:
• Total anggota: ${stats.total} orang
• Jumlah generasi: ${stats.generations}
${stats.yearRange ? `• Rentang tahun: ${stats.yearRange}` : ''}
• Yang almarhum/almarhumah: ${stats.deceasedCount} orang
• Yang masih hidup: ${stats.aliveCount} orang

━━━ HIERARKI PER GENERASI ━━━
(Generasi 1 = tertua/leluhur, ditampilkan di ATAS. Generasi ${stats.generations} = termuda, di BAWAH)

${hierarchy}

━━━ HUBUNGAN KELUARGA (RELATIONSHIPS) ━━━
Berikut HUBUNGAN PASTI antara anggota (anak → orangtua). Tampilkan garis penghubung HANYA sesuai daftar ini:

${relationships}

═══════════════════════════════════════════
📐 LAYOUT & STRUKTUR POHON
═══════════════════════════════════════════
ATURAN WAJIB:
1. Setiap orang dalam kartu rounded rectangle terpisah
2. Di dalam kartu: nama lengkap di atas (bold), tahun di bawah (reguler)
3. Gender indicator: strip warna di kiri kartu
   - Laki-laki (L): strip biru/accent
   - Perempuan (P): strip pink/maroon
4. Anggota yang sudah wafat/almarhum:
   - Tampilkan simbol ☪ kecil di pojok kanan atas kartu
   - Border kartu dashed/putus-putus (bukan solid)
   - Background kartu sedikit lebih gelap/muted
5. Tahun pada kartu:
   - Masih hidup: "lahir YYYY"
   - Sudah wafat: "YYYY – YYYY"
   - Hanya tahun wafat tanpa lahir: "wafat YYYY"
6. Generasi: dari ATAS ke BAWAH (gen tertua di atas)
7. Label "GEN. I", "GEN. II", dst. di kiri setiap baris generasi
8. Garis penghubung: BERSIH, geometris (L-shape), bukan diagonal
   - Garis dari ORANGTUA turun ke ANAK
   - HANYA sesuai daftar relationships di atas

LARANGAN KERAS:
✗ JANGAN tambahkan anggota yang tidak ada di daftar
✗ JANGAN ubah nama, tahun, atau gender
✗ JANGAN buat hubungan yang tidak ada di relationships
✗ JANGAN hilangkan anggota siapapun dari daftar
✗ JANGAN salah ketik nama (copy persis dari data)

═══════════════════════════════════════════
📊 FOOTER
═══════════════════════════════════════════
Di bawah pohon, tampilkan 3 statistik dalam baris horizontal:
• "Total Anggota: ${stats.total}"
• "Generasi: ${stats.generations}"
• "Rentang Tahun: ${stats.yearRange || '—'}"

Di pojok kanan bawah (kecil, halus): "🌳 sulalah.my.id"

═══════════════════════════════════════════
✅ VERIFIKASI AKHIR
═══════════════════════════════════════════
Sebelum selesai, verifikasi:
□ Apakah jumlah kartu = ${stats.total}?
□ Apakah semua nama terbaca jelas dan tidak ada yang salah ketik?
□ Apakah garis hubungan sama persis dengan daftar relationships?
□ Apakah orangtua selalu di atas anaknya?
□ Apakah gaya visual "${style.name}" konsisten?

Buat dengan ketelitian. Ini akan dicetak dan dipajang di rumah keluarga mereka.`
}

// ─── Helper: Build hierarchy using shared smart calculator ───
function buildTreeHierarchy(persons) {
  if (!persons || persons.length === 0) {
    return { hierarchy: '(pohon kosong)', flatList: '', relationships: '' }
  }

  const byId = {}
  persons.forEach(p => { byId[p.id] = p })

  const ids = new Set(persons.map(p => p.id))

  // Use shared smart level calculator (handles partners, etc)
  const level = calculateGenerationLevels(persons)

  // Group per generation
  const gens = {}
  persons.forEach(p => {
    const l = level[p.id]
    if (!gens[l]) gens[l] = []
    gens[l].push(p)
  })
  const genNumbers = Object.keys(gens).map(Number).sort((a, b) => a - b)

  // ── Hierarchy section ──
  const hierarchyLines = []
  genNumbers.forEach(g => {
    hierarchyLines.push(`\n▸ GENERASI ${toRoman(g + 1)} — ${gens[g].length} orang (${g === 0 ? 'leluhur/tertua' : g === genNumbers[genNumbers.length-1] ? 'termuda' : 'tengah'}):`)
    gens[g].forEach((p, idx) => {
      hierarchyLines.push(`   ${idx + 1}. ${formatPersonLine(p)}`)
    })
  })

  // ── Flat list ──
  const flatLines = persons.map((p, i) => `  ${i + 1}. ${formatPersonLine(p)}`)

  // ── Relationships section ──
  // List "CHILD → PARENT(S)"
  const relLines = []
  persons.forEach(p => {
    const parents = []
    if (p.father_id && byId[p.father_id]) parents.push(`ayah: "${byId[p.father_id].name}"`)
    if (p.mother_id && byId[p.mother_id]) parents.push(`ibu: "${byId[p.mother_id].name}"`)
    if (parents.length > 0) {
      relLines.push(`• "${p.name}" — anak dari ${parents.join(', ')}`)
    }
  })

  // Siblings grouping - membantu AI tahu yang sepasang/sesaudara
  const siblingGroups = {}
  persons.forEach(p => {
    const key = `${p.father_id || '_'}|${p.mother_id || '_'}`
    if (key === '_|_') return
    if (!siblingGroups[key]) siblingGroups[key] = []
    siblingGroups[key].push(p.name)
  })
  const siblingLines = Object.values(siblingGroups)
    .filter(group => group.length > 1)
    .map(group => `• Bersaudara (dari orangtua yang sama): ${group.map(n => `"${n}"`).join(', ')}`)

  let relationships = relLines.join('\n')
  if (siblingLines.length > 0) {
    relationships += '\n\n━ Daftar saudara kandung (untuk posisi sejajar): ━\n' + siblingLines.join('\n')
  }
  if (relLines.length === 0) {
    relationships = '(Tidak ada hubungan parent-child tercatat. Tampilkan semua anggota sejajar.)'
  }

  return {
    hierarchy: hierarchyLines.join('\n'),
    flatList: flatLines.join('\n'),
    relationships,
  }
}

function formatPersonLine(p) {
  const parts = [`"${p.name}"`]
  parts.push(p.gender === 'female' ? '[Perempuan]' : '[Laki-laki]')
  if (p.birth_year && p.death_year) parts.push(`(${p.birth_year}–${p.death_year}, almarhum)`)
  else if (p.birth_year) parts.push(`(lahir ${p.birth_year})`)
  else if (p.death_year) parts.push(`(wafat ${p.death_year}, almarhum)`)
  return parts.join(' ')
}

function toRoman(n) {
  const map = [[10,'X'],[9,'IX'],[5,'V'],[4,'IV'],[1,'I']]
  let r = ''
  for (const [v,s] of map) while (n >= v) { r += s; n -= v }
  return r || 'I'
}

function getSizeInfo(sizeId) {
  switch (sizeId) {
    case 'ig-story':
      return { label: 'Instagram Story (1080×1920 px)', ratio: '9:16', orientation: 'portrait (vertikal)' }
    case 'ig-post':
      return { label: 'Instagram Post (1080×1080 px)', ratio: '1:1', orientation: 'square (persegi)' }
    case 'a4-portrait':
      return { label: 'A4 Portrait (2480×3508 px, 210×297 mm)', ratio: '210:297', orientation: 'portrait (vertikal)' }
    case 'a4-landscape':
      return { label: 'A4 Landscape (3508×2480 px, 297×210 mm)', ratio: '297:210', orientation: 'landscape (horisontal)' }
    case 'a3-portrait':
      return { label: 'A3 Portrait (3508×4961 px, 297×420 mm)', ratio: '297:420', orientation: 'portrait (vertikal, besar)' }
    case 'a3-landscape':
      return { label: 'A3 Landscape (4961×3508 px, 420×297 mm)', ratio: '420:297', orientation: 'landscape (horisontal, besar)' }
    case 'kuarto-portrait':
      return { label: 'Kuarto Portrait (2550×3300 px, 216×279 mm)', ratio: '8.5:11', orientation: 'portrait (vertikal)' }
    case 'kuarto-landscape':
      return { label: 'Kuarto Landscape (3300×2550 px, 279×216 mm)', ratio: '11:8.5', orientation: 'landscape (horisontal)' }
    default:
      return { label: 'A4 Portrait', ratio: '210:297', orientation: 'portrait' }
  }
}
