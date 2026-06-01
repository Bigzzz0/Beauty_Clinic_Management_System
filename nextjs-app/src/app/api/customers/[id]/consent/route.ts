import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const consentSchema = z.object({
    consent_type: z.enum(['PDPA_PRIVACY', 'MARKETING', 'MEDICAL_TREATMENT']),
    is_granted: z.boolean(),
    version: z.string()
})

interface Params {
    params: Promise<{ id: string }>
}

// POST /api/customers/[id]/consent - Toggle a consent setting
export async function POST(request: NextRequest, { params }: Params) {
    try {
        const { id } = await params
        const customerId = parseInt(id)
        const body = await request.json()

        const parseResult = consentSchema.safeParse(body)
        if (!parseResult.success) {
            return NextResponse.json(
                { error: parseResult.error.issues[0].message },
                { status: 400 }
            )
        }

        const ip_address = request.headers.get('x-forwarded-for') || request.headers.get('remote-addr') || 'unknown'

        // we just push a new record of consent history mapping the latest preference
        const newConsent = await prisma.customer_consent.create({
            data: {
                customer_id: customerId,
                consent_type: parseResult.data.consent_type,
                is_granted: parseResult.data.is_granted,
                version: parseResult.data.version,
                ip_address
            }
        })

        return NextResponse.json(newConsent)
    } catch (error: any) {
        console.error('Error adding consent:', error)
        return NextResponse.json(
            { error: error?.message || 'Failed to update consent' },
            { status: 500 }
        )
    }
}
