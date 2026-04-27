import { NextResponse } from 'next/server'
import { createClient } from '../../../lib/supabase'

const PAKASIR_SLUG = process.env.PAKASIR_PROJECT_SLUG || 'sulalah-pohon-nasab'
const PAKASIR_API_KEY = process.env.PAKASIR_API_KEY
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://sulalah.my.id'
const PREMIUM_PRICE = 29000

export async function POST(req) {
  try {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const userId = session.user.id
    const email = session.user.email

    // Buat order_id unik yang encode userId untuk dipakai di webhook
    const timestamp = Date.now()
    const orderId = `SULALAH-${userId}-${timestamp}`

    // Simpan pending order ke DB agar bisa diverifikasi saat webhook
    await supabase.from('payment_orders').insert({
      order_id: orderId,
      user_id: userId,
      email,
      amount: PREMIUM_PRICE,
      status: 'pending',
      gateway: 'pakasir',
    })

    // Buat payment URL Pakasir (redirect mode — tidak perlu API call)
    // Format: https://app.pakasir.com/pay/{slug}/{amount}?order_id=xxx&redirect=xxx
    const redirectUrl = `${APP_URL}/payment-success?order_id=${encodeURIComponent(orderId)}`
    const paymentUrl = `https://app.pakasir.com/pay/${PAKASIR_SLUG}/${PREMIUM_PRICE}?order_id=${encodeURIComponent(orderId)}&redirect=${encodeURIComponent(redirectUrl)}`

    return NextResponse.json({ paymentUrl, orderId })
  } catch (err) {
    console.error('pakasir-create error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
