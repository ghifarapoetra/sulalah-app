import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'

const PAKASIR_SLUG = process.env.PAKASIR_PROJECT_SLUG || 'sulalah-pohon-nasab'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://sulalah.my.id'
const PREMIUM_PRICE = 29000

export async function POST(req) {
  try {
    // Pakai server client agar bisa baca cookies session
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          get(name) { return cookieStore.get(name)?.value },
        },
      }
    )

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const userId = user.id
    const email = user.email

    // Buat order_id unik
    const timestamp = Date.now()
    const orderId = `SULALAH-${userId}-${timestamp}`

    // Simpan pending order (pakai service role agar bypass RLS)
    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )
    await adminClient.from('payment_orders').insert({
      order_id: orderId,
      user_id: userId,
      email,
      amount: PREMIUM_PRICE,
      status: 'pending',
      gateway: 'pakasir',
    }).throwOnError().catch(() => {
      // Tabel belum ada (migration pending) — tidak block flow
    })

    // Buat payment URL
    const redirectUrl = `${APP_URL}/payment-success?order_id=${encodeURIComponent(orderId)}`
    const paymentUrl = `https://app.pakasir.com/pay/${PAKASIR_SLUG}/${PREMIUM_PRICE}?order_id=${encodeURIComponent(orderId)}&redirect=${encodeURIComponent(redirectUrl)}`

    return NextResponse.json({ paymentUrl, orderId })
  } catch (err) {
    console.error('pakasir-create error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
