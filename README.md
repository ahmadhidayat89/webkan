# KAN Remake — Website Komite Akreditasi Nasional

Proyek remake website **Komite Akreditasi Nasional (KAN)** menggunakan stack modern: **Laravel 10** sebagai backend API dan **React + Vite** sebagai frontend.

---

## Tech Stack

| Layer    | Teknologi                                     |
| -------- | --------------------------------------------- |
| Backend  | PHP 8.1+, Laravel 10, Laravel Sanctum         |
| Frontend | React 18, Vite, Tailwind CSS, React Router v6 |
| Database | PostgreeSQL                                   |
| Auth     | JWT via Laravel Sanctum                       |
| i18n     | i18next (Bahasa Indonesia & English)          |

---

## Fitur Utama

### Publik

- **Beranda** — Hero slider, quick links, berita terbaru, mitra internasional
- **Tentang KAN** — Visi, misi, sejarah
- **Direktori LPK** — Tabel semua lembaga penilaian kesesuaian (terakreditasi, dibekukan, dicabut) dengan pencarian dan filter
- **Berita & Pengumuman** — Daftar berita dengan detail
- **Halaman Dinamis** — Konten halaman dikelola dari admin (misal: Layanan, Kontak, dll)
- **Bilingual** — Semua konten mendukung Bahasa Indonesia dan English

### Admin Panel

- **Dashboard** — Ringkasan statistik
- **Manajemen Berita** — CRUD berita
- **Manajemen Slider** — Upload & kelola hero slider
- **Direktori LPK** — CRUD data lembaga penilaian kesesuaian
- **Halaman & Konten** — Kelola konten halaman dinamis
- **Mitra** — Kelola logo partner/mitra internasional
- **Pengaturan Website** — Logo, nama, kontak, media sosial, SEO

---

## Struktur Folder

```
kan-remake/
├── backend/        # Laravel 10 API
│   ├── app/
│   │   ├── Http/Controllers/Api/
│   │   └── Models/
│   ├── database/
│   │   ├── migrations/
│   │   └── seeders/
│   └── routes/api.php
└── frontend/       # React + Vite
    ├── src/
    │   ├── components/   # Header, Footer, AdminLayout, dll
    │   ├── pages/        # Halaman publik & admin
    │   └── locales/      # File terjemahan i18n
    └── public/
```

---

## Cara Menjalankan

### Prasyarat

- PHP 8.1+
- Composer
- Node.js 18+
- PostgreeSQL

### Backend (Laravel)

```bash
cd backend
cp .env.example .env
composer install
php artisan key:generate
```

Atur koneksi database di `.env`:

```env
DB_DATABASE=kan_remake
DB_USERNAME=root
DB_PASSWORD=
```

```bash
php artisan migrate --seed
php artisan storage:link
php artisan serve
```

Backend berjalan di `http://localhost:8000`

### Frontend (React)

```bash
cd frontend
npm install
npm run dev
```

Frontend berjalan di `http://localhost:5173`

---

## API Endpoints (Publik)

| Method | Endpoint                     | Keterangan             |
| ------ | ---------------------------- | ---------------------- |
| GET    | `/api/v1/settings`           | Pengaturan website     |
| GET    | `/api/v1/home`               | Data beranda           |
| GET    | `/api/v1/news`               | Daftar berita          |
| GET    | `/api/v1/news/{slug}`        | Detail berita          |
| GET    | `/api/v1/directory/{status}` | Direktori LPK          |
| GET    | `/api/v1/pages/{slug}`       | Konten halaman dinamis |

---

## Push ke GitHub (Hanya backend & frontend)

Untuk hanya menyertakan folder `backend/` dan `frontend/` saat commit:

```bash
git add backend/ frontend/
git commit -m "pesan commit"
git push
```

---

## Lisensi

Proyek ini dikembangkan untuk keperluan internal BSN / KAN.
