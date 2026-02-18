import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { startOfDay, endOfDay, startOfMonth, subMonths, subDays } from 'date-fns'

// ฟังก์ชันคำนวณข้อมูลสถิติ
async function getDashboardStats() {
    const now = new Date()
    const todayStart = startOfDay(now)
    const todayEnd = endOfDay(now)
    const monthStart = startOfMonth(now)
    const lastMonthStart = startOfMonth(subMonths(now, 1))
    const yesterdayStart = startOfDay(subDays(now, 1))

    // Use Promise.all to fetch data in parallel
    const [
        totalCustomers,
        customerChangeFromLastMonth,
        salesToday,
        salesYesterday,
        totalProducts,
        salesThisMonth,
        salesLastMonth
    ] = await Promise.all([
        // 1. Count total customers
        prisma.customer.count(),

        // 2. Count customers from last month
        prisma.customer.count({
            where: {
                created_at: { gte: lastMonthStart }
            }
        }),

        // 3. Sales Today
        prisma.transaction_header.aggregate({
            _sum: { net_amount: true },
            where: {
                transaction_date: { gte: todayStart, lte: todayEnd },
                payment_status: 'PAID'
            }
        }),

        // 4. Sales Yesterday
        prisma.transaction_header.aggregate({
            _sum: { net_amount: true },
            where: {
                transaction_date: { gte: yesterdayStart, lte: todayStart },
                payment_status: 'PAID'
            }
        }),

        // 5. Total Products
        prisma.inventory.aggregate({
            _sum: { full_qty: true },
        }),

        // 6. Sales This Month
        prisma.transaction_header.aggregate({
            _sum: { net_amount: true },
            where: {
                transaction_date: { gte: monthStart },
                payment_status: 'PAID'
            }
        }),

        // 7. Sales Last Month
        prisma.transaction_header.aggregate({
            _sum: { net_amount: true },
            where: {
                transaction_date: { gte: lastMonthStart, lt: monthStart },
                payment_status: 'PAID'
            }
        })
    ])

    let CustomerChange = 0
    if (customerChangeFromLastMonth > 0) {
        CustomerChange = (customerChangeFromLastMonth / totalCustomers) * 100
    }

    let salesChange = 0
    if (salesYesterday._sum.net_amount && salesToday._sum?.net_amount !== undefined) {
        salesChange = ((Number(salesToday._sum?.net_amount ?? 0) - Number(salesYesterday._sum.net_amount)) / Number(salesYesterday._sum.net_amount)) * 100
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
            change: `${salesChange >= 0 ? '+' : ''}${salesChange.toFixed(0)}%`,
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