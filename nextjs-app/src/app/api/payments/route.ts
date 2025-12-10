import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

// Get staff_id from token
function getStaffIdFromRequest(request: NextRequest): number | null {
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) return null

    try {
        const token = authHeader.substring(7)
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as { staff_id: number }
        return decoded.staff_id
    } catch {
        return null
    }
}

export async function POST(request: NextRequest) {
    try {
        const staffId = getStaffIdFromRequest(request)
        if (!staffId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { transaction_id, amount_paid, payment_method, customer_id } = body

        // For DEPOSIT payment, verify and deduct from customer deposit balance
        if (payment_method === 'DEPOSIT') {
            if (!customer_id) {
                return NextResponse.json({ error: 'customer_id required for deposit payment' }, { status: 400 })
            }

            // Get current deposit balance
            const latestDeposit = await prisma.customer_deposit.findFirst({
                where: { customer_id },
                orderBy: { created_at: 'desc' },
            })

            const currentBalance = latestDeposit ? Number(latestDeposit.balance_after) : 0

            if (currentBalance < amount_paid) {
                return NextResponse.json({
                    error: 'ยอดมัดจำไม่เพียงพอ',
                    current_balance: currentBalance,
                    requested: amount_paid,
                }, { status: 400 })
            }

            // Deduct from deposit balance
            await prisma.customer_deposit.create({
                data: {
                    customer_id,
                    transaction_id,
                    amount: amount_paid,
                    type: 'DEDUCT',
                    balance_after: currentBalance - amount_paid,
                    note: `ชำระรายการ #${transaction_id}`,
                    created_by: staffId,
                },
            })
        }

        // Create payment log
        const payment = await prisma.payment_log.create({
            data: {
                transaction_id,
                staff_id: staffId,
                amount_paid,
                payment_method,
            },
        })

        // Update transaction remaining balance and status
        const transaction = await prisma.transaction_header.findUnique({
            where: { transaction_id },
            include: { payment_log: true },
        })

        if (transaction) {
            const totalPaid = transaction.payment_log.reduce(
                (sum, p) => sum + Number(p.amount_paid),
                0
            )
            const remaining = Number(transaction.net_amount) - totalPaid

            await prisma.transaction_header.update({
                where: { transaction_id },
                data: {
                    remaining_balance: remaining,
                    payment_status: remaining <= 0 ? 'PAID' : 'PARTIAL',
                },
            })
        }

        return NextResponse.json(payment, { status: 201 })
    } catch (error) {
        console.error('Error creating payment:', error)
        return NextResponse.json(
            { error: 'Failed to create payment' },
            { status: 500 }
        )
    }
}
