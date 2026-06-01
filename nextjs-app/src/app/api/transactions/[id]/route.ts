import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authenticateStaffRequest } from '@/lib/staff-auth'

interface Params {
    params: Promise<{ id: string }>
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
        const authResult = await authenticateStaffRequest(request)
        if (!authResult.ok) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status })
        }
        const staff = authResult.staff

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
