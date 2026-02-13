import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/reports/consultant-performance - Consultant performance report
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const month = searchParams.get('month') || new Date().toISOString().substring(0, 7)
        const staffId = searchParams.get('staffId')

        // Parse date range for the month
        const startDate = new Date(month + '-01')
        const endDate = new Date(startDate)
        endDate.setMonth(endDate.getMonth() + 1)
        endDate.setDate(0) // Last day of month
        endDate.setHours(23, 59, 59, 999)

        const staffIdInt = staffId ? parseInt(staffId) : undefined

        // ⚡ Bolt: Optimized query strategy
        // 1. Get Staff info and Total Customer Count (using _count instead of fetching all customers)
        // 2. Get New Customers Count grouped by Staff (using groupBy)
        // 3. Get Sales Data grouped by Staff (using aggregation in memory after fetching minimal data)

        // 1. Get Staff info and Total Customer Count
        const staffList = await prisma.staff.findMany({
            where: {
                is_active: true,
                ...(staffIdInt ? { staff_id: staffIdInt } : {}),
                // Only fetch staff who are consultants (Doctor, Sale, etc.) - logic from original code was implicit by relation check
                // but here we fetch all active staff and filter by those who have customers or transactions later
            },
            select: {
                staff_id: true,
                full_name: true,
                position: true,
                _count: {
                    select: { consulted_customers: true }
                }
            }
        })

        // 2. Get New Customers Count grouped by Staff
        const newCustomersStats = await prisma.customer.groupBy({
            by: ['personal_consult_id'],
            where: {
                created_at: { gte: startDate, lte: endDate },
                ...(staffIdInt ? { personal_consult_id: staffIdInt } : {})
            },
            _count: { customer_id: true }
        })

        // Map new customers to staff ID for easy lookup
        const newCustomersMap = new Map<number, number>()
        newCustomersStats.forEach(stat => {
            if (stat.personal_consult_id !== null) {
                newCustomersMap.set(stat.personal_consult_id, stat._count.customer_id)
            }
        })

        // 3. Get Sales Data (Transactions)
        // ⚡ Bolt: Optimized to use groupBy on customer_id first (O(N) -> O(K))
        // This reduces data transfer and memory usage by aggregating at database level
        const customerSalesStats = await prisma.transaction_header.groupBy({
            by: ['customer_id'],
            where: {
                transaction_date: { gte: startDate, lte: endDate },
                payment_status: { not: 'VOIDED' },
                ...(staffIdInt ? { customer: { personal_consult_id: staffIdInt } } : {})
            },
            _sum: {
                net_amount: true
            },
            _count: {
                transaction_id: true
            }
        })

        // Get consultant mapping for involved customers
        const customerIds = customerSalesStats.map(s => s.customer_id)

        // Fetch only needed fields for customers involved
        const customers = await prisma.customer.findMany({
            where: {
                customer_id: { in: customerIds }
            },
            select: {
                customer_id: true,
                personal_consult_id: true
            }
        })

        const customerConsultantMap = new Map<number, number | null>()
        customers.forEach(c => {
            customerConsultantMap.set(c.customer_id, c.personal_consult_id)
        })

        // Aggregate sales by consultant
        const salesStats = new Map<number, { sales: number; count: number }>()

        customerSalesStats.forEach(stat => {
            const consultantId = customerConsultantMap.get(stat.customer_id)
            if (consultantId) {
                const current = salesStats.get(consultantId) || { sales: 0, count: 0 }
                current.sales += Number(stat._sum.net_amount || 0)
                current.count += stat._count.transaction_id
                salesStats.set(consultantId, current)
            }
        })

        // 4. Combine results
        const consultantPerformance = staffList.map(staff => {
            const newCustomersCount = newCustomersMap.get(staff.staff_id) || 0
            const salesData = salesStats.get(staff.staff_id) || { sales: 0, count: 0 }
            const totalCustomers = staff._count.consulted_customers

            return {
                staff_id: staff.staff_id,
                full_name: staff.full_name,
                position: staff.position,
                customer_count: totalCustomers,
                new_customers_this_month: newCustomersCount,
                total_sales: salesData.sales,
                transaction_count: salesData.count,
                average_per_customer: totalCustomers > 0
                    ? Math.round(salesData.sales / totalCustomers)
                    : 0,
            }
        })

        // Filter and Sort (match original logic: only show if activity exists, sort by sales)
        const sortedPerformance = consultantPerformance
            .filter(p => p.customer_count > 0 || p.transaction_count > 0 || p.new_customers_this_month > 0)
            .sort((a, b) => b.total_sales - a.total_sales)

        // Calculate grand totals
        const grandTotal = {
            total_customers: sortedPerformance.reduce((s, p) => s + p.customer_count, 0),
            new_customers: sortedPerformance.reduce((s, p) => s + p.new_customers_this_month, 0),
            total_sales: sortedPerformance.reduce((s, p) => s + p.total_sales, 0),
            total_transactions: sortedPerformance.reduce((s, p) => s + p.transaction_count, 0),
        }

        return NextResponse.json({
            month,
            consultants: sortedPerformance,
            grandTotal,
        })
    } catch (error) {
        console.error('Error generating consultant performance report:', error)
        return NextResponse.json(
            { error: 'Failed to generate consultant performance report' },
            { status: 500 }
        )
    }
}
