# Beauty Clinic Management System 💅

ระบบบริหารจัดการคลินิกความงามครบวงจร (Full-featured Beauty Clinic Management System)

![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=flat-square&logo=tailwind-css)
![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?style=flat-square&logo=prisma)

## ✨ Key Features

- 👥 **Patient Management** - ระบบจัดการข้อมูลลูกค้า พร้อม HN อัตโนมัติ
- 🛒 **POS System** - ระบบขายสินค้าและบริการ
- 📦 **Inventory Management** - จัดการคลังสินค้าและวัตถุดิบ
- 💉 **Course Management** - ระบบคอร์สรักษาแบบหลายครั้ง
- 💰 **Commission Tracking** - คำนวณค่าคอมมิชชั่นอัตโนมัติ
- 📊 **Reports & Analytics** - รายงานยอดขาย, ค่ามือ, และหนี้ค้างชำระ
- 💳 **Deposit System** - ระบบมัดจำลูกค้า
- 🧾 **Receipt Printing** - พิมพ์ใบเสร็จแบบพรีเมียม
- 🌙 **Dark/Light Mode** - รองรับทั้ง 2 ธีม

## 🛠️ Tech Stack

| Category | Technology |
|----------|------------|
| **Framework** | Next.js 16 (App Router) |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS v4 |
| **UI Components** | Radix UI + shadcn/ui |
| **Database** | MySQL + Prisma ORM |
| **State Management** | Zustand + TanStack Query |
| **Authentication** | JWT (jsonwebtoken + bcryptjs) |
| **Forms** | React Hook Form + Zod |
| **Fonts** | Inter + Noto Sans Thai |

## 📁 Project Structure

```
Beauty_Clinic_Management_System/
├── nextjs-app/              # Next.js Full-stack Application
│   ├── prisma/
│   │   └── schema.prisma    # Database schema
│   ├── src/
│   │   ├── app/
│   │   │   ├── (dashboard)/ # Dashboard pages
│   │   │   │   ├── dashboard/
│   │   │   │   ├── patients/
│   │   │   │   ├── pos/
│   │   │   │   ├── inventory/
│   │   │   │   ├── transactions/
│   │   │   │   ├── debtors/
│   │   │   │   ├── service/
│   │   │   │   ├── reports/
│   │   │   │   │   ├── consultant-performance/
│   │   │   │   │   └── daily-sales/
│   │   │   │   └── settings/
│   │   │   │       ├── commission-rates/
│   │   │   │       └── deposits/
│   │   │   └── api/         # API Routes
│   │   ├── components/
│   │   │   ├── layout/      # Sidebar, Header
│   │   │   └── ui/          # shadcn/ui components
│   │   ├── lib/             # Utilities & Prisma client
│   │   └── stores/          # Zustand stores
│   ├── Dockerfile           # Multi-stage Docker build
│   ├── entrypoint.sh        # Container startup script
│   └── package.json
├── docker-compose.yml       # Docker Compose config
├── mock_data.sql            # Sample data for seeding
├── .env                     # Environment variables
└── README.md
```

## 🐳 Quick Start with Docker

วิธีที่ง่ายที่สุดในการรันโปรเจค — ใช้ Docker!

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) ติดตั้งและเปิดอยู่

### 1. Clone & Configure

```bash
git clone https://github.com/Bigzzz0/Beauty_Clinic_Management_System.git
cd Beauty_Clinic_Management_System

# สร้างไฟล์ .env (หรือแก้ไขค่าตามต้องการ)
cp .env.example .env
```

แก้ไข `.env`:

```env
MYSQL_ROOT_PASSWORD=your_password
MYSQL_DATABASE=beauty_clinic_db
JWT_SECRET=your-secret-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 2. Build & Run

```bash
# Build และ Start ทุก service
docker compose up -d --build

