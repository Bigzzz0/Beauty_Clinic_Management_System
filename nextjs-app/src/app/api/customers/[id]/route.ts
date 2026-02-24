import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateCustomerSchema = z.object({
    first_name: z.string().min(1, 'ต้องระบุชื่อจริง').max(50, 'ชื่อจริงต้องไม่เกิน 50 ตัวอักษร').optional(),
    last_name: z.string().min(1, 'ต้องระบุนามสกุล').max(50, 'นามสกุลต้องไม่เกิน 50 ตัวอักษร').optional(),
    nickname: z.string().nullable().optional(),
    phone_number: z.string().min(1, 'ต้องระบุเบอร์โทรศัพท์').optional(),
    address: z.string().nullable().optional(),
    birth_date: z.union([z.string(), z.date()]).nullable().optional(),
    drug_allergy: z.string().nullable().optional(),
    underlying_disease: z.string().nullable().optional(),
    member_level: z.string().nullable().optional(),
})
interface Params {
    params: Promise<{ id: string }>
}

// GET /api/customers/[id] - Get full customer details
export async function GET(request: NextRequest, { params }: Params) {
    try {
        const { id } = await params
        const customerId = parseInt(id)

        const customer = await prisma.customer.findUnique({
            where: { customer_id: customerId },
            include: {
                transaction_header: {
                    select: {
                        transaction_id: true,
                        transaction_date: true,
                        net_amount: true,
                        remaining_balance: true,
                        payment_status: true,
                    },
                    orderBy: { transaction_date: 'desc' },
                },
                customer_course: {
                    include: {
                        course: true,
                    },
                },
            },
        })

        if (!customer) {
            return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
        }

        // Calculate total debt
        const totalDebt = customer.transaction_header.reduce(
            (sum, t) => sum + Number(t.remaining_balance || 0),
            0
        )

        // Calculate age from birth_date
        let age: number | null = null
        if (customer.birth_date) {
            const today = new Date()
            const birthDate = new Date(customer.birth_date)
            age = today.getFullYear() - birthDate.getFullYear()
            const monthDiff = today.getMonth() - birthDate.getMonth()
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                age--
            }
        }

        return NextResponse.json({
            ...customer,
            total_debt: totalDebt,
            age,
        })
    } catch (error) {
        console.error('Error fetching customer:', error)
        return NextResponse.json(
            { error: 'Failed to fetch customer' },
            { status: 500 }
        )
    }
}

// PUT /api/customers/[id] - Update customer
export async function PUT(request: NextRequest, { params }: Params) {
    try {
        const { id } = await params
        const customerId = parseInt(id)
        const body = await request.json()

        const parseResult = updateCustomerSchema.safeParse(body)
        if (!parseResult.success) {
            return NextResponse.json(
                { error: parseResult.error.issues[0].message },
                { status: 400 }
            )
        }

        const customer = await prisma.customer.update({
            where: { customer_id: customerId },
            data: {
                first_name: body.first_name,
                last_name: body.last_name,
                nickname: body.nickname,
                phone_number: body.phone_number,
                address: body.address,
                birth_date: body.birth_date ? new Date(body.birth_date) : undefined,
                drug_allergy: body.drug_allergy,
                underlying_disease: body.underlying_disease,
                member_level: body.member_level,
            },
        })

        return NextResponse.json(customer)
    } catch (error: any) {
        console.error('Error updating customer:', error)
        return NextResponse.json(
            { error: error?.message || 'Failed to update customer' },
            { status: 500 }
        )
    }
}

// DELETE /api/customers/[id] - Delete customer
export async function DELETE(request: NextRequest, { params }: Params) {
    try {
        const { id } = await params
        const customerId = parseInt(id)

        // Check if customer exists
        const customer = await prisma.customer.findUnique({
            where: { customer_id: customerId },
        })

        if (!customer) {
            return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
        }

        // Proceed to delete (Prisma cascading might handle related records, or we check relations)
        // If we want to allow deleting customers with transactions, we need to ensure onDelete Cascade is set
        // Or we block deletion if they have transactions.
        const transactions = await prisma.transaction_header.count({
            where: { customer_id: customerId }
        })

        if (transactions > 0) {
            return NextResponse.json(
                { error: 'ไม่สามารถลบข้อมูลลูกค้าได้ เนื่องจากมีประวัติการทำรายการในระบบ' },
                { status: 400 }
            )
        }

        await prisma.customer.delete({
            where: { customer_id: customerId },
        })

        return NextResponse.json({ message: 'Customer deleted successfully' })
    } catch (error: any) {
        console.error('Error deleting customer:', error)
        return NextResponse.json(
            { error: error?.message || 'Failed to delete customer' },
            { status: 500 }
        )
    }
}
