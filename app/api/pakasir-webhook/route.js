import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const PREMIUM_PRICE = 29000

// Pakai service role key — bypass RLS, khusus server-side webhook
function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )
}

export async function POST(req) {
  try {
    const body = await req.json()
    console.log('[pakasir-webhook] received:', JSON.stringify(body))

    const { order_id, amount, status, payment_method, completed_at } = body

    // Validasi field wajib
    if (!order_id || !amount || !status) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    // Hanya proses jika status completed
    if (status !== 'completed') {
      return NextResponse.json({ ok: true, skipped: true })
    }

    // Validasi amount
    if (parseInt(amount) < PREMIUM_PRICE) {
      console.warn('[pakasir-webhook] amount mismatch:', amount)
      return NextResponse.json({ error: 'Amount mismatch' }, { status: 400 })
    }

    // Extract userId dari order_id: SULALAH-{uuid}-{timestamp}
    // UUID format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx (5 segmen)
    // Split: ['SULALAH', seg1, seg2, seg3, seg4, seg5, timestamp]
    const parts = order_id.split('-')
    if (parts.length < 3 || parts[0] !== 'SULALAH') {
      console.error('[pakasir-webhook] invalid order_id:', order_id)
      return NextResponse.json({ error: 'Invalid order_id' }, { status: 400 })
    }
    // userId = index 1 sampai length-2 (buang 'SULALAH' depan & timestamp belakang)
    const userId = parts.slice(1, parts.length - 1).join('-')
    console.log('[pakasir-webhook] userId:', userId)

    const supabase = getAdminClient()

    // Idempotency: cek apakah sudah diproses
    try {
      const { data: existing } = await supabase
        .from('payment_orders')
        .select('id, status')
        .eq('order_id', order_id)
        .maybeSingle()

      if (existing?.status === 'completed') {
        console.log('[pakasir-webhook] already processed, skip')
        return NextResponse.json({ ok: true, already_processed: true })
      }

      // Simpan/update order
      await supabase.from('payment_orders').upsert({
        order_id,
        user_id: userId,
        amount: parseInt(amount),
        status: 'completed',
        gateway: 'pakasir',
        payment_method: payment_method || 'unknown',
        completed_at: completed_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'order_id' })
    } catch (tableErr) {
      // Tabel payment_orders belum ada (migration belum dijalankan) — tidak block upgrade
      console.warn('[pakasir-webhook] payment_orders table error (migration pending?):', tableErr.message)
    }

    // Upgrade user ke Premium — ini yang paling penting
    const { error: upgradeError } = await supabase
      .from('profiles')
      .update({
        is_premium: true,
        premium_since: completed_at || new Date().toISOString(),
        premium_source: 'pakasir',
      })
      .eq('id', userId)

    if (upgradeError) {
      console.error('[pakasir-webhook] upgrade error:', upgradeError)
      return NextResponse.json({ error: 'Upgrade failed: ' + upgradeError.message }, { status: 500 })
    }

    console.log('[pakasir-webhook] ✅ upgraded userId:', userId)
    return NextResponse.json({ ok: true, upgraded: true })

  } catch (err) {
    console.error('[pakasir-webhook] unexpected error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
