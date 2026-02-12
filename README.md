# Beauty Clinic Management System 💅

ระบบบริหารจัดการคลินิกความงามครบวงจร (Full-featured Beauty Clinic Management System)

![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)
![React](https://img.shields.io/badge/React-19-blue?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=flat-square&logo=tailwind-css)
![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?style=flat-square&logo=prisma)

## ✨ Key Features

- 👥 **Patient Management** - ระบบจัดการข้อมูลลูกค้า พร้อม HN อัตโนมัติ
- 🛒 **POS System** - ระบบขายสินค้าและบริการ
- 📦 **Inventory Management** - จัดการคลังสินค้าและวัตถุดิบ
- 💉 **Course Management** - ระบบคอร์สรักษาแบบหลายครั้ง
- 📝 **Service Usage Recording** - บันทึกการใช้บริการและตัดสต๊อกหลังทำหัตถการ (Post-Treatment Deduction)
- 💰 **Real-time Commission** - คำนวณค่ามือและค่าคอมมิชชั่นตามจริงจากการให้บริการ
- 📊 **Reports & Analytics** - รายงานยอดขาย, ค่ามือ, และหนี้ค้างชำระ
- 💳 **Deposit System** - ระบบมัดจำลูกค้า
- 🧾 **Receipt Printing** - พิมพ์ใบเสร็จแบบพรีเมียม
- 🌙 **Dark/Light Mode** - รองรับทั้ง 2 ธีม

## 🛠️ Tech Stack

| Category | Technology |
|----------|------------|
| **Framework** | Next.js 16 (App Router) |
| **Library** | React 19 |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS v4 |
| **UI Components** | Radix UI + shadcn/ui |
| **Database** | MySQL + Prisma ORM |
| **State Management** | Zustand 5 + TanStack Query 5 |
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
│   │   │   │   ├── receipt/     # Receipt printing
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
│   └── package.json
└── README.md
```

## 🚀 Getting Started

### Prerequisites

- **Node.js** v18 or higher
- **MySQL** v8.0 or higher
- **pnpm** (Package Manager)

### 1. Clone & Install

```bash
# Clone repository
git clone https://github.com/Bigzzz0/Beauty_Clinic_Management_System.git
cd Beauty_Clinic_Management_System

# Go to app directory
cd nextjs-app

# Install dependencies
pnpm install
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

### 4. Initialize Database with Prisma & Seed Data

```bash
# Push schema to database
pnpm dlx prisma db push

# Generate Prisma client
pnpm dlx prisma generate

# (Optional) Seed Mock Data (requires MySQL client)
# Run this from the project root (outside nextjs-app)
mysql -u root -p beauty_clinic_db < ../mock_data.sql
```

### 5. Run Development Server

```bash
pnpm dev
```

Open browser at `http://localhost:3000`

## 📝 Available Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server |
| `pnpm build` | Build for production |
| `pnpm start` | Start production server |
| `pnpm lint` | Run ESLint |
| `pnpm dlx prisma studio` | Open Prisma database GUI |
| `pnpm dlx prisma db push` | Sync schema to database |
| `pnpm dlx prisma generate` | Generate Prisma client |

## 🔐 Default Login (Mock Data)

| Username | Password | Role |
|----------|----------|------|
| `admin_may` | `123` | Admin |
| `dr_leo` | `123` | Doctor |
| `gift_therapist` | `123` | Therapist |
| `sale_jiin` | `123` | Sale |
| `cashier_noon` | `123` | Cashier |

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
   pnpm dlx prisma generate
   pnpm dlx prisma db push --force-reset  # ⚠️ Deletes all data!
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
- [x] 📝 Service Usage & Stock Deduction
- [x] 💰 Transaction & Payment with Debt Tracking
- [x] 📈 Reports (Sales, Commission, Consultant Performance)
- [x] 💳 Customer Deposit System
- [x] 🧾 Premium Receipt Printing
- [x] ⚙️ Settings (Commission Rates, Staff Management)
- [x] 🌙 Dark/Light Mode Theme

## 📄 License

ISC

---

**Updated:** February 2026
**Version:** 3.0.0
**Repository:** [github.com/Bigzzz0/Beauty_Clinic_Management_System](https://github.com/Bigzzz0/Beauty_Clinic_Management_System)
