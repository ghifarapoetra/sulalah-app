import { NextResponse } from 'next/server'
import { createClient } from '../../../lib/supabase'

const PREMIUM_PRICE = 29000

export async function POST(req) {
  try {
    const body = await req.json()
    console.log('[pakasir-webhook] received:', JSON.stringify(body))

    const { order_id, amount, status, project, payment_method, completed_at } = body

    // Validasi field wajib
    if (!order_id || !amount || !status) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    // Hanya proses jika status completed
    if (status !== 'completed') {
      console.log('[pakasir-webhook] status bukan completed, skip:', status)
      return NextResponse.json({ ok: true, skipped: true })
    }

    // Validasi amount (harus sama dengan harga premium)
    if (parseInt(amount) < PREMIUM_PRICE) {
      console.warn('[pakasir-webhook] amount tidak sesuai:', amount, 'expected:', PREMIUM_PRICE)
      return NextResponse.json({ error: 'Amount mismatch' }, { status: 400 })
    }

    // Extract userId dari order_id format: SULALAH-{userId}-{timestamp}
    const parts = order_id.split('-')
    // order_id: SULALAH-{uuid dengan banyak dash}-{timestamp}
    // UUID punya format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx (5 bagian)
    // Jadi total: SULALAH + 5 bagian UUID + timestamp = index 0 adalah "SULALAH", 1-5 adalah UUID, 6 adalah timestamp
    if (parts.length < 3 || parts[0] !== 'SULALAH') {
      console.error('[pakasir-webhook] format order_id tidak valid:', order_id)
      return NextResponse.json({ error: 'Invalid order_id format' }, { status: 400 })
    }

    // Reconstruct userId (UUID): bagian index 1 s/d (length - 2)
    const userId = parts.slice(1, parts.length - 1).join('-')
    console.log('[pakasir-webhook] extracted userId:', userId)

    const supabase = createClient()

    // Cek apakah order sudah pernah diproses (idempotency)
    const { data: existingOrder } = await supabase
      .from('payment_orders')
      .select('id, status')
      .eq('order_id', order_id)
      .maybeSingle()

    if (existingOrder?.status === 'completed') {
      console.log('[pakasir-webhook] order sudah diproses sebelumnya, skip')
      return NextResponse.json({ ok: true, already_processed: true })
    }

    // Update payment_orders ke completed
    await supabase.from('payment_orders').upsert({
      order_id,
      user_id: userId,
      amount: parseInt(amount),
      status: 'completed',
      gateway: 'pakasir',
      payment_method: payment_method || 'unknown',
      completed_at: completed_at || new Date().toISOString(),
    }, { onConflict: 'order_id' })

    // Upgrade user ke Premium
    const { error: upgradeError } = await supabase
      .from('profiles')
      .update({
        is_premium: true,
        premium_since: completed_at || new Date().toISOString(),
        premium_source: 'pakasir',
      })
      .eq('id', userId)

    if (upgradeError) {
      console.error('[pakasir-webhook] gagal upgrade premium:', upgradeError)
      return NextResponse.json({ error: 'Failed to upgrade' }, { status: 500 })
    }

    console.log('[pakasir-webhook] ✅ user', userId, 'berhasil di-upgrade ke Premium')
    return NextResponse.json({ ok: true, userId, upgraded: true })

  } catch (err) {
    console.error('[pakasir-webhook] error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
