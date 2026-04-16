# 🌳 Sulalah v6 — Panduan Deploy Lengkap

## Urutan deploy (WAJIB berurutan)

### 1. Supabase — Jalankan semua migration
Buka SQL Editor, jalankan satu per satu:
- `migration-v3.sql` (multi pohon)
- `migration-v4.sql` (kolaborasi)
- `migration-v5.sql` (milad & wafat)
- `migration-v6.sql` (payment & premium)

### 2. Supabase — Buat storage bucket foto
Jalankan di SQL Editor:
```sql
insert into storage.buckets (id, name, public) values ('photos', 'photos', true);
create policy "Public photos" on storage.objects for select using (bucket_id = 'photos');
create policy "Users can upload photos" on storage.objects for insert with check (bucket_id = 'photos' and auth.role() = 'authenticated');
```

### 3. Supabase — Setup URL Auth
Authentication → URL Configuration:
- Site URL: `https://sulalah-app.vercel.app`
- Redirect URLs: `https://sulalah-app.vercel.app/**`

### 4. Midtrans — Daftar & ambil keys
1. Daftar di dashboard.midtrans.com
2. Settings → Access Keys → salin Client Key & Server Key (Sandbox dulu)
3. Settings → Payment → aktifkan QRIS, Transfer Bank, GoPay, OVO, Dana

### 5. Midtrans — Setup Webhook
Settings → Configuration → Notification URL:
```
https://sulalah-app.vercel.app/api/webhook
```

### 6. Vercel — Tambah semua Environment Variables
Di Vercel → Settings → Environment Variables, tambahkan:

| Name | Value |
|------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | https://XXXX.supabase.co |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | sb_publishable_XXXX |
| `SUPABASE_SERVICE_ROLE_KEY` | sb_secret_XXXX |
| `NEXT_PUBLIC_MIDTRANS_CLIENT_KEY` | SB-Mid-client-XXXX |
| `MIDTRANS_SERVER_KEY` | SB-Mid-server-XXXX |
| `NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION` | false |
| `MIDTRANS_IS_PRODUCTION` | false |
| `NEXT_PUBLIC_APP_URL` | https://sulalah-app.vercel.app |
| `NEXT_PUBLIC_UMROH_LINK` | https://wa.me/NOMORWA?text=... |

### 7. Upload ke GitHub → Vercel auto deploy

### 8. Test payment (WAJIB sebelum production)
- Daftar akun baru → coba upgrade
- Gunakan kartu test Midtrans Sandbox
- Cek apakah status premium aktif otomatis

### 9. Kalau siap production
Ganti di Vercel:
- `NEXT_PUBLIC_MIDTRANS_CLIENT_KEY` → Production key
- `MIDTRANS_SERVER_KEY` → Production key
- `NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION` → true
- `MIDTRANS_IS_PRODUCTION` → true
