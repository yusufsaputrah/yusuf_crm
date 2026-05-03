# Smart CRM – PT. Smart ISP

Aplikasi CRM (Customer Relationship Management) sederhana untuk PT. Smart, sebuah perusahaan ISP, yang membantu tim sales mengelola lead, produk, pipeline deal, dan customer aktif.

---

## ✨ Fitur Utama

| Fitur | Deskripsi |
|---|---|
| **Login & Autentikasi** | JWT-based auth, session disimpan di localStorage |
| **Manajemen Lead** | CRUD lead dengan status tracking (new → converted) |
| **Master Produk** | CRUD produk dengan HPP, margin, dan harga jual otomatis |
| **Deal Pipeline** | Buat project multi-produk, harga negosiasi, approval workflow |
| **Customer Aktif** | Tampilkan customer berlangganan beserta layanannya |
| **Laporan** | Ringkasan per periode + export Excel |

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

## 🏗 Arsitektur & Struktur Project (Modular Architecture)

Aplikasi Frontend dibangun dengan prinsip **Separation of Concerns (Modular Architecture)**. Pemisahan dilakukan berdasarkan layer dan fungsinya sehingga memenuhi standar industri yang *Clean* dan *Maintainable*:

```
frontend/
├── Dockerfile                  # Konfigurasi image Docker frontend
├── docker-compose.yml          # Konfigurasi containerisasi frontend
├── vite.config.js              # Build tool config
├── src/
│   ├── components/             # Reusable UI Primitives (Modal, Badge, Layout)
│   │   └── UIComponents.jsx
│   ├── constants/              # Data konstan & Endpoint configuration
│   │   └── appConstants.js
│   ├── context/                # Global State Management (AuthContext)
│   ├── pages/                  # Halaman utama aplikasi (View Layer)
│   │   ├── LoginPage.jsx
│   │   ├── DashboardPage.jsx
│   │   └── ...
│   ├── services/               # Abstraksi Jaringan API (Layer Infrastruktur)
│   │   └── apiService.js       # Axios instance & interceptors
│   └── utils/                  # Utility helper (format uang, tanggal)
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
npm run dev       # Jalankan di port 3000
```

**3. Buka browser:** http://localhost:3000

---

### Option B: Docker Compose (Containerization)

Sebagai nilai tambah arsitektur *deployment*, kami telah menyediakan `Dockerfile` dan `docker-compose.yml` khusus untuk isolasi servis *Frontend*:

```bash
# 1. Setup env file
cp .env.example .env

# 2. Jalankan container frontend
docker-compose up -d --build

# 3. Frontend akan berjalan dan bisa diakses via browser
```

**Buka browser:** http://localhost:3000

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
