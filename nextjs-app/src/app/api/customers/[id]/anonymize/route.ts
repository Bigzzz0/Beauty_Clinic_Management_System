import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

interface Params {
    params: Promise<{ id: string }>
}

// POST /api/customers/[id]/anonymize - Anonymize customer data (Right to be Forgotten)
export async function POST(request: NextRequest, { params }: Params) {
    try {
        const { id } = await params
        const customerId = parseInt(id)

        const customer = await prisma.customer.findUnique({
            where: { customer_id: customerId }
        })

        if (!customer) {
            return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
        }

        // Generate a random string to ensure uniqueness for required fields like hn_code if needed
        const randomHash = Math.random().toString(36).substring(2, 8).toUpperCase()

        // Anonymize the data
        const anonymizedCustomer = await prisma.customer.update({
            where: { customer_id: customerId },
            data: {
                first_name: `Anonymized_${randomHash}`,
                last_name: 'Customer',
                nickname: null,
                phone_number: '000-000-0000',
                address: 'Data removed requested by user',
                birth_date: null,
                drug_allergy: 'Data removed',
                underlying_disease: 'Data removed',
                member_level: null,
                is_active: false // Soft delete essentially
            }
        })

        // We can also flip marketing consent to false
        await prisma.customer_consent.create({
            data: {
                customer_id: customerId,
                consent_type: 'MARKETING',
                is_granted: false,
                version: 'ANONYMIZED',
                ip_address: request.headers.get('x-forwarded-for') || request.headers.get('remote-addr') || 'unknown'
            }
        })

        // Also update all gallery pictures to NOT allow marketing
        await prisma.patient_gallery.updateMany({
            where: { customer_id: customerId },
            data: {
                is_marketing_allowed: false
            }
        })

        // Redact personal info from audit logs associated with this customer
        await prisma.audit_log.updateMany({
            where: {
                OR: [
                    { target_resource: `Customer_${customerId}` },
                    { target_resource: `CustomerDeposit_${customerId}` }
                ]
            },
            data: {
                details: JSON.stringify({ anonymized: true, original_data: "Purged due to Right to be Forgotten" })
            }
        })

        return NextResponse.json({ message: 'Customer data successfully anonymized', customer: anonymizedCustomer })

    } catch (error: unknown) {
        console.error('Error anonymizing customer data:', error)
        return NextResponse.json(
            { error: (error as Error)?.message || 'Failed to anonymize data' },
            { status: 500 }
        )
    }
}
