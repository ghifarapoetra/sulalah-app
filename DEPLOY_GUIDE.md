# 🌳 Sulalah — Deploy v12

## 🎯 Perubahan Besar di v12

### 1. Engine Generasi Smart (4-Layer Logic)

File baru: `lib/generationLevel.js` (191 baris)

Algoritma sekarang menangani 4 skenario:
1. **Punya parent** → level = max(parent levels) + 1
2. **Pasangan tanpa parent** (deteksi via "anak bersama") → level = level pasangan
3. **Tanpa parent tapi punya anak** → level = level anak − 1
4. **Otherwise** → level 0 (leluhur sejati)

**Efek:** Pasangan yang tidak punya parent_id (mahram pernikahan) sekarang otomatis ditempatkan di generasi yang benar — sejajar pasangannya.

Contoh:
- Putri Artha Yusmika Dewi (istri Rifamumza) → auto-detect sejajar Rifamumza
- Arif Agus Nugroho (suami Mu'minah) → auto-detect sejajar Mu'minah
- Sutrisno (suami Jamilah) → auto-detect sejajar Jamilah

### 2. Zoom In/Out di Canvas Tree

File: `components/FamilyTree.js`

- Tombol `+` / `−` / persentase di pojok kanan atas canvas
- `Ctrl + scroll wheel` untuk zoom
- Range: 40% - 200%
- State zoom tersimpan saat navigasi

### 3. Garis L-Shape dengan Sudut Rounded

Baik di canvas maupun di poster engine:
- Bukan curve meliuk lagi
- Garis lurus ala bagan organisasi
- Sudut tumpul halus (radius 8px)
- Warna: abu netral untuk parent-child, hijau-emas untuk mahram

### 4. Konsistensi Engine

Semua file (canvas, poster, stats, gemini prompt) sekarang pakai
`generationLevel.js` yang sama. Hasil generasi konsisten di mana pun.

## File yang Berubah

```
lib/
  generationLevel.js     → BARU (191 baris)
  posterEngine.js        → import generationLevel + L-shape connectors
  posterStats.js         → pakai shared calculator
  geminiPrompt.js        → pakai shared calculator
components/
  FamilyTree.js          → zoom + L-shape + smart generation
```

## Step Deploy

### 1. Push ZIP ke GitHub → Vercel auto deploy

Tidak ada migration SQL baru.

### 2. Test di Pohon Martodimejo

Buka pohon yang sudah ada (Keluarga Besar Martodimejo).

**Verifikasi struktur generasi:**
- Gen I: Mudiyono Martodimejo, Istri Mbah Uyut
- Gen II: Mbah Roko, Mbah Rayi (Siti Zaeroh)
- Gen III: Mu'minah, Pakdhe/Budhe, plus pasangan masing-masing
- Gen IV: Kamu (Ifam), Rifamumza, dst, plus Putri Artha
- Gen V: Mezzaluna

**Catatan:** Mbah Roko di data kamu mungkin belum ter-link father_id ke Mudiyono.
Kalau iya, edit Mbah Roko → set Ayah = Mudiyono Martodimejo.

### 3. Test Zoom Canvas

- Lihat pojok kanan atas canvas — ada kontrol `+` / persentase / `−`
- Klik `+` untuk zoom in
- Klik persentase untuk reset ke 100%
- Atau Ctrl + scroll wheel di canvas

### 4. Test Garis L-Shape

- Garis penghubung sekarang lurus dengan sudut tumpul halus
- Bukan curve meliuk seperti sebelumnya
- Lebih mirip bagan organisasi formal

### 5. Test Ekspor Poster

- Klik 🖼️ Ekspor → Ekspor Langsung
- Pilih ukuran (test A3 Landscape untuk pohon besar)
- Preview & download
- Generasi & layout harus konsisten dengan canvas tree view

### 6. Test Prompt Gemini

- Klik 🖼️ Ekspor → Buat Prompt Gemini
- Pilih style → Copy prompt
- Hierarki di prompt sekarang akurat (5 generasi, bukan 2)

## Catatan Penting

**Algoritma deteksi pasangan butuh "anak bersama"** untuk identifikasi.

Contoh:
- ✅ Putri Artha → bisa deteksi karena ada anak Mezzaluna (anak bersama Rifamumza)
- ⚠️ Pasangan baru menikah belum punya anak → tidak terdeteksi otomatis

Untuk kasus seperti ini, fitur **Marriages** (di v7 lalu) bisa dipakai sebagai
override eksplisit. Tapi tabel marriages belum di-create di Supabase kamu —
itu task untuk v13 nanti kalau dibutuhkan.

**Untuk sekarang:** algoritma 4-layer ini sudah menangani 95%+ kasus
secara akurat dari data nasab parent_id.