# ดู logs (รอจนเห็น "✓ Ready")
docker compose logs -f app
```

### 3. เปิดใช้งาน

เปิดเบราว์เซอร์ไปที่ **http://localhost:3000** 🎉

> ระบบจะสร้างตาราง + seed ข้อมูลตัวอย่างอัตโนมัติเมื่อ start ครั้งแรก

### Docker Commands ที่ใช้บ่อย

| Command | Description |
|---------|-------------|
| `docker compose up -d` | Start ทุก container (background) |
| `docker compose down` | Stop ทุก container |
| `docker compose down -v` | Stop + ลบ database volume (reset ข้อมูล) |
| `docker compose logs -f app` | ดู logs ของ app |
| `docker compose logs -f db` | ดู logs ของ database |
| `docker compose up -d --build` | Rebuild และ start ใหม่ |

### Ports

| Service | Port | Description |
|---------|------|-------------|
| **App** | `3000` | Next.js web application |
| **MySQL** | `3307` | Database (mapped to 3307 เพื่อไม่ชนกับ MySQL ในเครื่อง) |

## 🚀 Getting Started

### Prerequisites

- **Node.js** v18 or higher
- **MySQL** v8.0 or higher
- **npm** or **pnpm**

### 1. Clone & Install

```bash
# Clone repository
git clone https://github.com/Bigzzz0/Beauty_Clinic_Management_System.git
cd Beauty_Clinic_Management_System

# Go to app directory
cd nextjs-app

# Install dependencies
npm install
```

### 2. Database Setup

Create MySQL Database:

```sql
CREATE DATABASE beauty_clinic_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 3. Environment Configuration

```bash
# Copy environment template
cp .env.example .env   # or: copy .env.example .env (Windows)
```

Edit `.env` file:

```env
# Database connection
DATABASE_URL="mysql://root:YOUR_PASSWORD@localhost:3306/beauty_clinic_db"

# JWT Secret (change in production!)
JWT_SECRET="your-super-secret-jwt-key"

# App URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 4. Initialize Database with Prisma

```bash
# Push schema to database
npx prisma db push

# Generate Prisma client
npx prisma generate

# (Optional) Open Prisma Studio
npx prisma studio
```

### 5. Run Development Server

```bash
npm run dev
```

Open browser at `http://localhost:3000`

## 📝 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |
| `npx prisma studio` | Open Prisma database GUI |
| `npx prisma db push` | Sync schema to database |
| `npx prisma generate` | Generate Prisma client |

## 🔐 Default Login

| Username | Password | Role |
|----------|----------|------|
| `admin` | `admin123` | Admin |

> ⚠️ **Change password in production!**

## 🎨 UI/UX Features

- **Brand Colors**: Pink/Purple gradient theme
- **Responsive Design**: Works on all screen sizes
- **Premium Aesthetics**: Glassmorphism, gradients, and micro-animations
- **Thai Language Support**: Full Thai UI with Noto Sans Thai font
- **Semantic Colors**: Proper light/dark mode support

## 🔧 Troubleshooting

### Database Connection Issues

1. **Check MySQL is running**
2. **Verify DATABASE_URL** in `.env` - username, password, database name, port
3. **Reset Prisma:**
   ```bash
   npx prisma generate
   npx prisma db push --force-reset  # ⚠️ Deletes all data!
   ```

### Common Errors

| Error | Solution |
|-------|----------|
| `P1000: Authentication failed` | Check username/password in DATABASE_URL |
| `P1001: Can't reach database` | Ensure MySQL is running |
| `P1003: Database does not exist` | Create database first |

## ✅ Features Checklist

- [x] 🔐 Authentication (Login/Logout)
- [x] 👥 Patient Management (CRUD + HN Auto-generation)
- [x] 📦 Product/Inventory Management
- [x] 🛒 POS System with Multiple Payment Methods
- [x] 💉 Course Management (Multi-session)
- [x] 💰 Transaction & Payment with Debt Tracking
- [x] 📈 Reports (Sales, Commission, Consultant Performance)
- [x] 💳 Customer Deposit System
- [x] 🧾 Premium Receipt Printing
- [x] ⚙️ Settings (Commission Rates, Staff Management)
- [x] 🌙 Dark/Light Mode Theme

## 📄 License

ISC

---

**Created:** December 2025  
**Version:** 2.1.0  
**Repository:** [github.com/Bigzzz0/Beauty_Clinic_Management_System](https://github.com/Bigzzz0/Beauty_Clinic_Management_System)
