export function getMahram(pid, persons) {
  const map = {}
  persons.forEach(p => map[p.id] = p)
  const getParents = id => [map[id]?.father_id, map[id]?.mother_id].filter(x => x && map[x])
  const getChildren = id => persons.filter(p => p.father_id === id || p.mother_id === id).map(p => p.id)
  const ancestors = new Set()
  const addAncestors = id => getParents(id).forEach(x => { if (!ancestors.has(x)) { ancestors.add(x); addAncestors(x) } })
  addAncestors(pid)
  const descendants = new Set()
  const addDescendants = id => getChildren(id).forEach(x => { if (!descendants.has(x)) { descendants.add(x); addDescendants(x) } })
  addDescendants(pid)
  const myParents = getParents(pid)
  const siblings = new Set(persons.filter(p => p.id !== pid && myParents.some(x => p.father_id === x || p.mother_id === x)).map(p => p.id))
  const unclesAunts = new Set()
  myParents.forEach(x => { const gps = getParents(x); persons.filter(p => p.id !== x && gps.some(g => p.father_id === g || p.mother_id === g)).forEach(p => unclesAunts.add(p.id)) })
  const niecesNephews = new Set()
  siblings.forEach(s => getChildren(s).forEach(x => niecesNephews.add(x)))
  const all = new Set([...ancestors, ...descendants, ...siblings, ...unclesAunts, ...niecesNephews])
  return { ancestors: [...ancestors], descendants: [...descendants], siblings: [...siblings], unclesAunts: [...unclesAunts], niecesNephews: [...niecesNephews], all }
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
  // Cari semua pasangan (punya anak bersama)
  const couples = new Map()
  persons.forEach(p => {
    if (p.father_id && p.mother_id && map[p.father_id] && map[p.mother_id]) {
      const key = [p.father_id, p.mother_id].sort().join('|')
      couples.set(key, { a: p.father_id, b: p.mother_id })
    }
  })
  // Samakan generasi pasangan (ambil yang lebih tinggi/dalam)
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
