import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logAudit } from '@/lib/audit'

interface Params {
    params: Promise<{ id: string }>
}

// POST /api/customers/[id]/courses/refund - Refund a patient's course to deposit
export async function POST(
    request: NextRequest,
    { params }: Params
) {
    try {
        const { id } = await params
        const customerId = parseInt(id)
        if (isNaN(customerId)) {
            return NextResponse.json(
                { error: 'Invalid customer ID' },
                { status: 400 }
            )
        }

        const body = await request.json()
        const { customer_course_id, refund_amount, note, created_by } = body

        if (!customer_course_id || refund_amount === undefined || refund_amount < 0) {
            return NextResponse.json(
                { error: 'customer_course_id and a valid refund_amount are required' },
                { status: 400 }
            )
        }

        // 1. Fetch customer course and verify ownership
        const customerCourse = await prisma.customer_course.findFirst({
            where: {
                id: customer_course_id,
                customer_id: customerId,
            },
            include: {
                course: true,
            },
        })

        if (!customerCourse) {
            return NextResponse.json(
                { error: 'Customer course not found or does not belong to this patient' },
                { status: 404 }
            )
        }

        if (customerCourse.remaining_sessions <= 0) {
            return NextResponse.json(
                { error: 'This course has no remaining sessions to refund' },
                { status: 400 }
            )
        }

        // 2. Perform the database changes in a transaction
        const depositResult = await prisma.$transaction(async (tx) => {
            // A. Update the customer course
            await tx.customer_course.update({
                where: { id: customer_course_id },
                data: {
                    remaining_sessions: 0,
                    status: 'USED_UP',
                },
            })

            // B. Fetch the latest deposit balance
            const latestDeposit = await tx.customer_deposit.findFirst({
                where: { customer_id: customerId },
                orderBy: { created_at: 'desc' },
            })

            const currentBalance = latestDeposit ? Number(latestDeposit.balance_after) : 0
            const newBalance = currentBalance + Number(refund_amount)

            // C. Create the deposit entry
            const depositEntry = await tx.customer_deposit.create({
                data: {
                    customer_id: customerId,
                    amount: refund_amount,
                    type: 'ADD', // Add to balance
                    balance_after: newBalance,
                    note: note || `คืนเงินคอร์ส ${customerCourse.course.course_name} คงเหลือ ${customerCourse.remaining_sessions} ครั้ง`,
                    created_by: created_by || null,
                },
            })

            return {
                deposit: depositEntry,
                previous_balance: currentBalance,
                new_balance: newBalance,
            }
        })

        // 3. Log Audit
        await logAudit({
            action: 'UPDATE',
            target_resource: `CustomerCourseRefund_${customer_course_id}`,
            request,
            details: {
                customer_id: customerId,
                customer_course_id,
                course_name: customerCourse.course.course_name,
                remaining_sessions: customerCourse.remaining_sessions,
                refund_amount,
                previous_balance: depositResult.previous_balance,
                new_balance: depositResult.new_balance,
                created_by,
            },
        })

        return NextResponse.json({
            success: true,
            refund_amount,
            new_balance: depositResult.new_balance,
            message: 'Course refunded to deposit successfully',
        }, { status: 200 })

    } catch (error) {
        console.error('Error refunding course to deposit:', error)
        return NextResponse.json(
            { error: 'Failed to refund course to deposit' },
            { status: 500 }
        )
    }
}
