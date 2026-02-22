import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateSchema = z.object({
    status: z.enum(['SCHEDULED', 'COMPLETED', 'CANCELLED', 'NO_SHOW']).optional(),
    appointment_date: z.string().datetime().optional(),
    duration_minutes: z.number().int().positive().optional(),
    doctor_id: z.number().int().positive().nullable().optional(),
    therapist_id: z.number().int().positive().nullable().optional(),
    notes: z.string().nullable().optional()
})

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: paramId } = await params
        const id = parseInt(paramId)
        if (isNaN(id)) {
            return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })
        }

        const json = await request.json()
        const body = updateSchema.parse(json)

        // @ts-ignore
        const updated = await prisma.appointment.update({
            where: { id },
            data: body
        })

        return NextResponse.json({ appointment: updated })
    } catch (error: any) {
        console.error('Update appointment error:', error)
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.issues }, { status: 400 })
        }
        return NextResponse.json(
            { error: 'Failed to update appointment' },
            { status: 500 }
        )
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: paramId } = await params
        const id = parseInt(paramId)
        if (isNaN(id)) {
            return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })
        }

        // @ts-ignore
        await prisma.appointment.delete({
            where: { id }
        })

        return NextResponse.json({ success: true })
    } catch (error: any) {
        console.error('Delete appointment error:', error)
        return NextResponse.json(
            { error: 'Failed to delete appointment' },
            { status: 500 }
        )
    }
}
