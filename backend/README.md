# Smart CRM – PT. Smart ISP

Aplikasi CRM (Customer Relationship Management) sederhana untuk PT. Smart, sebuah perusahaan ISP, yang membantu tim sales mengelola lead, produk, pipeline deal, dan customer aktif.

---

## ✨ Fitur Utama & Pembaruan Terkini

| Fitur | Deskripsi |
|---|---|
| **Login & Autentikasi** | JWT auth dengan pembersihan memori (*cache clear*) otomatis antar akun |
| **Manajemen Lead** | CRUD lead lengkap dengan data *Gender* (Pria/Wanita) dan status tracking |
| **Master Produk** | CRUD produk dengan perhitungan margin & harga jual otomatis (*Generated Column*) |
| **Deal Pipeline** | Flow konversi lead ke customer, multi-produk, dan *auto-flagging* approval manager |
| **Customer Aktif** | Tampilkan customer berlangganan dengan avatar khusus gender dan perhitungan MRR |
| **Laporan & Export** | Dashboard analitik dan fitur Download Laporan Excel yang berjalan lancar |
| **UI/UX Modern** | Tampilan *Sky Blue* modern menggunakan Tailwind, animasi Framer Motion & Ikon |

---

## 🔐 Role & Akses

| Fitur | Sales | Manager |
|---|---|---|
| Lihat/kelola lead sendiri | ✅ | ✅ (semua) |
| Buat project | ✅ | ✅ |
| Approve/reject project | ❌ | ✅ |
| CRUD produk | ❌ | ✅ |
| Laporan (semua sales) | ❌ | ✅ |

---

## 🏗 Arsitektur & Struktur Project

```
smart-crm/
├── backend/                    # Express.js REST API
│   ├── src/
│   │   ├── config/
│   │   │   └── database.js     # PostgreSQL connection pool
│   │   ├── controllers/        # Business logic layer
│   │   │   ├── authController.js
│   │   │   ├── leadController.js
│   │   │   ├── productController.js
│   │   │   ├── projectController.js
│   │   │   ├── customerController.js
│   │   │   └── reportController.js
│   │   ├── middleware/
│   │   │   ├── authMiddleware.js   # JWT verify + role guard
│   │   │   └── errorMiddleware.js  # Global error handler
│   │   ├── routes/             # Express routers
│   │   ├── database/
│   │   │   ├── migrate.js      # DDL migration script
│   │   │   └── seed.js         # Initial data seeder
│   │   └── server.js           # App entry point
│   ├── .env.example            # ← Copy ke .env
│   ├── Dockerfile
│   └── package.json
│
├── frontend/                   # React 18 + Vite + Tailwind
│   ├── src/
│   │   ├── components/         # Shared UI primitives & layout
│   │   ├── constants/          # API endpoints, status maps
│   │   ├── context/            # AuthContext (global state)
│   │   ├── pages/              # Route-level page components
│   │   ├── services/           # Axios instance + interceptors
│   │   └── utils/              # Format helpers (Rupiah, date)
│   ├── .env.example            # ← Copy ke .env
│   ├── Dockerfile
│   └── vite.config.js
│
├── docker-compose.yml
└── README.md
```

---

## 🚀 Cara Menjalankan

### Prasyarat
- Node.js ≥ 18
- PostgreSQL ≥ 14 (atau Docker)

---

### Option A: Manual (tanpa Docker)

**1. Setup Backend**
```bash
cd backend
cp .env.example .env
# Edit .env dengan konfigurasi database Anda

npm install
npm run migrate   # Buat semua tabel
npm run seed      # Isi data awal (user & produk demo)
npm run dev       # Jalankan server di port 5001
```

**2. Setup Frontend**
```bash
cd frontend
cp .env.example .env
# Pastikan VITE_API_BASE_URL=http://localhost:5001/api

npm install
npm run dev       # Jalankan di port 5173
```

**3. Buka browser:** http://localhost:5173

---

### Option B: Docker Compose

```bash
# 1. Setup env files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# 2. Edit backend/.env — sesuaikan DB_PASSWORD dan JWT_SECRET

# 3. Jalankan semua service
docker-compose up --build

# 4. Jalankan migrasi & seed (sekali saja)
docker-compose exec backend node src/database/migrate.js
docker-compose exec backend node src/database/seed.js
```

**Buka browser:** http://localhost:5173

---

## 🔑 Akun Default (Setelah Seed)

| Email | Password | Role |
|---|---|---|
| manager@smart.id | password123 | Manager |
| budi@smart.id | password123 | Sales |
| sari@smart.id | password123 | Sales |

---

## 🌐 API Endpoints

| Method | Endpoint | Deskripsi | Role |
|---|---|---|---|
| POST | `/api/auth/login` | Login | Public |
| GET | `/api/leads` | Daftar lead | Sales/Manager |
| POST | `/api/leads` | Tambah lead | Sales/Manager |
| PUT | `/api/leads/:id` | Edit lead | Owner/Manager |
| DELETE | `/api/leads/:id` | Hapus lead | Owner/Manager |
| GET | `/api/products` | Daftar produk | All |
| POST | `/api/products` | Tambah produk | Manager |
| PUT | `/api/products/:id` | Edit produk | Manager |
| GET | `/api/projects` | Daftar project | Sales/Manager |
| POST | `/api/projects` | Buat project | Sales/Manager |
| PATCH | `/api/projects/:id/approve` | Approve/reject | Manager |
| GET | `/api/customers` | Daftar customer | Sales/Manager |
| GET | `/api/reports/summary` | Laporan ringkasan | Sales/Manager |
| GET | `/api/reports/export` | Export Excel | Sales/Manager |

---

## 🔒 Keamanan

- Semua kredensial disimpan di file `.env` (tidak dicommit ke git)
- Password di-hash dengan **bcryptjs** (salt rounds: 10)
- API dilindungi **JWT Bearer token** (expired: 8 jam)
- Data antar sales terisolasi di level query (ownership check)
- `.gitignore` mengecualikan `.env` dan `node_modules`

---

## 🛠 Tech Stack

| Layer | Teknologi |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS, React Query, Axios |
| Backend | Node.js, Express.js |
| Database | PostgreSQL 16 |
| Auth | JWT (jsonwebtoken), bcryptjs |
| Export | SheetJS (xlsx) |
| Container | Docker, Docker Compose |

---

## 📦 Deploy ke Cloud

**Railway / Render (recommended):**
1. Push repo ke GitHub
2. Buat project baru di Railway/Render
3. Tambahkan service PostgreSQL
4. Set environment variables sesuai `.env.example`
5. Deploy backend & frontend sebagai service terpisah

---

*Happy Coding! 🚀*
