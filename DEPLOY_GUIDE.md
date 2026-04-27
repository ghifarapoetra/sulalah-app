# 🌳 Sulalah v13 — Panduan Deploy Pakasir

## Checklist Sebelum Deploy

### 1. Supabase — Tambah kolom & tabel baru

Buka **Supabase → SQL Editor**, paste dan jalankan isi file `migration-v13.sql`.

Yang dibuat oleh migration ini:
- Tabel `payment_orders` untuk mencatat semua transaksi
- Kolom `premium_source` dan `premium_since` di tabel `profiles`

### 2. Vercel — Tambah 3 Environment Variables

Buka **Vercel → Project → Settings → Environment Variables**, tambahkan:

**PAKASIR_PROJECT_SLUG**
```
sulalah-pohon-nasab
```

**PAKASIR_API_KEY**
```
(copy dari dashboard Pakasir → detail proyek → bagian Integrasi → tombol Copy di sebelah API Key)
```

**SUPABASE_SERVICE_ROLE_KEY**
```
(copy dari Supabase → Project Settings → API → Project API keys → service_role → Reveal → Copy)
```

Pastikan ketiga variabel di-set untuk environment **Production**.

### 3. Push ke GitHub → Vercel auto deploy

---

## Cara Test (Sandbox Mode)

Pakasir kamu masih Sandbox — aman untuk test tanpa uang sungguhan.

**Step 1 — Coba alur upgrade**

Login ke Sulalah dengan akun yang belum Premium, buka `/upgrade`, klik tombol Upgrade. Browser harus pindah ke halaman pembayaran Pakasir.

**Step 2 — Simulasi pembayaran**

Jangan bayar sungguhan. Kembali ke dashboard Pakasir → menu Transaksi → cari transaksi yang baru muncul → klik **Simulasi Pembayaran**.

**Step 3 — Verifikasi webhook**

Buka Pakasir → **Webhook Log**. Harus ada entry baru dengan response **200**. Kalau masih bukan 200, cek Vercel → Functions → Logs untuk lihat error detail.

**Step 4 — Verifikasi akun ter-upgrade**

Buka Sulalah, refresh halaman `/dashboard`. Status akun harus sudah berubah jadi **Premium**.

---

## Setelah Testing Berhasil

Buka dashboard Pakasir → detail proyek → **Edit Proyek** → ubah Mode dari **Sandbox** ke **Production**.

Lengkapi juga KYC di Pakasir (menu KYC) agar bisa melakukan penarikan dana.

---

## Troubleshooting

**Tombol upgrade muncul "Unauthorized"**
Pastikan `SUPABASE_SERVICE_ROLE_KEY` sudah di-set di Vercel dan sudah redeploy setelah menambahkannya.

**Webhook Log di Pakasir tidak muncul 200**
Cek Vercel → Functions → Logs → cari `/api/pakasir-webhook`. Baca pesan error-nya. Paling sering karena `SUPABASE_SERVICE_ROLE_KEY` belum di-set.

**Akun tidak ter-upgrade meski webhook 200**
Cek apakah migration v13 sudah dijalankan di Supabase. Kalau tabel `payment_orders` belum ada, upgrade tetap jalan tapi ada warning di log.

**Build error di Vercel**
Pastikan tidak ada folder `sulalah-v6/` di dalam repo. Struktur yang benar: `app/`, `components/`, `lib/` langsung di root repo, bukan di dalam subfolder.

---

## Catatan

Webhook Trakteer lama (`/api/trakteer-webhook`) tetap aktif dan tidak terganggu. User yang sudah Premium via Trakteer tidak perlu melakukan apapun.

