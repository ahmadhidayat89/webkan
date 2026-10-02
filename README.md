# KAN Remake Workspace

Workspace ini berisi 3 aplikasi:
- `apps/backend` (Laravel API utama)
- `apps/frontend` (React + Vite utama)
- `apps/e-training` (Laravel + Inertia untuk E-Training)

## Struktur Folder

```text
remake-kan/
├── apps/
│   ├── backend/
│   ├── frontend/
│   └── e-training/
├── package.json
└── README.md
```

## Jalankan Semua Dengan Satu Command

### 1. Install dependency root (sekali saja)

```bash
npm install
```

### 2. Jalankan semua service sekaligus

```bash
npm run dev:all
```

Service yang akan jalan:
- Backend API: `http://127.0.0.1:8000`
- Frontend: `http://localhost:5173`
- E-Training: `http://127.0.0.1:8002/login`
- Vite E-Training (asset dev server): `http://127.0.0.1:5174`

## Setup Per App (Sekali Saja)

### Backend

```bash
cd apps/backend
cp .env.example .env
composer install
php artisan key:generate
php artisan migrate --seed
php artisan storage:link
```

### Frontend

```bash
cd apps/frontend
npm install
```

Tambahkan env berikut di `apps/frontend/.env`:

```env
VITE_API_URL=http://127.0.0.1:8000/api/v1
VITE_E_TRAINING_URL=http://127.0.0.1:8002/login
```

### E-Training

```bash
cd apps/e-training
cp .env.example .env
composer install
npm install
php artisan key:generate
php artisan migrate --seed
```
