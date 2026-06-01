import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { shouldMask, maskPhoneNumber, maskIdCard } from '@/lib/masking'
import { logAudit } from '@/lib/audit'
import { encryptData, decryptData } from '@/lib/encryption'
import jwt from 'jsonwebtoken'

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
    consent_pdpa: z.boolean().optional(),
    consent_marketing: z.boolean().optional(),
})
interface Params {
    params: Promise<{ id: string }>
}

// GET /api/customers/[id] - Get full customer details
export async function GET(request: NextRequest, { params }: Params) {
    try {
        let userRole = 'General'
        let staffId: number | undefined = undefined
        const authHeader = request.headers.get('authorization')
        if (authHeader?.startsWith('Bearer ')) {
            const token = authHeader.substring(7)
            try {
                if (!process.env.JWT_SECRET) {
                    throw new Error('JWT_SECRET is not configured')
                }
                const decoded = jwt.verify(token, process.env.JWT_SECRET) as { position?: string; role?: string; staff_id?: number; id?: number }
                userRole = decoded.position || decoded.role || 'General'
                staffId = decoded.staff_id || decoded.id
            } catch (err) {
                console.error('JWT verification failed:', err)
            }
        }
        const applyMask = shouldMask(userRole)

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
                customer_consent: true, // PDPA Consent log
            },
        })

        if (!customer) {
            return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
        }

        // Calculate total debt
        const totalDebt = customer.transaction_header.reduce(
            (sum: number, t: { remaining_balance: any }) => sum + Number(t.remaining_balance || 0),
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

        // Decrypt the raw ID Card Number first before applying any masking rules
        let rawIdCard = customer.id_card_number
        if (rawIdCard && rawIdCard.includes(':')) {
            rawIdCard = decryptData(rawIdCard)
        }

        const returnCustomer = {
            ...customer,
            phone_number: applyMask ? maskPhoneNumber(customer.phone_number) : customer.phone_number,
            id_card_number: applyMask && rawIdCard ? maskIdCard(rawIdCard) : rawIdCard,
            drug_allergy: applyMask && customer.drug_allergy ? '***ข้อมูลปกปิด***' : customer.drug_allergy,
            underlying_disease: applyMask && customer.underlying_disease ? '***ข้อมูลปกปิด***' : customer.underlying_disease,
            total_debt: totalDebt,
            age,
        }

        // Write Audit Log
        await logAudit({
            action: 'READ',
            target_resource: `Customer_${customerId}`,
            request,
            staffId
        })

        return NextResponse.json(returnCustomer)
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
                id_card_number: body.id_card_number ? encryptData(body.id_card_number) : undefined,
                address: body.address,
                birth_date: body.birth_date ? new Date(body.birth_date) : undefined,
                drug_allergy: body.drug_allergy,
                underlying_disease: body.underlying_disease,
                member_level: body.member_level,
            },
        })

        if (body.consent_pdpa !== undefined) {
            const exist = await prisma.customer_consent.findFirst({
                where: { customer_id: customerId, consent_type: 'PDPA_PRIVACY'}
            });
            if (exist) {
                await prisma.customer_consent.update({
                    where: { id: exist.id },
                    data: { is_granted: body.consent_pdpa }
                });
            } else {
                await prisma.customer_consent.create({
                    data: { customer_id: customerId, consent_type: 'PDPA_PRIVACY', is_granted: body.consent_pdpa, version: 'v1.0' }
                });
            }
        }

        if (body.consent_marketing !== undefined) {
            const exist = await prisma.customer_consent.findFirst({
                where: { customer_id: customerId, consent_type: 'MARKETING'}
            });
            if (exist) {
                await prisma.customer_consent.update({
                    where: { id: exist.id },
                    data: { is_granted: body.consent_marketing }
                });
            } else {
                await prisma.customer_consent.create({
                    data: { customer_id: customerId, consent_type: 'MARKETING', is_granted: body.consent_marketing, version: 'v1.0' }
                });
            }
        }

        return NextResponse.json(customer)
    } catch (error: unknown) {
        console.error('Error updating customer:', error)
        return NextResponse.json(
            { error: (error as Error)?.message || 'Failed to update customer' },
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

        await prisma.customer.update({
            where: { customer_id: customerId },
            data: { is_active: false }
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
