import { calculateGenerationLevels } from './generationLevel'

export function calculateFamilyStats(persons) {
  if (!persons || persons.length === 0) {
    return {
      total: 0, generations: 0, oldest: null, youngest: null,
      yearRange: null, maleCount: 0, femaleCount: 0, 
      aliveCount: 0, deceasedCount: 0,
    }
  }

  const level = calculateGenerationLevels(persons)
  const maxGen = Math.max(1, ...Object.values(level)) + 1

  const withYear = persons.filter(p => p.birth_year)
  const sorted = [...withYear].sort((a, b) => a.birth_year - b.birth_year)
  const oldest = sorted[0] || null
  const youngest = sorted[sorted.length - 1] || null
  const yearRange = withYear.length > 0 ? `${oldest.birth_year} – ${youngest.birth_year}` : null

  return {
    total: persons.length,
    generations: maxGen,
    oldest, youngest, yearRange,
    maleCount: persons.filter(p => p.gender === 'male').length,
    femaleCount: persons.filter(p => p.gender === 'female').length,
    deceasedCount: persons.filter(p => p.death_year).length,
    aliveCount: persons.length - persons.filter(p => p.death_year).length,
  }
}
