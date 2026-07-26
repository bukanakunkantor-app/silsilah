# 🌳 Silsilah Keluarga — Family Tree App

Aplikasi pohon silsilah keluarga interaktif yang dibangun dengan Next.js, Supabase, dan React Flow.

## ✨ Fitur

- **Pohon keluarga interaktif** — top-down, dari kakek buyut ke cicit
- **Zoom & Pan** — navigasi bebas lewat touch/mouse
- **Collapse/Expand** — lipat cabang yang tidak diperlukan
- **Mini-map** — orientasi saat tree besar (pojok kanan bawah)
- **Search** — cari nama → auto-scroll & highlight ke node
- **Detail panel** — klik node → lihat biodata lengkap (bottom sheet di mobile)
- **Admin panel terpisah** — login khusus untuk tambah/edit/hapus anggota
- **Upload foto** — ke Supabase Storage
- **Mobile-friendly** — dioptimalkan untuk smartphone (public view)
- **Design hijau & bersih** — mengacu referensi Dribbble

## 🚀 Setup

### 1. Clone & Install

```bash
cd Familytree
npm install
```

### 2. Setup Supabase

1. Buat project baru di [supabase.com](https://supabase.com)
2. Buka **SQL Editor** → paste isi `supabase/schema.sql` → Run
3. Buka **Storage** → buat bucket `family-photos` dengan public access
4. Buka **Authentication** → buat user admin via **Users** tab

### 3. Konfigurasi Environment

Edit file `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
```

> Salin dari Supabase dashboard → **Settings → API**

### 4. Jalankan Lokal

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000)

### 5. Deploy ke Vercel

```bash
npx vercel
```

Atau hubungkan repo ke Vercel dashboard → tambah env variables → deploy.

## 🗂️ Struktur Halaman

| URL | Keterangan |
|---|---|
| `/` | Pohon keluarga (public, mobile-friendly) |
| `/admin/login` | Login admin |
| `/admin` | Dashboard admin (stats + daftar anggota) |
| `/admin/members/add` | Form tambah anggota |
| `/admin/members/[id]/edit` | Form edit anggota |

## 📐 Database

Dua tabel utama:

- **`persons`** — data setiap anggota keluarga
- **`marriages`** — relasi pasangan (mendukung poligami)

Row Level Security: semua orang bisa **read**, hanya admin (authenticated) yang bisa **write**.

## 🎨 Tech Stack

- **Next.js 14** (App Router)
- **Supabase** (PostgreSQL + Auth + Storage)
- **React Flow** (visualisasi pohon)
- **CSS Modules** (Vanilla CSS)
- **Inter** (Google Fonts)

## 📱 Tips Penggunaan

**Untuk user (smartphone):**
- Pinch to zoom / two-finger pan
- Ketuk nama untuk lihat detail
- Gunakan search bar untuk cari nama
- Ketuk tombol `−` di bawah node untuk collapse cabang

**Untuk admin (desktop):**
- Akses `/admin/login` dengan email & password dari Supabase
- Tambah anggota: isi nama, pilih parent (ayah/ibu), pilih pasangan jika ada
- Set generasi: kakek buyut = 1, buyut = 2, kakek = 3, dst.
