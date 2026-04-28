/**
 * SULALAH — Kalkulator Waris Faraid
 * Mazhab Syafi'i (default)
 * 
 * Referensi: Fiqh Mawaris (Dr. Wahbah Zuhaili), Rahabiyyah, Sirajiyyah
 */

// ─── PECAHAN ───────────────────────────────────────────────────────────
function gcd(a, b) { return b === 0 ? a : gcd(b, a % b) }
function frac(num, den) {
  if (den === 0) return { num: 0, den: 1 }
  const g = gcd(Math.abs(num), Math.abs(den))
  return { num: num / g, den: den / g }
}
function addFrac(a, b) { return frac(a.num * b.den + b.num * a.den, a.den * b.den) }
function subFrac(a, b) { return frac(a.num * b.den - b.num * a.den, a.den * b.den) }
function mulFrac(a, b) { return frac(a.num * b.num, a.den * b.den) }
function divFrac(a, b) { return frac(a.num * b.den, a.den * b.num) }
function fracToStr(f) {
  if (f.den === 1) return String(f.num)
  return `${f.num}/${f.den}`
}
function fracGt(a, b) { return a.num * b.den > b.num * a.den }
const ZERO = { num: 0, den: 1 }
const ONE = { num: 1, den: 1 }

// ─── DETEKSI AHLI WARIS ────────────────────────────────────────────────
/**
 * Mendeteksi ahli waris dari data pohon keluarga.
 * Mengembalikan objek dengan semua relasi yang relevan.
 */
export function detectHeirs(deceasedId, persons, marriages = []) {
  const map = {}
  persons.forEach(p => map[p.id] = p)
  const deceased = map[deceasedId]
  if (!deceased) return null

  const isAlive = id => id && map[id] && !map[id].death_year
  const getChildren = id => persons.filter(p =>
    (p.father_id === id || p.mother_id === id) && isAlive(p.id)
  )
  const getDeadChildren = id => persons.filter(p =>
    (p.father_id === id || p.mother_id === id) && !isAlive(p.id)
  )

  // Pasangan (istri/suami) — via marriages + shared children
  const spouses = new Set()
  marriages.forEach(m => {
    if (m.status === 'active') {
      if (m.person1_id === deceasedId && isAlive(m.person2_id)) spouses.add(m.person2_id)
      if (m.person2_id === deceasedId && isAlive(m.person1_id)) spouses.add(m.person1_id)
    }
  })
  persons.forEach(p => {
    if (p.father_id === deceasedId && p.mother_id && isAlive(p.mother_id)) spouses.add(p.mother_id)
    if (p.mother_id === deceasedId && p.father_id && isAlive(p.father_id)) spouses.add(p.father_id)
  })

  // Anak langsung
  const sons = getChildren(deceasedId).filter(p => p.gender === 'male')
  const daughters = getChildren(deceasedId).filter(p => p.gender === 'female')

  // Cucu dari anak laki-laki (hanya jalur laki)
  const deadSons = getDeadChildren(deceasedId).filter(p => p.gender === 'male')
  const grandsonsViaSon = []
  const granddaughtersViaSon = []
  deadSons.forEach(ds => {
    getChildren(ds.id).forEach(gc => {
      if (gc.gender === 'male') grandsonsViaSon.push({ ...gc, _via: ds })
      else granddaughtersViaSon.push({ ...gc, _via: ds })
    })
  })

  // Ayah
  const father = deceased.father_id && isAlive(deceased.father_id) ? map[deceased.father_id] : null

  // Ibu
  const mother = deceased.mother_id && isAlive(deceased.mother_id) ? map[deceased.mother_id] : null

  // Kakek (ayah dari ayah) — hanya jika ayah tidak ada
  const paternalGrandfather = !father && deceased.father_id && map[deceased.father_id]?.father_id && isAlive(map[deceased.father_id]?.father_id)
    ? map[map[deceased.father_id].father_id] : null

  // Nenek (ibu dari ibu, atau ibu dari ayah)
  const maternalGrandmother = !mother && deceased.mother_id && map[deceased.mother_id]?.mother_id && isAlive(map[deceased.mother_id]?.mother_id)
    ? map[map[deceased.mother_id].mother_id] : null
  const paternalGrandmother = !mother && deceased.father_id && map[deceased.father_id]?.mother_id && isAlive(map[deceased.father_id]?.mother_id)
    ? map[map[deceased.father_id].mother_id] : null

  // Saudara — perlu kedua orang tua almarhum diketahui
  const getSiblings = () => {
    const dadId = deceased.father_id
    const momId = deceased.mother_id
    const fullSiblings = [], halfSiblingsByFather = [], halfSiblingsByMother = []
    persons.forEach(p => {
      if (p.id === deceasedId || !isAlive(p.id)) return
      const shareFather = dadId && p.father_id === dadId
      const shareMother = momId && p.mother_id === momId
      if (shareFather && shareMother) fullSiblings.push(p)
      else if (shareFather && !shareMother) halfSiblingsByFather.push(p)
      else if (!shareFather && shareMother) halfSiblingsByMother.push(p)
    })
    return { fullSiblings, halfSiblingsByFather, halfSiblingsByMother }
  }
  const { fullSiblings, halfSiblingsByFather, halfSiblingsByMother } = getSiblings()

  const fullBrothers = fullSiblings.filter(p => p.gender === 'male')
  const fullSisters = fullSiblings.filter(p => p.gender === 'female')
  const halfBrothersByFather = halfSiblingsByFather.filter(p => p.gender === 'male')
  const halfSistersByFather = halfSiblingsByFather.filter(p => p.gender === 'female')
  const halfSiblingsByMotherAll = halfSiblingsByMother // laki + perempuan dapat sama

  // Paman (saudara laki-laki ayah) — fallback jauh
  const paternalUncles = []
  if (deceased.father_id && map[deceased.father_id]) {
    const grandpa = map[deceased.father_id].father_id
    if (grandpa) {
      persons.forEach(p => {
        if (isAlive(p.id) && p.gender === 'male' && p.father_id === grandpa && p.id !== deceased.father_id) {
          paternalUncles.push(p)
        }
      })
    }
  }

  return {
    deceased,
    spouses: [...spouses].map(id => map[id]).filter(Boolean),
    sons, daughters,
    grandsonsViaSon, granddaughtersViaSon,
    father, mother,
    paternalGrandfather, maternalGrandmother, paternalGrandmother,
    fullBrothers, fullSisters,
    halfBrothersByFather, halfSistersByFather,
    halfSiblingsByMotherAll,
    paternalUncles,
  }
}

