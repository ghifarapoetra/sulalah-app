// Mahram detection — Nasab + Mushaharah (Rada'ah coming later)

export function getMahram(pid, persons, marriages = []) {
  const map = {}
  persons.forEach(p => map[p.id] = p)

  const getParents = id => [map[id]?.father_id, map[id]?.mother_id].filter(x => x && map[x])
  const getChildren = id => persons.filter(p => p.father_id === id || p.mother_id === id).map(p => p.id)

  // ─── NASAB ───
  const ancestors = new Set()
  const addAncestors = id => getParents(id).forEach(x => { if (!ancestors.has(x)) { ancestors.add(x); addAncestors(x) } })
  addAncestors(pid)

  const descendants = new Set()
  const addDescendants = id => getChildren(id).forEach(x => { if (!descendants.has(x)) { descendants.add(x); addDescendants(x) } })
  addDescendants(pid)

  const myParents = getParents(pid)
  const siblings = new Set(persons.filter(p => p.id !== pid && myParents.some(x => p.father_id === x || p.mother_id === x)).map(p => p.id))

  const unclesAunts = new Set()
  myParents.forEach(x => {
    const gps = getParents(x)
    persons.filter(p => p.id !== x && gps.some(g => p.father_id === g || p.mother_id === g)).forEach(p => unclesAunts.add(p.id))
  })

  const niecesNephews = new Set()
  siblings.forEach(s => getChildren(s).forEach(x => niecesNephews.add(x)))

  const nasab = new Set([...ancestors, ...descendants, ...siblings, ...unclesAunts, ...niecesNephews])

  // ─── MUSHAHARAH ───
  // Detect spouse(s) of pid: via marriages table OR shared children
  const mushaharah = new Set()

  const getSpouses = (id) => {
    const spouses = new Set()
    // From marriages table
    marriages.forEach(m => {
      if (m.status === 'active' || m.status === undefined) {
        if (m.person1_id === id && map[m.person2_id]) spouses.add(m.person2_id)
        if (m.person2_id === id && map[m.person1_id]) spouses.add(m.person1_id)
      }
    })
    // From shared children (auto-detect)
    persons.forEach(p => {
      if (p.father_id === id && p.mother_id && map[p.mother_id]) spouses.add(p.mother_id)
      if (p.mother_id === id && p.father_id && map[p.father_id]) spouses.add(p.father_id)
    })
    return spouses
  }

  const mySpouses = getSpouses(pid)

  mySpouses.forEach(spouseId => {
    // Pasangan sendiri = halal (bukan mahram, tapi diketahui)
    // Yang menjadi mahram karena pernikahan:

    // 1. Orang tua pasangan (mertua) → mahram
    getParents(spouseId).forEach(p => mushaharah.add(p))

    // 2. Anak pasangan dari pernikahan lain (anak tiri) → mahram
    getChildren(spouseId).forEach(c => { if (!descendants.has(c)) mushaharah.add(c) })

    // 3. Cucu pasangan dari pernikahan lain → mahram
    getChildren(spouseId).forEach(c => {
      getChildren(c).forEach(gc => { if (!descendants.has(gc)) mushaharah.add(gc) })
    })
  })

  // Menantu (suami/istri dari anak kandung) → mahram mushaharah
  descendants.forEach(descId => {
    getSpouses(descId).forEach(spouseOfDesc => {
      if (!nasab.has(spouseOfDesc)) mushaharah.add(spouseOfDesc)
    })
  })

  // Hapus overlap — nasab lebih prioritas
  mushaharah.forEach(id => { if (nasab.has(id)) mushaharah.delete(id) })
  // Hapus diri sendiri
  mushaharah.delete(pid)
  nasab.delete(pid)

  const all = new Set([...nasab, ...mushaharah])

  return {
    ancestors: [...ancestors],
    descendants: [...descendants],
    siblings: [...siblings],
    unclesAunts: [...unclesAunts],
    niecesNephews: [...niecesNephews],
    nasab,
    mushaharah,
    all,
  }
}

export function getGeneration(id, map, cache = {}, visited = new Set()) {
  if (id in cache) return cache[id]
  if (visited.has(id)) return 0
  visited.add(id)
  const p = map[id]
  if (!p) return cache[id] = 0
  const pg = [p.father_id, p.mother_id].filter(x => x && map[x]).map(x => getGeneration(x, map, cache, new Set(visited)))
  return cache[id] = pg.length ? Math.max(...pg) + 1 : 0
}

export function computeGenerations(persons) {
  const map = {}
  persons.forEach(p => map[p.id] = p)
  const cache = {}
  persons.forEach(p => getGeneration(p.id, map, cache))
  const couples = new Map()
  persons.forEach(p => {
    if (p.father_id && p.mother_id && map[p.father_id] && map[p.mother_id]) {
      const key = [p.father_id, p.mother_id].sort().join('|')
      couples.set(key, { a: p.father_id, b: p.mother_id })
    }
  })
  let changed = true, iter = 0
  while (changed && iter++ < 10) {
    changed = false
    couples.forEach(({ a, b }) => {
      const ga = cache[a] ?? 0, gb = cache[b] ?? 0
      if (ga !== gb) { const mx = Math.max(ga, gb); cache[a] = mx; cache[b] = mx; changed = true }
    })
  }
  return cache
}
