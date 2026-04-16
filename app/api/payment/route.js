import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const MIDTRANS_SERVER_KEY = process.env.MIDTRANS_SERVER_KEY
const MIDTRANS_IS_PRODUCTION = process.env.MIDTRANS_IS_PRODUCTION === 'true'
const MIDTRANS_API_URL = MIDTRANS_IS_PRODUCTION
  ? 'https://app.midtrans.com/snap/v1/transactions'
  : 'https://app.sandbox.midtrans.com/snap/v1/transactions'

export async function POST(req) {
  try {
    const { userId, userEmail, userName } = await req.json()

    if (!userId || !userEmail) {
      return NextResponse.json({ error: 'Missing user info' }, { status: 400 })
    }

    // Buat order ID unik
    const orderId = `SULALAH-${userId.slice(0, 8).toUpperCase()}-${Date.now()}`
    const amount = 29000

    // Buat transaksi di Midtrans
    const midtransBody = {
      transaction_details: {
        order_id: orderId,
        gross_amount: amount,
      },
      customer_details: {
        first_name: userName || 'Pengguna',
        email: userEmail,
      },
      item_details: [{
        id: 'SULALAH-PREMIUM-LIFETIME',
        price: amount,
        quantity: 1,
        name: 'Sulalah Premium — Lifetime',
      }],
      callbacks: {
        finish: `${process.env.NEXT_PUBLIC_APP_URL}/payment-success`,
        error: `${process.env.NEXT_PUBLIC_APP_URL}/upgrade?error=1`,
        pending: `${process.env.NEXT_PUBLIC_APP_URL}/upgrade?pending=1`,
      }
    }

    const midtransRes = await fetch(MIDTRANS_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from(MIDTRANS_SERVER_KEY + ':').toString('base64')}`,
      },
      body: JSON.stringify(midtransBody),
    })

    const midtransData = await midtransRes.json()

    if (!midtransData.token) {
      console.error('Midtrans error:', JSON.stringify(midtransData))
      return NextResponse.json({ 
        error: 'Midtrans gagal membuat transaksi',
        detail: midtransData
      }, { status: 500 })
    }

    // Simpan ke database Supabase (gunakan service role)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    await supabase.from('payments').insert({
      user_id: userId,
      order_id: orderId,
      amount,
      status: 'pending',
      midtrans_token: midtransData.token,
      midtrans_redirect_url: midtransData.redirect_url,
    })

    return NextResponse.json({
      token: midtransData.token,
      redirect_url: midtransData.redirect_url,
      order_id: orderId,
    })

  } catch (err) {
    console.error('Payment error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
