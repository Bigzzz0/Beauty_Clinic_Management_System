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

        // Build staff filter
        const staffFilter = staffId ? { staff_id: parseInt(staffId) } : {}

        // Get all staff who are consultants (typically Sale or Doctor roles)
        const consultantStaff = await prisma.staff.findMany({
            where: {
                is_active: true,
                ...staffFilter,
            },
            include: {
                consulted_customers: {
                    select: {
                        customer_id: true,
                        hn_code: true,
                        full_name: true,
                        created_at: true,
                    },
                },
            },
        })

        // Get transactions for each consultant's customers within the month
        const consultantPerformance = await Promise.all(
            consultantStaff.map(async (staff) => {
                const customerIds = staff.consulted_customers.map(c => c.customer_id)

                if (customerIds.length === 0) {
                    return {
                        staff_id: staff.staff_id,
                        full_name: staff.full_name,
                        position: staff.position,
                        customer_count: 0,
                        new_customers_this_month: 0,
                        total_sales: 0,
                        transaction_count: 0,
                        average_per_customer: 0,
                    }
                }

                // Get transactions from this consultant's customers in the time period
                const transactions = await prisma.transaction_header.findMany({
                    where: {
                        customer_id: { in: customerIds },
                        transaction_date: {
                            gte: startDate,
                            lte: endDate,
                        },
                        payment_status: { not: 'VOIDED' },
                    },
                    select: {
                        net_amount: true,
                        transaction_id: true,
                    },
                })

                // Count new customers this month
                const newCustomersThisMonth = staff.consulted_customers.filter(
                    (c) => c.created_at && c.created_at >= startDate && c.created_at <= endDate
                ).length

                const totalSales = transactions.reduce(
                    (sum, t) => sum + Number(t.net_amount),
                    0
                )

                return {
                    staff_id: staff.staff_id,
                    full_name: staff.full_name,
                    position: staff.position,
                    customer_count: staff.consulted_customers.length,
                    new_customers_this_month: newCustomersThisMonth,
                    total_sales: totalSales,
                    transaction_count: transactions.length,
                    average_per_customer: customerIds.length > 0
                        ? Math.round(totalSales / customerIds.length)
                        : 0,
                }
            })
        )

        // Sort by total sales descending
        const sortedPerformance = consultantPerformance
            .filter(p => p.customer_count > 0 || p.transaction_count > 0)
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