// ─── KALKULASI FARAID (SYAFI'I) ─────────────────────────────────────────
/**
 * Menghitung bagian waris setiap ahli waris.
 * Mengembalikan array hasil + info aul/radd.
 */
export function calculateFaraid(deceasedId, persons, marriages = []) {
  const h = detectHeirs(deceasedId, persons, marriages)
  if (!h) return null

  const deceased = h.deceased
  const isFemaleDec = deceased.gender === 'female'

  // Apakah ada anak/cucu (menghalangi beberapa ahli waris)
  const hasChildren = h.sons.length > 0 || h.daughters.length > 0
  const hasChildrenOrGrandchildren = hasChildren || h.grandsonsViaSon.length > 0 || h.granddaughtersViaSon.length > 0
  const hasSon = h.sons.length > 0 || h.grandsonsViaSon.length > 0
  const hasMaleDescendant = hasSon

  // Apakah ada saudara 2+ (menghalangi ibu ke 1/6)
  const siblingsCount = h.fullBrothers.length + h.fullSisters.length +
    h.halfBrothersByFather.length + h.halfSistersByFather.length +
    h.halfSiblingsByMotherAll.length

  const results = [] // { person, role, share (frac), type, hajb }

  const add = (person, role, share, type = 'furudh', note = '') => {
    results.push({ person, role, share, type, note })
  }

  // ── 1. SUAMI / ISTRI ──
  h.spouses.forEach(sp => {
    const isHusband = sp.gender === 'male'
    if (isHusband) {
      // Suami: 1/2 tanpa anak, 1/4 dengan anak
      add(sp, 'Suami', hasChildrenOrGrandchildren ? frac(1,4) : frac(1,2), 'furudh',
        hasChildrenOrGrandchildren ? 'Terhijab nuqshan oleh anak' : '')
    } else {
      // Istri: 1/4 tanpa anak, 1/8 dengan anak (dibagi rata jika lebih dari 1)
      const raw = hasChildrenOrGrandchildren ? frac(1,8) : frac(1,4)
      const note = hasChildrenOrGrandchildren ? 'Terhijab nuqshan oleh anak' : ''
      if (h.spouses.filter(s => s.gender === 'female').length > 1) {
        // Dibagi rata
        const count = h.spouses.filter(s => s.gender === 'female').length
        if (sp.id === h.spouses.filter(s => s.gender === 'female')[0].id) {
          add(sp, `Istri (${count} orang, dibagi rata)`, divFrac(raw, frac(count, 1)), 'furudh', note)
        }
        return
      }
      add(sp, 'Istri', raw, 'furudh', note)
    }
  })

  // ── 2. AYAH ──
  if (h.father) {
    if (hasSon) {
      // Ada anak laki → ayah dapat 1/6 saja
      add(h.father, 'Ayah', frac(1,6), 'furudh', 'Ada anak laki-laki')
    } else if (hasChildren) {
      // Ada anak perempuan saja → ayah 1/6 furudh + sisa (asabah)
      add(h.father, 'Ayah', frac(1,6), 'furudh+asabah', 'Dapat 1/6 + sisa (ada anak perempuan)')
    } else {
      // Tidak ada anak → ayah asabah (ambil semua sisa)
      add(h.father, 'Ayah', null, 'asabah', 'Tidak ada anak')
    }
  }

  // ── 3. IBU ──
  if (h.mother) {
    if (hasChildrenOrGrandchildren || siblingsCount >= 2) {
      const note = hasChildrenOrGrandchildren ? 'Terhijab nuqshan oleh anak'
        : `Terhijab nuqshan oleh ${siblingsCount} saudara`
      add(h.mother, 'Ibu', frac(1,6), 'furudh', note)
    } else {
      // Tidak ada anak & saudara < 2: ibu dapat 1/3
      // Kasus Gharrawain: jika ada suami/istri + ayah + ibu saja
      const hasSpouse = h.spouses.length > 0
      if (hasSpouse && h.father && !hasChildrenOrGrandchildren && siblingsCount === 0) {
        // Gharrawain: ibu dapat 1/3 dari sisa
        add(h.mother, 'Ibu', null, 'gharrawain', 'Kasus Gharrawain: 1/3 dari sisa setelah pasangan')
      } else {
        add(h.mother, 'Ibu', frac(1,3), 'furudh', '')
      }
    }
  }

  // ── 4. KAKEK (paternal) — jika tidak ada ayah ──
  if (!h.father && h.paternalGrandfather) {
    if (hasSon) {
      add(h.paternalGrandfather, 'Kakek (dari ayah)', frac(1,6), 'furudh', 'Ada anak laki-laki')
    } else if (hasChildren) {
      add(h.paternalGrandfather, 'Kakek (dari ayah)', frac(1,6), 'furudh+asabah', 'Ada anak perempuan')
    } else {
      add(h.paternalGrandfather, 'Kakek (dari ayah)', null, 'asabah', '')
    }
  }

  // ── 5. NENEK ──
  const grandmothers = [h.maternalGrandmother, h.paternalGrandmother].filter(Boolean)
  if (grandmothers.length > 0) {
    // Nenek dapat 1/6, dibagi rata jika keduanya ada
    const share = grandmothers.length === 1 ? frac(1,6) : frac(1,12) // 1/6 ÷ 2
    grandmothers.forEach(gm => {
      const label = gm.id === h.maternalGrandmother?.id ? 'Nenek (dari ibu)' : 'Nenek (dari ayah)'
      add(gm, label, share, 'furudh', grandmothers.length > 1 ? 'Dibagi rata 2 nenek' : '')
    })
  }

  // ── 6. ANAK LAKI-LAKI ──
  // Anak laki = asabah, tapi perlu tahu jumlah anak perempuan untuk rasio 2:1
  const totalChildren = h.sons.length + h.daughters.length
  if (totalChildren > 0) {
    // Anak perempuan tanpa saudara laki → furudh
    if (h.sons.length === 0) {
      if (h.daughters.length === 1) {
        add(h.daughters[0], 'Anak Perempuan', frac(1,2), 'furudh', '')
      } else {
        const sharePerDaughter = divFrac(frac(2,3), frac(h.daughters.length, 1))
        h.daughters.forEach((d, i) => {
          add(d, `Anak Perempuan (${i+1} dari ${h.daughters.length})`, sharePerDaughter, 'furudh', '2/3 dibagi rata')
        })
      }
    } else {
      // Ada anak laki: semua asabah, laki = 2× perempuan
      // Total unit: tiap laki = 2, tiap perempuan = 1
      const units = h.sons.length * 2 + h.daughters.length
      h.sons.forEach((s, i) => {
        add(s, `Anak Laki-laki (${i+1} dari ${h.sons.length})`, null, 'asabah-ratio', `${h.sons.length} laki + ${h.daughters.length} perempuan, rasio 2:1`)
      })
      h.daughters.forEach((d, i) => {
        add(d, `Anak Perempuan (${i+1} dari ${h.daughters.length})`, null, 'asabah-ratio', `${h.sons.length} laki + ${h.daughters.length} perempuan, rasio 2:1`)
      })
    }
  }

  // ── 7. CUCU (dari anak laki) — jika tidak ada anak ──
  if (!hasChildren && (h.grandsonsViaSon.length > 0 || h.granddaughtersViaSon.length > 0)) {
    const units = h.grandsonsViaSon.length * 2 + h.granddaughtersViaSon.length
    if (h.grandsonsViaSon.length === 0) {
      // Cucu perempuan saja
      if (h.granddaughtersViaSon.length === 1) {
        add(h.granddaughtersViaSon[0], 'Cucu Perempuan (dari anak laki)', frac(1,2), 'furudh', '')
      } else {
        const s = divFrac(frac(2,3), frac(h.granddaughtersViaSon.length, 1))
        h.granddaughtersViaSon.forEach((gc, i) => add(gc, `Cucu Perempuan (${i+1})`, s, 'furudh', '2/3 dibagi rata'))
      }
    } else {
      h.grandsonsViaSon.forEach((gc, i) => add(gc, `Cucu Laki (${i+1})`, null, 'asabah-ratio', 'Rasio 2:1'))
      h.granddaughtersViaSon.forEach((gc, i) => add(gc, `Cucu Perempuan (${i+1})`, null, 'asabah-ratio', 'Rasio 2:1'))
    }
  }

  // ── 8. SAUDARA (hanya jika tidak ada ayah, kakek, atau anak laki) ──
  const blockedSiblings = h.father || h.paternalGrandfather || hasMaleDescendant
  if (!blockedSiblings) {
    // Saudara kandung (sekandung)
    if (h.fullBrothers.length > 0 || h.fullSisters.length > 0) {
      if (h.fullBrothers.length === 0) {
        // Saudari kandung saja
        if (h.fullSisters.length === 1) {
          // Bisa asabah jika ada anak perempuan
          if (h.daughters.length > 0 || h.granddaughtersViaSon.length > 0) {
            add(h.fullSisters[0], 'Saudari Kandung', null, 'asabah-with-daughter', 'Asabah bersama anak/cucu perempuan')
          } else {
            add(h.fullSisters[0], 'Saudari Kandung', frac(1,2), 'furudh', '')
          }
        } else {
          if (h.daughters.length > 0 || h.granddaughtersViaSon.length > 0) {
            h.fullSisters.forEach((s, i) => add(s, `Saudari Kandung (${i+1})`, null, 'asabah-with-daughter', 'Asabah bersama anak perempuan'))
          } else {
            const sh = divFrac(frac(2,3), frac(h.fullSisters.length, 1))
            h.fullSisters.forEach((s, i) => add(s, `Saudari Kandung (${i+1})`, sh, 'furudh', '2/3 dibagi rata'))
          }
        }
      } else {
        // Ada saudara kandung laki → asabah 2:1
        h.fullBrothers.forEach((s, i) => add(s, `Saudara Kandung (${i+1})`, null, 'asabah-ratio', 'Rasio 2:1'))
        h.fullSisters.forEach((s, i) => add(s, `Saudari Kandung (${i+1})`, null, 'asabah-ratio', 'Rasio 2:1'))
      }
    }

    // Saudara seayah — hanya jika tidak ada saudara kandung
    const noFullSibling = h.fullBrothers.length === 0 && h.fullSisters.length === 0
    if (noFullSibling && (h.halfBrothersByFather.length > 0 || h.halfSistersByFather.length > 0)) {
      if (h.halfBrothersByFather.length === 0) {
        if (h.halfSistersByFather.length === 1) {
          add(h.halfSistersByFather[0], 'Saudari Seayah', frac(1,2), 'furudh', '')
        } else {
          const sh = divFrac(frac(2,3), frac(h.halfSistersByFather.length, 1))
          h.halfSistersByFather.forEach((s, i) => add(s, `Saudari Seayah (${i+1})`, sh, 'furudh', '2/3 dibagi rata'))
        }
      } else {
        h.halfBrothersByFather.forEach((s, i) => add(s, `Saudara Seayah (${i+1})`, null, 'asabah-ratio', 'Rasio 2:1'))
        h.halfSistersByFather.forEach((s, i) => add(s, `Saudari Seayah (${i+1})`, null, 'asabah-ratio', 'Rasio 2:1'))
      }
    }

    // Saudara/i seibu — dapat 1/6 (1 orang) atau 1/3 (2+ orang), tanpa ada anak/kakek
    if (!hasChildrenOrGrandchildren && !h.paternalGrandfather) {
      const seibu = h.halfSiblingsByMotherAll
      if (seibu.length > 0) {
        const noFullOrPaternal = noFullSibling && h.halfBrothersByFather.length === 0 && h.halfSistersByFather.length === 0
        if (noFullOrPaternal) {
          if (seibu.length === 1) {
            add(seibu[0], `Saudara/i Seibu`, frac(1,6), 'furudh', '')
          } else {
            const sh = divFrac(frac(1,3), frac(seibu.length, 1))
            seibu.forEach((s, i) => add(s, `Saudara/i Seibu (${i+1})`, sh, 'furudh', '1/3 dibagi rata'))
          }
        }
      }
    }
  }

  // ── 9. PAMAN (paternalUncles) — asabah jauh, hanya jika tidak ada yg lebih dekat ──
  const hasCloserAsabah = h.father || h.paternalGrandfather || h.sons.length > 0 ||
    h.grandsonsViaSon.length > 0 || h.fullBrothers.length > 0 || h.halfBrothersByFather.length > 0
  if (!hasCloserAsabah && h.paternalUncles.length > 0) {
    h.paternalUncles.forEach((u, i) => {
      add(u, `Paman (saudara laki ayah) (${i+1})`, null, 'asabah', 'Asabah jauh')
    })
  }

  // ─── HITUNG PEMBAGIAN AKTUAL ───────────────────────────────────────────
  return computeShares(results, h)
}

