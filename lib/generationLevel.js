// Sulalah Smart Generation Level Calculator
// Handles: nasab parent-child + pasangan (spouse detection via shared children)

/**
 * Calculate generation level for all persons in a tree.
 * Returns: { [person_id]: level_number } starting at 0 (oldest) 
 * 
 * Algorithm (4 layers, iterative until stable):
 *   1. Person with parent_id → level = max(parent levels) + 1
 *   2. Person without parent but shares children with another person 
 *      → level = level of that partner (spouse detection)
 *   3. Person without parent but has children in tree 
 *      → level = level of first child - 1
 *   4. Otherwise → level = 0 (true ancestor)
 */
export function calculateGenerationLevels(persons) {
  if (!persons || persons.length === 0) return {}

  const ids = new Set(persons.map(p => p.id))
  const byId = {}
  persons.forEach(p => { byId[p.id] = p })

  // Build parent → children map
  const childrenMap = {}
  persons.forEach(p => {
    [p.father_id, p.mother_id].filter(pid => pid && ids.has(pid)).forEach(pid => {
      if (!childrenMap[pid]) childrenMap[pid] = []
      if (!childrenMap[pid].includes(p.id)) childrenMap[pid].push(p.id)
    })
  })

  // Build partner map — 2 people are partners if they share any child
  // Partner map: { person_id: [partner_ids] }
  const partnerMap = {}
  persons.forEach(p => {
    if (p.father_id && p.mother_id && ids.has(p.father_id) && ids.has(p.mother_id)) {
      const f = p.father_id, m = p.mother_id
      if (!partnerMap[f]) partnerMap[f] = new Set()
      if (!partnerMap[m]) partnerMap[m] = new Set()
      partnerMap[f].add(m)
      partnerMap[m].add(f)
    }
  })

  // Initialize levels
  const level = {}

  // Iterate until stable
  let changed = true
  let iterations = 0
  const maxIter = persons.length * 3 + 10 // safety limit

  while (changed && iterations < maxIter) {
    changed = false
    iterations++

    persons.forEach(p => {
      let newLevel = null

      // Layer 1: has parent in tree
      const parentIds = [p.father_id, p.mother_id].filter(pid => pid && ids.has(pid))
      if (parentIds.length > 0) {
        const parentLevels = parentIds.map(pid => level[pid]).filter(l => l !== undefined)
        if (parentLevels.length > 0) {
          newLevel = Math.max(...parentLevels) + 1
        }
      }

      // Layer 2: no parent, but has partner with known level (spouse)
      if (newLevel === null && parentIds.length === 0) {
        const partners = partnerMap[p.id]
        if (partners && partners.size > 0) {
          const partnerLevels = Array.from(partners)
            .map(pid => level[pid])
            .filter(l => l !== undefined)
          if (partnerLevels.length > 0) {
            // Use max partner level to keep them aligned with partner's generation
            newLevel = Math.max(...partnerLevels)
          }
        }
      }

      // Layer 3: no parent, no partner with known level, but has children
      if (newLevel === null && parentIds.length === 0) {
        const kids = childrenMap[p.id] || []
        if (kids.length > 0) {
          const kidLevels = kids.map(kid => level[kid]).filter(l => l !== undefined)
          if (kidLevels.length > 0) {
            // Level = min(children levels) - 1, so parent is above children
            newLevel = Math.min(...kidLevels) - 1
          }
        }
      }

      // Layer 4: true ancestor
      if (newLevel === null && parentIds.length === 0) {
        if (level[p.id] === undefined) {
          newLevel = 0
        }
      }

      if (newLevel !== null && (level[p.id] === undefined || level[p.id] !== newLevel)) {
        // Only update if it increases level (to prevent infinite loop from layer 2 tug-of-war)
        // Exception: layer 3 can decrease level to place parent above children
        if (level[p.id] === undefined || newLevel > level[p.id] || parentIds.length === 0) {
          level[p.id] = newLevel
          changed = true
        }
      }
    })
  }

  // Fallback: anything still unset → 0
  persons.forEach(p => { if (level[p.id] === undefined) level[p.id] = 0 })

  // Normalize: if any level is negative (from layer 3), shift all up
  const minLevel = Math.min(...Object.values(level))
  if (minLevel < 0) {
    Object.keys(level).forEach(id => { level[id] -= minLevel })
  }

  return level
}

/**
 * Detect anggota pohon yang DATA-nya kurang lengkap untuk warning UI.
 * Returns: array of { id, name, issue }
 */
export function detectIncompleteData(persons) {
  if (!persons || persons.length === 0) return []

  const ids = new Set(persons.map(p => p.id))
  const level = calculateGenerationLevels(persons)

  // Build children map for partner detection
  const childrenMap = {}
  persons.forEach(p => {
    [p.father_id, p.mother_id].filter(pid => pid && ids.has(pid)).forEach(pid => {
      if (!childrenMap[pid]) childrenMap[pid] = []
      childrenMap[pid].push(p.id)
    })
  })

  const partnerMap = {}
  persons.forEach(p => {
    if (p.father_id && p.mother_id && ids.has(p.father_id) && ids.has(p.mother_id)) {
      const f = p.father_id, m = p.mother_id
      if (!partnerMap[f]) partnerMap[f] = new Set()
      if (!partnerMap[m]) partnerMap[m] = new Set()
      partnerMap[f].add(m)
      partnerMap[m].add(f)
    }
  })

  const issues = []

  persons.forEach(p => {
    const hasParent = (p.father_id && ids.has(p.father_id)) || (p.mother_id && ids.has(p.mother_id))
    const hasPartner = partnerMap[p.id] && partnerMap[p.id].size > 0
    const hasChildren = childrenMap[p.id] && childrenMap[p.id].length > 0

    // Case: Placed at Gen 0 (oldest) BUT has partner or children
    // → Might be ancestor, but also might be pasangan that's not detected
    // Only flag if birth_year suggests they're NOT oldest
    if (!hasParent && !hasPartner && !hasChildren && level[p.id] === 0) {
      // Isolated person
      issues.push({
        id: p.id,
        name: p.name,
        issue: 'Anggota ini belum terhubung ke siapapun (tidak ada parent, pasangan, atau anak).',
        severity: 'warning',
      })
    }

    // Case: Seseorang tanpa parent yang birth_year-nya relatively muda (bukan leluhur)
    if (!hasParent && p.birth_year && p.birth_year > 1950 && level[p.id] === 0) {
      if (!hasPartner && !hasChildren) {
        // Already flagged above
      } else {
        issues.push({
          id: p.id,
          name: p.name,
          issue: `Lahir ${p.birth_year} tapi tercatat sebagai Generasi I (leluhur). Mungkin parent-nya belum di-set?`,
          severity: 'info',
        })
      }
    }
  })

  return issues
}
