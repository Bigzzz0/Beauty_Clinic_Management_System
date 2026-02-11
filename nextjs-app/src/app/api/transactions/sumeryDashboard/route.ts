import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { startOfDay, endOfDay, startOfMonth, subMonths } from 'date-fns'

// ฟังก์ชันคำนวณข้อมูลสถิติ
async function getDashboardStats() {
    const now = new Date()
    const todayStart = startOfDay(now)
    const todayEnd = endOfDay(now)
    const monthStart = startOfMonth(now)
    const lastMonthStart = startOfMonth(subMonths(now, 1))

    // 1. นับจำนวนลูกค้าทั้งหมด
    const totalCustomers = await prisma.customer.count()

    const customerChangeFromLastMonth = await prisma.customer.count({
        where: {
            created_at: { gte: lastMonthStart}
        }
    })

    // 2. ยอดรวมการขายของวันนี้ (เฉพาะที่จ่ายเงินแล้ว)
    const salesToday = await prisma.transaction_header.aggregate({
        _sum: { net_amount: true },
        where: {
            transaction_date: { gte: todayStart, lte: todayEnd },
            payment_status: 'PAID'
        }
    })

    // 3. นับจำนวนสินค้าในคลังที่ยังเปิดใช้งานอยู่
    const totalProducts = await prisma.inventory.aggregate({
        _sum: { full_qty: true },
    })

    // 4. ยอดรวมการขายเดือนนี้
    const salesThisMonth = await prisma.transaction_header.aggregate({
        _sum: { net_amount: true },
        where: {
            transaction_date: { gte: monthStart },
            payment_status: 'PAID'
        }
    })

    // 5. ยอดรวมการขายเดือนที่แล้ว (เพื่อหา % Change)
    const salesLastMonth = await prisma.transaction_header.aggregate({
        _sum: { net_amount: true },
        where: {
            transaction_date: { gte: lastMonthStart, lt: monthStart },
            payment_status: 'PAID'
        }
    })

    let CustomerChange = 0
    if (customerChangeFromLastMonth > 0) {
        CustomerChange = (customerChangeFromLastMonth / totalCustomers) * 100
    }

    // คำนวณค่าตัวเลข
    const currentMonthValue = Number(salesThisMonth._sum?.net_amount ?? 0)
    const lastMonthValue = Number(salesLastMonth._sum?.net_amount ?? 0)
    const todayValue = Number(salesToday._sum?.net_amount ?? 0)

    // คำนวณ % การเปลี่ยนแปลงของเดือนนี้เทียบกับเดือนที่แล้ว
    let monthChange = 0
    if (lastMonthValue > 0) {
        monthChange = ((currentMonthValue - lastMonthValue) / lastMonthValue) * 100
    }

    // จัด Format ข้อมูลส่งกลับไปให้ Frontend
    return [
        {
            title: 'ลูกค้าทั้งหมด',
            value: totalCustomers.toLocaleString(),
            change: `${CustomerChange >= 0 ? '+' : ''}${CustomerChange.toFixed(0)}%`, // ส่วนนี้สามารถเขียน Logic นับเทียบกับเดือนก่อนได้เช่นกัน
            icon: 'Users',
        },
        {
            title: 'ยอดขายวันนี้',
            value: `฿${todayValue.toLocaleString()}`,
            change: '+8%',
            icon: 'ShoppingCart',
        },
        {
            title: 'สินค้าในคลัง',
            value: totalProducts._sum.full_qty?.toLocaleString() || '0',
            change: '0%',
            icon: 'Package',
        },
        {
            title: 'ยอดขายเดือนนี้',
            value: currentMonthValue >= 1000000 
                ? `฿${(currentMonthValue / 1000000).toFixed(1)}M` 
                : `฿${currentMonthValue.toLocaleString()}`,
            change: `${monthChange >= 0 ? '+' : ''}${monthChange.toFixed(0)}%`,
            icon: 'TrendingUp',
        }
    ]
}

// Main API Handler
export async function GET(request: NextRequest) {
    try {
        const dashboardStats = await getDashboardStats()
        return NextResponse.json(dashboardStats)
    } catch (error) {
        console.error('Dashboard Stats Error:', error)
        return NextResponse.json(
            { error: 'Failed to fetch dashboard statistics' },
            { status: 500 }
        )
    }
}