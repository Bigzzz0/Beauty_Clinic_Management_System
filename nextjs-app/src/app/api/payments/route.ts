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
        const { transaction_id, amount_paid, payment_method } = body

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
