import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/deposits - Get all deposit transactions or by customer
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const customerId = searchParams.get('customerId')
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '20')
        const skip = (page - 1) * limit

        const where = customerId ? { customer_id: parseInt(customerId) } : {}

        const deposits = await prisma.customer_deposit.findMany({
            where,
            include: {
                customer: {
                    select: {
                        customer_id: true,
                        hn_code: true,
                        full_name: true,
                    },
                },
            },
            orderBy: { created_at: 'desc' },
            skip,
            take: limit,
        })

        const total = await prisma.customer_deposit.count({ where })

        return NextResponse.json({
            data: deposits.map(d => ({
                ...d,
                amount: Number(d.amount),
                balance_after: Number(d.balance_after),
            })),
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        })
    } catch (error) {
        console.error('Error fetching deposits:', error)
        return NextResponse.json(
            { error: 'Failed to fetch deposits' },
            { status: 500 }
        )
    }
}

// POST /api/deposits - Add new deposit or deduct from balance
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { customer_id, amount, type, note, created_by } = body

        if (!customer_id || !amount || !type) {
            return NextResponse.json(
                { error: 'customer_id, amount, and type are required' },
                { status: 400 }
            )
        }

        // Get current balance
        const latestDeposit = await prisma.customer_deposit.findFirst({
            where: { customer_id },
            orderBy: { created_at: 'desc' },
        })

        const currentBalance = latestDeposit ? Number(latestDeposit.balance_after) : 0
        let newBalance: number

        // Calculate new balance based on transaction type
        switch (type) {
            case 'ADD':
            case 'REFUND':
                newBalance = currentBalance + Number(amount)
                break
            case 'DEDUCT':
                if (currentBalance < Number(amount)) {
                    return NextResponse.json(
                        { error: 'Insufficient deposit balance', current: currentBalance },
                        { status: 400 }
                    )
                }
                newBalance = currentBalance - Number(amount)
                break
            case 'ADJUST':
                newBalance = Number(amount) // Adjust sets the balance directly
                break
            default:
                return NextResponse.json(
                    { error: 'Invalid transaction type' },
                    { status: 400 }
                )
        }

        // Create deposit transaction
        const deposit = await prisma.customer_deposit.create({
            data: {
                customer_id,
                amount: type === 'ADJUST' ? Math.abs(newBalance - currentBalance) : amount,
                type,
                balance_after: newBalance,
                note: note || null,
                created_by: created_by || null,
            },
            include: {
                customer: {
                    select: {
                        customer_id: true,
                        hn_code: true,
                        full_name: true,
                    },
                },
            },
        })

        return NextResponse.json({
            ...deposit,
            amount: Number(deposit.amount),
            balance_after: Number(deposit.balance_after),
            previous_balance: currentBalance,
        }, { status: 201 })
    } catch (error) {
        console.error('Error creating deposit:', error)
        return NextResponse.json(
            { error: 'Failed to create deposit' },
            { status: 500 }
        )
    }
}
