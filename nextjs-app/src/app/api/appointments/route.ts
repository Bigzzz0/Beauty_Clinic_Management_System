import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const appointmentSchema = z.object({
    customer_id: z.number().int().positive(),
    customer_course_id: z.number().int().positive().nullable().optional(),
    appointment_date: z.preprocess((arg) => {
        if (typeof arg == "string" || arg instanceof Date) return new Date(arg);
    }, z.date()),
    duration_minutes: z.number().int().positive().default(60),
    doctor_id: z.number().int().positive().nullable().optional(),
    therapist_id: z.number().int().positive().nullable().optional(),
    notes: z.string().nullable().optional().or(z.literal(''))
})

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const dateStr = searchParams.get('date')
        const view = searchParams.get('view') || 'day'

        let dateFilter = {}
        if (dateStr) {
            const date = new Date(dateStr)
            let startOfRange = new Date(date)
            let endOfRange = new Date(date)

            if (view === 'month') {
                startOfRange.setDate(1)
                startOfRange.setHours(0, 0, 0, 0)

                endOfRange.setMonth(startOfRange.getMonth() + 1)
                endOfRange.setDate(0)
                endOfRange.setHours(23, 59, 59, 999)
            } else if (view === 'week') {
                // start of week (Sunday)
                const day = startOfRange.getDay()
                startOfRange.setDate(startOfRange.getDate() - day)
                startOfRange.setHours(0, 0, 0, 0)

                endOfRange = new Date(startOfRange)
                endOfRange.setDate(startOfRange.getDate() + 6)
                endOfRange.setHours(23, 59, 59, 999)
            } else {
                // day view
                startOfRange.setHours(0, 0, 0, 0)
                endOfRange.setHours(23, 59, 59, 999)
            }

            dateFilter = {
                appointment_date: {
                    gte: startOfRange,
                    lte: endOfRange
                }
            }
        }

        // @ts-ignore
        const appointments = await prisma.appointment.findMany({
            where: {
                ...dateFilter
            },
            include: {
                customer: {
                    select: {
                        customer_id: true,
                        first_name: true,
                        last_name: true,
                        hn_code: true,
                        phone_number: true
                    }
                },
                customer_course: {
                    include: {
                        course: {
                            select: {
                                course_name: true
                            }
                        }
                    }
                }
            },
            orderBy: {
                appointment_date: 'asc'
            }
        })

        // Fetch all staff to stitch relation manually
        const staffList = await prisma.staff.findMany({
            select: { staff_id: true, full_name: true, position: true }
        })

        const mappedAppointments = appointments.map((app: any) => ({
            ...app,
            doctor: app.doctor_id ? staffList.find(s => s.staff_id === app.doctor_id) || null : null,
            therapist: app.therapist_id ? staffList.find(s => s.staff_id === app.therapist_id) || null : null,
        }))

        return NextResponse.json({ appointments: mappedAppointments })
    } catch (error: any) {
        console.error('Fetch appointments error:', error)
        return NextResponse.json(
            { error: 'Failed to fetch appointments' },
            { status: 500 }
        )
    }
}

export async function POST(request: Request) {
    try {
        const json = await request.json()
        const body = appointmentSchema.parse(json)

        // @ts-ignore
        const newAppointment = await prisma.appointment.create({
            data: {
                customer_id: body.customer_id,
                customer_course_id: body.customer_course_id,
                appointment_date: body.appointment_date,
                duration_minutes: body.duration_minutes,
                doctor_id: body.doctor_id,
                therapist_id: body.therapist_id,
                notes: body.notes,
                status: 'SCHEDULED'
            }
        })

        return NextResponse.json({ appointment: newAppointment }, { status: 201 })
    } catch (error: any) {
        console.error('Create appointment error:', error)
        if (error instanceof z.ZodError) {
            console.error('Zod Validation Issues:', JSON.stringify(error.issues, null, 2))
            return NextResponse.json({ error: error.issues }, { status: 400 })
        }
        return NextResponse.json(
            { error: 'Failed to create appointment' },
            { status: 500 }
        )
    }
}
