import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import crypto from 'crypto'

const MIDTRANS_SERVER_KEY = process.env.MIDTRANS_SERVER_KEY

export async function POST(req) {
  try {
    const body = await req.json()
    const { order_id, status_code, gross_amount, signature_key, transaction_status, payment_type, fraud_status } = body

    // Verifikasi signature dari Midtrans (keamanan)
    const expectedSignature = crypto
      .createHash('sha512')
      .update(`${order_id}${status_code}${gross_amount}${MIDTRANS_SERVER_KEY}`)
      .digest('hex')

    if (signature_key !== expectedSignature) {
      console.error('Invalid Midtrans signature')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 403 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    // Cek status pembayaran
    const isPaid =
      (transaction_status === 'capture' && fraud_status === 'accept') ||
      transaction_status === 'settlement'

    const isFailed = ['cancel', 'deny', 'expire'].includes(transaction_status)
    const isPending = transaction_status === 'pending'

    // Update status payment di database
    const newStatus = isPaid ? 'paid' : isFailed ? 'failed' : isPending ? 'pending' : 'pending'

    await supabase.from('payments').update({
      status: newStatus,
      payment_type,
      paid_at: isPaid ? new Date().toISOString() : null,
    }).eq('order_id', order_id)

    // Kalau berhasil bayar → aktifkan premium
    if (isPaid) {
      // Ambil user_id dari payments
      const { data: payment } = await supabase
        .from('payments')
        .select('user_id')
        .eq('order_id', order_id)
        .single()

      if (payment?.user_id) {
        await supabase.from('profiles').update({
          is_premium: true,
          premium_since: new Date().toISOString(),
          premium_order_id: order_id,
        }).eq('id', payment.user_id)

        console.log(`✅ Premium activated for user ${payment.user_id}, order ${order_id}`)
      }
    }

    return NextResponse.json({ status: 'ok' })

  } catch (err) {
    console.error('Webhook error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
