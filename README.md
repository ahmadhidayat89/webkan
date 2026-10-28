# KAN Remake — Website Komite Akreditasi Nasional

Website Komite Akreditasi Nasional (KAN) yang dikembangkan untuk mendukung penyampaian informasi, pengelolaan konten website, dan penyajian informasi layanan akreditasi.

Repositori ini terdiri dari tiga aplikasi: **Backend**, **Frontend**, dan **E-Training**.

## Teknologi yang Digunakan

| Komponen | Teknologi |
|---|---|
| Backend KAN Remake | PHP 8.3+, Laravel 13, Laravel Sanctum |
| Frontend KAN Remake | React 18, Vite 5, React Router, Tailwind CSS |
| Database Backend | PostgreSQL |
| E-Training Backend | PHP 8.3+, Laravel 13, Laravel Sanctum |
| E-Training Frontend | React 18, Inertia.js, Vite 6 |
| Database E-Training | PostgreSQL |
| Manajemen Dependensi | Composer, npm |

Versi dependensi mengikuti konfigurasi pada masing-masing file `composer.json` dan `package.json`.

> **Catatan struktur:** Backend KAN Remake menggunakan `laravel/framework` versi 13, namun struktur direktori masih mengikuti skeleton Laravel versi sebelumnya (`app/Http/Kernel.php` dan `app/Providers/RouteServiceProvider.php` masih digunakan, bukan `bootstrap/app.php` gaya Laravel 11+). Aplikasi tetap berjalan normal; hal ini hanya perlu diketahui agar tidak membingungkan saat menyesuaikan konfigurasi middleware atau rate limiting.

## Struktur Direktori

```text
masha-1.2/
├── backend/          # Backend API KAN Remake
├── frontend/         # Frontend website KAN Remake
├── e-training/       # Aplikasi E-Training
└── README.md
```

## Fitur Utama

### Website Publik

- Beranda dengan slider, informasi utama, dan berita terbaru.
- Halaman Tentang KAN yang memuat informasi profil, visi, dan misi.
- Direktori Lembaga Penilaian Kesesuaian (LPK).
- Informasi berita dan pengumuman.
- Halaman dinamis untuk menyajikan informasi dan layanan.
- Dukungan bahasa Indonesia dan bahasa Inggris.

### Panel Administrasi

Fitur pengelolaan konten menyesuaikan hak akses masing-masing pengguna, meliputi:

- Pengelolaan berita dan pengumuman.
- Pengelolaan slider dan konten halaman.
- Pengelolaan direktori LPK.
- Pengelolaan kuisiner survey
- Pengelolaan halaman, menu, dan FAQ.
- Pengelolaan mitra dan informasi website.
- Pengelolaan proses serta informasi layanan akreditasi sesuai modul yang tersedia.
- Pengelolaan pengguna dan pengaturan berdasarkan hak akses.

### E-Training

E-Training merupakan aplikasi pelatihan yang dikelola secara terpisah dari website utama KAN Remake. Aplikasi ini menggunakan Laravel, Inertia.js, dan React. Fitur yang tersedia mengikuti implementasi pada kode sumber aplikasi.

## Persyaratan Sistem

Pastikan perangkat telah memiliki perangkat lunak berikut:

- PHP sesuai kebutuhan masing-masing aplikasi.
- Composer.
- Node.js dan npm.
- PostgreSQL untuk Backend KAN Remake dan E-Training.
- Ekstensi PHP yang diperlukan oleh Laravel dan dependensi aplikasi, termasuk PDO PostgreSQL (`pdo_pgsql`).

Untuk mengetahui persyaratan PHP setiap aplikasi, periksa file `composer.json` pada direktori masing-masing.

## Instalasi dan Konfigurasi

### 1. Clone Repository

```powershell
git clone <URL_REPOSITORY>
```

Ganti `<URL_REPOSITORY>` dengan URL repositori yang digunakan.

### 2. Menyiapkan Backend KAN Remake

Masuk ke direktori backend:

```powershell
cd backend
```

Instal dependensi PHP:

```powershell
composer install
```

Jika file `.env` belum tersedia, salin file konfigurasi contoh:

```powershell
Copy-Item .env.example .env
```

Buat application key:

```powershell
php artisan key:generate
```

Sesuaikan konfigurasi database PostgreSQL pada file `.env`:

```dotenv
APP_URL=http://localhost:8000

DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=webkan
DB_USERNAME=<USERNAME_DATABASE>
DB_PASSWORD=<PASSWORD_DATABASE>
```

Sesuaikan nama database, username, dan password dengan konfigurasi PostgreSQL lokal. Pastikan database sudah dibuat sebelum menjalankan migrasi.

Jalankan migrasi database:

```powershell
php artisan migrate
```

#### Database Seeder Backend

Seeder tersedia pada direktori `backend/database/seeders/`, meliputi:

- `DatabaseSeeder.php`
- `DocumentSeeder.php`
- `PageContentSeeder.php`
- `SurveySeeder.php`

Untuk menjalankan seeder utama:

```powershell
php artisan db:seed
```

Untuk menjalankan seeder tertentu:

