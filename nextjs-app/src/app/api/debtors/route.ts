import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

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

// GET /api/debtors - List customers with outstanding debt
export async function GET() {
    try {
        // Get all transactions with remaining balance > 0
        const debtors = await prisma.transaction_header.findMany({
            where: {
                remaining_balance: { gt: 0 },
            },
            include: {
                customer: {
                    select: {
                        customer_id: true,
                        hn_code: true,
                        first_name: true,
                        last_name: true,
                        phone_number: true,
                    },
                },
            },
            orderBy: {
                remaining_balance: 'desc',
            },
        })

        // Group by customer and sum debts
        const customerDebts = new Map<number, {
            customer_id: number
            hn_code: string
            full_name: string
            phone_number: string
            total_debt: number
            transactions: typeof debtors
        }>()

        debtors.forEach((t) => {
            const existing = customerDebts.get(t.customer_id)
            if (existing) {
                existing.total_debt += Number(t.remaining_balance)
                existing.transactions.push(t)
            } else {
                customerDebts.set(t.customer_id, {
                    customer_id: t.customer_id,
                    hn_code: t.customer.hn_code,
                    full_name: `${t.customer.first_name} ${t.customer.last_name}`,
                    phone_number: t.customer.phone_number,
                    total_debt: Number(t.remaining_balance),
                    transactions: [t],
                })
            }
        })

        // Convert to array and sort by total debt
        const result = Array.from(customerDebts.values()).sort(
            (a, b) => b.total_debt - a.total_debt
        )

        return NextResponse.json(result)
    } catch (error) {
        console.error('Error fetching debtors:', error)
        return NextResponse.json(
            { error: 'Failed to fetch debtors' },
            { status: 500 }
        )
    }
}

// POST /api/debtors - Pay debt (create payment log)
export async function POST(request: NextRequest) {
    try {
        const staffId = getStaffIdFromRequest(request)
        if (!staffId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { transaction_id, amount_paid, payment_method } = body

        if (!transaction_id || !amount_paid || amount_paid <= 0) {
            return NextResponse.json({ error: 'Invalid payment data' }, { status: 400 })
        }

        // Get transaction
        const transaction = await prisma.transaction_header.findUnique({
            where: { transaction_id },
        })

        if (!transaction) {
            return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
        }

        // Create payment log
        const payment = await prisma.payment_log.create({
            data: {
                transaction_id,
                staff_id: staffId,
                amount_paid,
                payment_method: payment_method || 'CASH',
            },
        })

        // Update transaction remaining balance
        const newBalance = Math.max(0, Number(transaction.remaining_balance) - amount_paid)
        await prisma.transaction_header.update({
            where: { transaction_id },
            data: {
                remaining_balance: newBalance,
                payment_status: newBalance === 0 ? 'PAID' : 'PARTIAL',
            },
        })

        return NextResponse.json({ success: true, payment, new_balance: newBalance }, { status: 201 })
    } catch (error) {
        console.error('Error processing debt payment:', error)
        return NextResponse.json(
            { error: 'Failed to process payment' },
            { status: 500 }
        )
    }
}
