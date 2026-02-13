import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/reports/sales - Sales report by date range and payment method
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const startDate = searchParams.get('startDate') || new Date(new Date().setDate(1)).toISOString().split('T')[0]
        const endDate = searchParams.get('endDate') || new Date().toISOString().split('T')[0]
        const groupBy = searchParams.get('groupBy') || 'daily' // daily or monthly

        // ⚡ Bolt: Fetch transactions and payment breakdown in parallel
        const [transactions, paymentsByMethod] = await Promise.all([
            prisma.transaction_header.findMany({
                where: {
                    transaction_date: {
                        gte: new Date(startDate),
                        lte: new Date(endDate + 'T23:59:59'),
                    },
                    payment_status: { not: 'VOIDED' },
                },
                include: {
                    payment_log: true,
                },
            }),
            prisma.payment_log.groupBy({
                by: ['payment_method'],
                where: {
                    payment_date: {
                        gte: new Date(startDate),
                        lte: new Date(endDate + 'T23:59:59'),
                    },
                },
                _sum: {
                    amount_paid: true,
                },
            })
        ])

        // Calculate totals
        const totalSales = transactions.reduce((sum, t) => sum + Number(t.net_amount), 0)
        const totalPaid = transactions.reduce((sum, t) =>
            sum + t.payment_log.reduce((ps, p) => ps + Number(p.amount_paid), 0), 0
        )
        const totalOutstanding = transactions.reduce((sum, t) => sum + Number(t.remaining_balance), 0)
        const transactionCount = transactions.length

        // Group by date
        const dailyData: Record<string, { date: string; sales: number; paid: number; count: number }> = {}

        transactions.forEach((t) => {
            const dateKey = groupBy === 'monthly'
                ? t.transaction_date.toISOString().substring(0, 7)
                : t.transaction_date.toISOString().split('T')[0]

            if (!dailyData[dateKey]) {
                dailyData[dateKey] = { date: dateKey, sales: 0, paid: 0, count: 0 }
            }

            dailyData[dateKey].sales += Number(t.net_amount)
            dailyData[dateKey].paid += t.payment_log.reduce((s, p) => s + Number(p.amount_paid), 0)
            dailyData[dateKey].count += 1
        })

        return NextResponse.json({
            summary: {
                totalSales,
                totalPaid,
                totalOutstanding,
                transactionCount,
                startDate,
                endDate,
            },
            byPaymentMethod: paymentsByMethod.map((p) => ({
                method: p.payment_method,
                amount: Number(p._sum.amount_paid) || 0,
            })),
            dailyBreakdown: Object.values(dailyData).sort((a, b) => a.date.localeCompare(b.date)),
        })
    } catch (error) {
        console.error('Error generating sales report:', error)
        return NextResponse.json(
            { error: 'Failed to generate report' },
            { status: 500 }
        )
    }
}
