import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

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
