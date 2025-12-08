import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

interface Params {
    params: Promise<{ id: string }>
}

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

// GET /api/transactions/[id] - Get single transaction detail
export async function GET(request: NextRequest, { params }: Params) {
    try {
        const { id } = await params
        const transactionId = parseInt(id)

        const transaction = await prisma.transaction_header.findUnique({
            where: { transaction_id: transactionId },
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
                transaction_item: {
                    include: {
                        product: { select: { product_name: true, category: true } },
                        course: { select: { course_name: true } },
                    },
                },
                payment_log: true,
            },
        })

        if (!transaction) {
            return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
        }

        return NextResponse.json(transaction)
    } catch (error) {
        console.error('Error fetching transaction:', error)
        return NextResponse.json(
            { error: 'Failed to fetch transaction' },
            { status: 500 }
        )
    }
}

// DELETE /api/transactions/[id] - Void/Cancel transaction (Admin only)
export async function DELETE(request: NextRequest, { params }: Params) {
    try {
        const staff = getStaffFromRequest(request)
        if (!staff) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Check if admin
        if (staff.position !== 'Admin') {
            return NextResponse.json({ error: 'Admin only' }, { status: 403 })
        }

        const { id } = await params
        const transactionId = parseInt(id)

        // Update transaction status to CANCELLED
        const transaction = await prisma.transaction_header.update({
            where: { transaction_id: transactionId },
            data: {
                payment_status: 'VOIDED',
            },
        })

        return NextResponse.json({ success: true, transaction })
    } catch (error) {
        console.error('Error voiding transaction:', error)
        return NextResponse.json(
            { error: 'Failed to void transaction' },
            { status: 500 }
        )
    }
}