function computeShares(rawResults, h) {
  // Pisah jenis
  const furudhItems = rawResults.filter(r => r.type === 'furudh' && r.share)
  const asabahItems = rawResults.filter(r => r.type === 'asabah' || r.type === 'furudh+asabah' || r.type === 'asabah-ratio' || r.type === 'asabah-with-daughter')
  const gharrawainItems = rawResults.filter(r => r.type === 'gharrawain')

  // Total furudh
  let totalFurudh = ZERO
  furudhItems.forEach(r => { totalFurudh = addFrac(totalFurudh, r.share) })

  // Sisa untuk asabah
  let remainder = subFrac(ONE, totalFurudh)

  // Cek Aul (furudh melebihi 1)
  let isAul = false
  if (remainder.num < 0) {
    isAul = true
    remainder = ZERO
  }

  // Cek Radd (sisa ada, tidak ada asabah, ada ahli waris)
  let isRadd = false
  if (!isAul && remainder.num > 0 && asabahItems.length === 0 && gharrawainItems.length === 0) {
    // Radd ke furudh (kecuali suami/istri)
    isRadd = true
  }

  const final = []

  if (isAul) {
    // AUL: semua bagian dikurangi proporsional
    // Penyebut bersama dari semua furudh
    let totalNumerators = ZERO
    furudhItems.forEach(r => { totalNumerators = addFrac(totalNumerators, r.share) })
    furudhItems.forEach(r => {
      const adjustedShare = divFrac(r.share, totalNumerators)
      final.push({ ...r, share: adjustedShare, shareOriginal: r.share, isAulAdjusted: true })
    })
  } else if (isRadd) {
    // RADD: sisa dikembalikan ke ahli waris selain suami/istri
    const raddCandidates = furudhItems.filter(r => r.role !== 'Suami' && r.role !== 'Istri')
    const spouseItems = furudhItems.filter(r => r.role === 'Suami' || r.role === 'Istri')

    spouseItems.forEach(r => final.push({ ...r }))

    let raddTotal = ZERO
    raddCandidates.forEach(r => { raddTotal = addFrac(raddTotal, r.share) })

    raddCandidates.forEach(r => {
      // Proporsi dari total radd candidates
      const proportion = divFrac(r.share, raddTotal)
      const newShare = addFrac(r.share, mulFrac(proportion, remainder))
      final.push({ ...r, share: newShare, isRaddAdjusted: true })
    })
  } else {
    furudhItems.forEach(r => final.push({ ...r }))
  }

  // ASABAH — bagi sisa
  if (!isAul && asabahItems.length > 0) {
    const asabahRatio = asabahItems.filter(r => r.type === 'asabah-ratio' || r.type === 'asabah-with-daughter')
    const plainAsabah = asabahItems.filter(r => r.type === 'asabah' || r.type === 'furudh+asabah')

    // Ayah furudh+asabah: sudah dapat 1/6 furudh, tambah sisa
    const fatherFurudhAsabah = furudhItems.find(r => r.type === 'furudh+asabah')

    if (asabahRatio.length > 0) {
      // Rasio 2:1 — hitung units
      const units = asabahRatio.reduce((sum, r) => {
        return sum + (r.role.includes('Laki') || r.role.includes('Saudara') && !r.role.includes('Saudari') ? 2 : 1)
      }, 0)
      asabahRatio.forEach(r => {
        const isLaki = r.role.includes('Laki') || (r.role.includes('Saudara') && !r.role.includes('Saudari'))
        const myUnit = isLaki ? 2 : 1
        const share = mulFrac(remainder, frac(myUnit, units))
        final.push({ ...r, share })
      })
    } else {
      // Plain asabah — bagi rata
      plainAsabah.forEach(r => {
        const share = remainder // bisa lebih dari 1 ahli waris asabah tapi jarang
        if (r.type === 'furudh+asabah') {
          // Tambah sisa ke furudh yang sudah ada
          const existingFurudh = final.find(f => f.person?.id === r.person?.id)
          if (existingFurudh) {
            existingFurudh.share = addFrac(existingFurudh.share, remainder)
            existingFurudh.note += ` + sisa harta`
          } else {
            final.push({ ...r, share: addFrac(r.share || ZERO, remainder) })
          }
        } else {
          const perAsabah = plainAsabah.length > 1 ? divFrac(remainder, frac(plainAsabah.length, 1)) : remainder
          final.push({ ...r, share: perAsabah })
        }
      })
    }
  }

  // Gharrawain
  if (gharrawainItems.length > 0 && !isAul) {
    // Suami dapat 1/2, ayah dapat sisa setelah ibu, ibu dapat 1/3 dari sisa
    const spouseShare = final.find(f => f.role === 'Suami')?.share || ZERO
    const afterSpouse = subFrac(ONE, spouseShare)
    const motherShare = divFrac(afterSpouse, frac(3, 1)) // 1/3 dari sisa
    const fatherShare = subFrac(afterSpouse, motherShare)

    gharrawainItems.forEach(r => {
      final.push({ ...r, share: motherShare, note: 'Gharrawain: 1/3 dari sisa setelah pasangan' })
    })
    // Ayah sudah ada? Update
    const ayahIdx = final.findIndex(f => f.role === 'Ayah')
    if (ayahIdx >= 0) {
      final[ayahIdx].share = fatherShare
      final[ayahIdx].note = 'Gharrawain: 2/3 dari sisa setelah pasangan'
    }
  }

  // Sort: pasangan → ayah → ibu → kakek → nenek → anak → cucu → saudara → paman
  const order = ['Suami','Istri','Ayah','Ibu','Kakek','Nenek','Anak','Cucu','Saudara','Saudari','Paman']
  final.sort((a,b) => {
    const ai = order.findIndex(o => a.role.startsWith(o))
    const bi = order.findIndex(o => b.role.startsWith(o))
    return (ai<0?99:ai) - (bi<0?99:bi)
  })

  return {
    heirs: final,
    isAul,
    isRadd,
    totalFurudhBefore: isAul ? addFrac(ZERO, ...furudhItems.map(r=>r.share)) : totalFurudh,
    madzhab: 'Syafi\'i',
    deceasedName: h.deceased.name,
    deceasedGender: h.deceased.gender,
  }
}

// ─── FORMAT HASIL ─────────────────────────────────────────────────────
export function formatResult(result, totalHarta = null) {
  if (!result) return null
  return result.heirs.map(h => {
    const pct = h.share ? (h.share.num / h.share.den * 100).toFixed(2) : '0'
    const nominal = totalHarta && h.share ? Math.round(totalHarta * h.share.num / h.share.den) : null
    return {
      id: h.person?.id,
      name: h.person?.name || '—',
      role: h.role,
      shareStr: h.share ? fracToStr(h.share) : '—',
      pct,
      nominal,
      note: h.note || '',
      isAulAdjusted: h.isAulAdjusted || false,
      isRaddAdjusted: h.isRaddAdjusted || false,
    }
  })
}

export { fracToStr, frac }