```powershell
php artisan db:seed --class=DocumentSeeder
php artisan db:seed --class=PageContentSeeder
php artisan db:seed --class=SurveySeeder
```

Periksa `DatabaseSeeder.php` untuk mengetahui seeder yang dipanggil secara otomatis. Jalankan seeder tertentu hanya jika diperlukan dan sesuai dengan kebutuhan aplikasi.

Buat symbolic link storage jika diperlukan:

```powershell
php artisan storage:link
```

Jalankan backend:

```powershell
php artisan serve --host=127.0.0.1 --port=8000
```

Backend dapat diakses melalui `http://localhost:8000`.

### 3. Menyiapkan Frontend KAN Remake

Buka terminal baru dan masuk ke direktori frontend:

```powershell
cd D:\MAGANGHUB\PROJECT\masha-1.2\frontend
```

Instal dependensi:

```powershell
npm install
```

Pastikan file `.env` memiliki alamat API backend berikut:

```dotenv
VITE_API_URL=http://localhost:8000/api/v1
```

Jalankan frontend:

```powershell
npm run dev
```

Frontend dapat diakses melalui `http://localhost:5173`.

Pastikan backend telah berjalan agar frontend dapat berkomunikasi dengan API.

### 4. Menyiapkan E-Training

Buka terminal baru dan masuk ke direktori E-Training:

```powershell
cd D:\MAGANGHUB\PROJECT\masha-1.2\e-training
```

Instal dependensi PHP:

```powershell
composer install
```

Jika file `.env` belum tersedia, salin file konfigurasi contoh:

```powershell
Copy-Item .env.example .env
```

Buat application key:

```powershell
php artisan key:generate
```

Periksa konfigurasi `.env` agar sesuai dengan lingkungan lokal. E-Training menggunakan PostgreSQL sebagai database. Sesuaikan konfigurasi berikut dengan database yang digunakan:

```dotenv
APP_URL=http://127.0.0.1:8001

DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=<NAMA_DATABASE>
DB_USERNAME=<USERNAME_DATABASE>
DB_PASSWORD=<PASSWORD_DATABASE>
```

Sesuaikan nilai placeholder dengan konfigurasi PostgreSQL lokal. Jangan memasukkan password asli ke README.

Pastikan database PostgreSQL sudah dibuat, konfigurasi koneksi sudah sesuai, dan ekstensi PDO PostgreSQL (`pdo_pgsql`) aktif pada PHP.

Jalankan migrasi database setelah konfigurasi PostgreSQL selesai:

```powershell
php artisan migrate
```

#### Database Seeder E-Training

Seeder tersedia pada direktori `e-training/database/seeders/`, meliputi:

- `DatabaseSeeder.php`
- `CategorySeeder.php`
- `CourseEventSeeder.php`
- `CourseSeeder.php`

Untuk menjalankan seeder utama:

```powershell
php artisan db:seed
```

Untuk menjalankan seeder tertentu:

```powershell
php artisan db:seed --class=CategorySeeder
php artisan db:seed --class=CourseEventSeeder
php artisan db:seed --class=CourseSeeder
```

Periksa `DatabaseSeeder.php` untuk mengetahui seeder yang dipanggil secara otomatis. Perhatikan urutan seeder jika terdapat ketergantungan data antartabel.

Instal dependensi frontend:

```powershell
npm install
```

Jalankan server Laravel:

```powershell
php artisan serve --host=127.0.0.1 --port=8001
```

Pada terminal lain di direktori `e-training`, jalankan Vite:

```powershell
npm run dev -- --port 5174
```

E-Training dapat diakses melalui `http://127.0.0.1:8001`. Vite digunakan untuk menjalankan aset frontend selama pengembangan.

## Menjalankan Aplikasi

Setiap aplikasi dijalankan secara terpisah melalui terminal masing-masing.

| Aplikasi | Perintah utama | Alamat lokal |
|---|---|---|
| Backend KAN Remake | `php artisan serve --host=127.0.0.1 --port=8000` | `http://localhost:8000` |
| Frontend KAN Remake | `npm run dev` | `http://localhost:5173` |
| E-Training | `php artisan serve --host=127.0.0.1 --port=8001` | `http://127.0.0.1:8001` |

Untuk E-Training, jalankan Vite secara terpisah jika diperlukan selama pengembangan.

## Catatan

- Jangan membagikan file `.env` karena dapat berisi kredensial dan konfigurasi lokal.
- Periksa isi seeder sebelum menjalankannya karena seeder dapat menambahkan data atau menjalankan proses lain terhadap database.
- Jangan menjalankan migrasi atau seeder terhadap database berisi data penting tanpa memahami dampaknya.
- Akun admin atau akun pengujian hanya tersedia jika memang dibuat atau disediakan oleh implementasi proyek.
- Pastikan konfigurasi `.env` pada Backend KAN Remake dan E-Training sesuai dengan database PostgreSQL yang digunakan serta file `.env.example` masing-masing aplikasi.
- Langkah instalasi perlu disesuaikan apabila konfigurasi lokal berbeda dari contoh di atas.
