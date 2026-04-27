# 🌳 Sulalah — Deploy v13 (Pakasir Payment)

## Perubahan di v13

Ganti sistem payment dari Trakteer (manual) ke **Pakasir** (auto-upgrade via webhook).

### Flow Baru
```
User klik "Upgrade" 
  → /api/pakasir-create → buat order_id unik
  → Redirect ke halaman bayar Pakasir (QRIS/VA/e-wallet)
  → User bayar
  → Pakasir kirim webhook ke /api/pakasir-webhook
  → Webhook auto-upgrade profiles.is_premium = true
  → User redirect ke /payment-success
  → Polling cek status premium (max 60 detik)
  → Tampil "Upgrade Berhasil" 🌟
```

## 🚨 WAJIB: 2 Steps Sebelum Deploy

### Step 1 — Supabase Migration

Buka Supabase → SQL Editor → paste & run `migration-v13.sql`

Isi migration:
- Buat tabel `payment_orders` (audit trail semua transaksi)
- Tambah kolom `premium_source` dan `premium_since` di `profiles`
- RLS policies untuk payment_orders

### Step 2 — Vercel Environment Variables

Buka Vercel → Settings → Environment Variables → tambah 2 variabel:

```
PAKASIR_PROJECT_SLUG = sulalah-pohon-nasab
PAKASIR_API_KEY      = [API Key dari dashboard Pakasir — tombol Copy]
```

Pastikan set untuk **Production** (dan Preview kalau mau test).

## Deploy

Push ZIP ke GitHub → Vercel auto deploy.

## Testing (Sandbox Mode)

Pakasir kamu masih di mode Sandbox. Urutan test:

### 1. Buka halaman upgrade
- Login ke Sulalah → `/upgrade`
- Klik **"Upgrade Sekarang — Rp 29.000"**
- Harus redirect ke halaman Pakasir

### 2. Simulasi pembayaran (dari dashboard Pakasir)
- Buka dashboard Pakasir → Transaksi
- Cari transaksi yang baru dibuat
- Klik **"Simulasi Pembayaran"**

### 3. Cek webhook diterima
- Buka Pakasir → Webhook Log
- Harus ada entry baru dengan status 200

### 4. Cek akun ter-upgrade
- Kembali ke Sulalah `/payment-success`
- Atau cek `/dashboard` → harus sudah Premium

### 5. Tes via curl (opsional)
```bash
curl -X POST https://app.pakasir.com/api/paymentsimulation \
  -H "Content-Type: application/json" \
  -d '{
    "project": "sulalah-pohon-nasab",
    "order_id": "SULALAH-{userId}-{timestamp}",
    "amount": 29000,
    "api_key": "YOUR_API_KEY"
  }'
```

## Setelah Lulus Testing

1. Buka dashboard Pakasir → proyek → **Edit Proyek**
2. Ubah Mode dari **Sandbox** ke **Production**
3. Lengkapi KYC Pakasir (kalau belum) untuk bisa withdraw

## File yang Berubah

```
migration-v13.sql                    → BARU (wajib run)
app/
  upgrade/page.js                    → Ganti Trakteer → Pakasir button
  payment-success/page.js            → Polling upgrade status
  api/
    pakasir-create/route.js          → BARU: buat transaksi
    pakasir-webhook/route.js         → BARU: terima notifikasi auto-upgrade
```

## Catatan Penting

**idempotency:** Webhook bisa dikirim lebih dari sekali oleh Pakasir.
Kode sudah handle ini — cek `payment_orders.status` sebelum upgrade.

**order_id format:** `SULALAH-{uuid}-{timestamp}`
Webhook mengekstrak userId dari order_id untuk upgrade profil yang tepat.

**Fee:** Pakasir memotong fee dari setiap transaksi (lihat dashboard).
Untuk QRIS biasanya ~0.7%.

**Trakteer:** Webhook Trakteer (`/api/trakteer-webhook`) masih ada dan tetap berfungsi
untuk supporter lama yang mungkin masih transaksikan via Trakteer.
