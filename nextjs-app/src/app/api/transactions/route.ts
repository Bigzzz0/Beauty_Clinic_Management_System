import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

function getStaffFromRequest(request: NextRequest): { staff_id: number; position: string } | null {
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) return null
    try {
        const token = authHeader.substring(7)
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as { staff_id: number; position: string }
        return decoded
    } catch {
        return null
    }
}

// GET /api/transactions - List transactions with pagination
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '20')
        const status = searchParams.get('status') // PAID, PARTIAL, UNPAID, CANCELLED
        const search = searchParams.get('search') || ''

        const skip = (page - 1) * limit

        const where: Record<string, unknown> = {}

        if (status) {
            where.payment_status = status
        }

        if (search) {
            where.OR = [
                { transaction_id: parseInt(search) || undefined },
                { customer: { first_name: { contains: search } } },
                { customer: { last_name: { contains: search } } },
                { customer: { hn_code: { contains: search } } },
            ].filter(Boolean)
        }

        const [transactions, total] = await Promise.all([
            prisma.transaction_header.findMany({
                where,
                include: {
                    customer: {
                        select: {
                            customer_id: true,
                            hn_code: true,
                            first_name: true,
                            last_name: true,
                        },
                    },
                    transaction_item: {
                        include: {
                            product: { select: { product_name: true } },
                            course: { select: { course_name: true } },
                        },
                    },
                    payment_log: true,
                },
                skip,
                take: limit,
                orderBy: { transaction_date: 'desc' },
            }),
            prisma.transaction_header.count({ where }),
        ])

        return NextResponse.json({
            data: transactions,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        })
    } catch (error) {
        console.error('Error fetching transactions:', error)
        return NextResponse.json(
            { error: 'Failed to fetch transactions' },
            { status: 500 }
        )
    }
}

// POST /api/transactions - Create new transaction (existing)
export async function POST(request: NextRequest) {
    try {
        const staff = getStaffFromRequest(request)
        if (!staff) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { customer_id, discount, items } = body

        if (!customer_id || !items || items.length === 0) {
            return NextResponse.json({ error: 'Invalid data' }, { status: 400 })
        }

        // Calculate totals
        const totalAmount = items.reduce((sum: number, item: { subtotal: number }) => sum + item.subtotal, 0)
        const netAmount = totalAmount - (discount || 0)

        const transaction = await prisma.transaction_header.create({
            data: {
                customer_id,
                staff_id: staff.staff_id,
                total_amount: totalAmount,
                discount: discount || 0,
                net_amount: netAmount,
                remaining_balance: netAmount,
                payment_status: 'UNPAID',
                transaction_item: {
                    create: items.map((item: { product_id?: number; course_id?: number; qty: number; unit_price: number; subtotal: number }) => ({
                        product_id: item.product_id || null,
                        course_id: item.course_id || null,
                        qty: item.qty,
                        unit_price: item.unit_price,
                        subtotal: item.subtotal,
                    })),
                },
            },
        })

        return NextResponse.json(transaction, { status: 201 })
    } catch (error) {
        console.error('Error creating transaction:', error)
        return NextResponse.json(
            { error: 'Failed to create transaction' },
            { status: 500 }
        )
    }
}
