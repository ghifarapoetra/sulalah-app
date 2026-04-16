import { createClient } from './supabase'

// Batasan paket
export const LIMITS = {
  free: {
    maxTrees: 1,
    pdfThemes: ['clean', 'islamic'],
    canInvite: false,
    canMiladNotif: false,
  },
  premium: {
    maxTrees: 5,
    pdfThemes: ['clean', 'woody', 'elegant', 'islamic', 'gradient'],
    canInvite: true,
    canMiladNotif: true,
  }
}

export function getPlanLimits(isPremium) {
  return isPremium ? LIMITS.premium : LIMITS.free
}

export async function getUserPremiumStatus(userId) {
  const supabase = createClient()
  const { data } = await supabase
    .from('profiles')
    .select('is_premium, premium_since')
    .eq('id', userId)
    .single()
  return data?.is_premium || false
}
