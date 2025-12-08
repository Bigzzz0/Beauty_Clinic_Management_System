# Beauty Clinic Management System 💅

ระบบบริหารจัดการคลินิกความงามและคลังยา (Beauty Clinic Management System)

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

## 📁 Project Structure

```
Beauty_Clinic_Management_System/
├── nextjs-app/              # Next.js Full-stack Application
│   ├── prisma/
│   │   └── schema.prisma    # Database schema
│   ├── src/
│   │   ├── app/
│   │   │   ├── (dashboard)/ # Dashboard pages
│   │   │   │   ├── patients/
│   │   │   │   ├── pos/
│   │   │   │   ├── inventory/
│   │   │   │   ├── reports/
│   │   │   │   └── settings/
│   │   │   └── api/         # API Routes
│   │   │       ├── auth/
│   │   │       ├── patients/
│   │   │       ├── products/
│   │   │       ├── transactions/
│   │   │       └── reports/
│   │   ├── components/      # Reusable components
│   │   ├── lib/             # Utilities & Prisma client
│   │   └── stores/          # Zustand stores
│   ├── .env.example         # Environment template
│   └── package.json
├── .gitignore
└── README.md
```

## 🚀 Getting Started

### Prerequisites

- **Node.js** v18 หรือสูงกว่า
- **MySQL** v8.0 หรือสูงกว่า
- **npm** หรือ **pnpm**

### 1. Clone & Install

```bash
# Clone repository
git clone https://github.com/YOUR_USERNAME/Beauty-Clinic-Management-System.git
cd Beauty-Clinic-Management-System

# Go to app directory
cd nextjs-app

# Install dependencies
npm install
```

### 2. Database Setup

สร้าง MySQL Database:

```sql
CREATE DATABASE beauty_clinic_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 3. Environment Configuration

```bash
# Copy environment template
copy .env.example .env
```

แก้ไขไฟล์ `.env`:

```env
# Database connection
DATABASE_URL="mysql://root:YOUR_PASSWORD@localhost:3306/beauty_clinic_db"

# JWT Secret (เปลี่ยนใน production)
JWT_SECRET="your-super-secret-jwt-key"

# App URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 4. Initialize Database with Prisma

```bash
# Push schema to database (สร้าง tables อัตโนมัติ)
npx prisma db push

# Generate Prisma client
npx prisma generate

# (Optional) เปิด Prisma Studio เพื่อดูข้อมูล
npx prisma studio
```

### 5. Run Development Server

```bash
npm run dev
```

เปิดเบราว์เซอร์ไปที่ `http://localhost:3000`

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

หลังจาก setup เสร็จ สามารถ login ด้วย:

| Username | Password | Role |
|----------|----------|------|
| `admin` | `admin123` | Admin |

> ⚠️ **อย่าลืมเปลี่ยน password ใน production!**

## 🔧 Troubleshooting

### Database Connection Issues

1. **ตรวจสอบ MySQL ทำงานอยู่:**
   ```bash
   # Windows: ตรวจสอบใน Services
   # หรือลอง connect ด้วย MySQL Workbench
   ```

2. **ตรวจสอบ DATABASE_URL ใน .env:**
   - username และ password ถูกต้อง
   - database name ถูกต้อง
   - port ถูกต้อง (default: 3306)

3. **Reset Prisma:**
   ```bash
   npx prisma generate
   npx prisma db push --force-reset  # ⚠️ จะลบข้อมูลทั้งหมด
   ```

### Common Errors

| Error | Solution |
|-------|----------|
| `P1000: Authentication failed` | ตรวจสอบ username/password ใน DATABASE_URL |
| `P1001: Can't reach database` | ตรวจสอบว่า MySQL ทำงานอยู่ |
| `P1003: Database does not exist` | สร้าง database ก่อน: `CREATE DATABASE beauty_clinic_db` |

## ✅ Features

- [x] � Authentication (Login/Logout)
- [x] � Patient Management (CRUD)
- [x] � Product/Inventory Management
- [x] 🛒 POS System
- [x] � Course Management
- [x] � Transaction & Payment
- [x] 📈 Reports (Sales, Commission, Debts)
- [x] ⚙️ Settings

## 📄 License

ISC

---

**Created:** December 2025  
**Version:** 2.0.0 (Next.js Migration)
