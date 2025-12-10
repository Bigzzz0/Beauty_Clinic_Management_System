import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/deposits/balance/[customerId] - Get customer's current deposit balance
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ customerId: string }> }
) {
    try {
        const { customerId } = await params
        const customerIdInt = parseInt(customerId)

        if (isNaN(customerIdInt)) {
            return NextResponse.json(
                { error: 'Invalid customer ID' },
                { status: 400 }
            )
        }

        // Get customer info
        const customer = await prisma.customer.findUnique({
            where: { customer_id: customerIdInt },
            select: {
                customer_id: true,
                hn_code: true,
                full_name: true,
            },
        })

        if (!customer) {
            return NextResponse.json(
                { error: 'Customer not found' },
                { status: 404 }
            )
        }

        // Get latest deposit to get current balance
        const latestDeposit = await prisma.customer_deposit.findFirst({
            where: { customer_id: customerIdInt },
            orderBy: { created_at: 'desc' },
        })

        const currentBalance = latestDeposit ? Number(latestDeposit.balance_after) : 0

        // Get deposit history (last 10)
        const recentHistory = await prisma.customer_deposit.findMany({
            where: { customer_id: customerIdInt },
            orderBy: { created_at: 'desc' },
            take: 10,
        })

        // Get deposit statistics
        const stats = await prisma.customer_deposit.groupBy({
            by: ['type'],
            where: { customer_id: customerIdInt },
            _sum: { amount: true },
            _count: true,
        })

        const statsMap: Record<string, { total: number; count: number }> = {}
        stats.forEach(s => {
            statsMap[s.type] = {
                total: Number(s._sum.amount) || 0,
                count: s._count,
            }
        })

        return NextResponse.json({
            customer,
            balance: currentBalance,
            stats: {
                total_added: statsMap['ADD']?.total || 0,
                total_deducted: statsMap['DEDUCT']?.total || 0,
                total_refunded: statsMap['REFUND']?.total || 0,
                add_count: statsMap['ADD']?.count || 0,
                deduct_count: statsMap['DEDUCT']?.count || 0,
            },
            recentHistory: recentHistory.map(d => ({
                ...d,
                amount: Number(d.amount),
                balance_after: Number(d.balance_after),
            })),
        })
    } catch (error) {
        console.error('Error fetching deposit balance:', error)
        return NextResponse.json(
            { error: 'Failed to fetch deposit balance' },
            { status: 500 }
        )
    }
}
