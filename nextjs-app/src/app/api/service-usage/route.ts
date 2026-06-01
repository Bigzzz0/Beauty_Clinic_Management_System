import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { logAudit } from '@/lib/audit'

const AUTO_FEE_TYPES = ['DF', 'HAND_FEE'] as const

function resolveFeeAmount(
    rates: Array<{ fee_type: string | null; position_type: string | null; rate_amount: unknown }>,
    feeType: 'DF' | 'HAND_FEE',
    preferredPosition: 'Doctor' | 'Therapist'
): number | null {
    const candidateRates = rates.filter((rate) => rate.fee_type === feeType)

    const exactByPosition = candidateRates.find((rate) => rate.position_type === preferredPosition)
    if (exactByPosition) {
        return Number(exactByPosition.rate_amount)
    }

    const fallbackAllPositions = candidateRates.find((rate) => rate.position_type === null)
    if (fallbackAllPositions) {
        return Number(fallbackAllPositions.rate_amount)
    }

    return candidateRates.length > 0 ? Number(candidateRates[0].rate_amount) : null
}

// Validation schema for service-usage POST
const ProductUsedSchema = z.object({
    product_id: z.number().int().positive(),
    qty_used: z.number().positive(),
    lot_number: z.string().optional().nullable(),
})

const StaffIdsSchema = z.array(z.number().int().positive()).optional().nullable()

const ServiceUsageSchema = z.object({
    customer_id: z.number().int().positive({ message: 'customer_id is required' }),
    customer_course_id: z.number().int().positive().optional().nullable(),
    service_name: z.string().min(1).optional(),
    doctor_id: z.number().int().positive().optional().nullable(),
    therapist_id: z.number().int().positive().optional().nullable(),
    doctor_ids: StaffIdsSchema,
    therapist_ids: StaffIdsSchema,
    doctor_fee: z.number().nonnegative().optional().nullable(),
    therapist_fee: z.number().nonnegative().optional().nullable(),
    products_used: z.array(ProductUsedSchema).optional().nullable(),
    note: z.string().optional().nullable(),
})

// GET /api/service-usage - List service usage records
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const customerId = searchParams.get('customerId')
        const limit = parseInt(searchParams.get('limit') || '50')

        const where: Record<string, unknown> = {}
        if (customerId) {
            where.customer_id = parseInt(customerId)
        }

        const usages = await prisma.service_usage.findMany({
            where,
            include: {
                customer: {
                    select: {
                        customer_id: true,
                        hn_code: true,
                        full_name: true,
                    },
                },
                customer_course: {
                    include: {
                        course: {
                            select: {
                                course_name: true,
                                session_count: true,
                            },
                        },
                    },
                },
                fee_log: {
                    include: {
                        staff: {
                            select: {
                                staff_id: true,
                                full_name: true,
                                position: true,
                            },
                        },
                    },
                },
                inventory_usage: {
                    include: {
                        product: {
                            select: {
                                product_id: true,
                                product_name: true,
                            },
                        },
                    },
                },
            },
            orderBy: { service_date: 'desc' },
            take: limit,
        })

        return NextResponse.json(usages)
    } catch (error) {
        console.error('Error fetching service usage:', error)
        return NextResponse.json(
            { error: 'Failed to fetch service usage' },
            { status: 500 }
        )
    }
}

// POST /api/service-usage - Record a service session
export async function POST(request: NextRequest) {
    try {
        const rawBody = await request.json()

        // Validate request body with Zod
        const parseResult = ServiceUsageSchema.safeParse(rawBody)
        if (!parseResult.success) {
            return NextResponse.json(
                { error: 'Validation failed', details: parseResult.error.issues },
                { status: 400 }
            )
        }

        const {
            customer_id,
            customer_course_id,
            service_name,
            doctor_id,
            therapist_id,
            doctor_ids,
            therapist_ids,
            doctor_fee,
            therapist_fee,
            products_used,
            note,
        } = parseResult.data

        const normalizedDoctorIds = Array.from(new Set([
            ...(doctor_id ? [doctor_id] : []),
            ...((doctor_ids || []).filter((id) => !!id)),
        ]))

        const normalizedTherapistIds = Array.from(new Set([
            ...(therapist_id ? [therapist_id] : []),
            ...((therapist_ids || []).filter((id) => !!id)),
        ]))

        if (!customer_id) {
            return NextResponse.json(
                { error: 'Customer ID is required' },
                { status: 400 }
            )
        }

        // If using a course, verify it has remaining sessions
        let customerCourse = null
        if (customer_course_id) {
            customerCourse = await prisma.customer_course.findUnique({
                where: { id: customer_course_id },
                include: { course: true },
            })

            if (!customerCourse) {
                return NextResponse.json(
                    { error: 'Customer course not found' },
                    { status: 404 }
                )
            }

            if (customerCourse.remaining_sessions <= 0) {
                return NextResponse.json(
                    { error: 'No remaining sessions in this course' },
                    { status: 400 }
                )
            }

            if (customerCourse.status !== 'ACTIVE') {
                return NextResponse.json(
                    { error: 'This course is not active' },
                    { status: 400 }
                )
            }
        }

        let autoDoctorFee: number | null = null
        let autoTherapistFee: number | null = null
        if (customerCourse?.course_id) {
            const linkedRates = await prisma.commission_rate.findMany({
                where: {
                    is_active: true,
                    course_id: customerCourse.course_id,
                    fee_type: {
                        in: [...AUTO_FEE_TYPES],
                    },
                },
                select: {
                    fee_type: true,
                    position_type: true,
                    rate_amount: true,
                },
            })

            autoDoctorFee = resolveFeeAmount(linkedRates, 'DF', 'Doctor')
            autoTherapistFee = resolveFeeAmount(linkedRates, 'HAND_FEE', 'Therapist')
        }

        const resolvedDoctorFee = autoDoctorFee ?? doctor_fee ?? 0
        const resolvedTherapistFee = autoTherapistFee ?? therapist_fee ?? 0
        const doctorFeeSource = autoDoctorFee !== null ? 'COURSE_RATE' : (doctor_fee ? 'MANUAL' : 'NONE')
        const therapistFeeSource = autoTherapistFee !== null ? 'COURSE_RATE' : (therapist_fee ? 'MANUAL' : 'NONE')

        // Create service usage with related records in a transaction
        const result = await prisma.$transaction(async (tx) => {
            // 1. Create service_usage
            const serviceUsage = await tx.service_usage.create({
                data: {
                    customer_id,
                    customer_course_id: customer_course_id || null,
                    doctor_id: normalizedDoctorIds[0] || null,
                    therapist_id: normalizedTherapistIds[0] || null,
                    service_name: service_name || customerCourse?.course?.course_name || 'Service',
                    note: note || null,
                },
            })

            // 2. Decrease remaining_sessions if using a course
            if (customer_course_id && customerCourse) {
                const newRemaining = customerCourse.remaining_sessions - 1
                await tx.customer_course.update({
                    where: { id: customer_course_id },
                    data: {
                        remaining_sessions: newRemaining,
                        status: newRemaining === 0 ? 'USED_UP' as const : 'ACTIVE' as const,
                    },
                })
            }

            // 3. Create fee_log for all selected doctors
            if (normalizedDoctorIds.length > 0 && resolvedDoctorFee > 0) {
                await tx.fee_log.createMany({
                    data: normalizedDoctorIds.map((staffId) => ({
                        usage_id: serviceUsage.usage_id,
                        staff_id: staffId,
                        fee_type: 'DF',
                        amount: resolvedDoctorFee,
                    })),
                })
            }

            // 4. Create fee_log for all selected assistants
            if (normalizedTherapistIds.length > 0 && resolvedTherapistFee > 0) {
                await tx.fee_log.createMany({
                    data: normalizedTherapistIds.map((staffId) => ({
                        usage_id: serviceUsage.usage_id,
                        staff_id: staffId,
                        fee_type: 'HAND_FEE',
                        amount: resolvedTherapistFee,
                    })),
                })
            }

            // 5. Create inventory_usage and deduct stock for each product
            if (products_used && Array.isArray(products_used)) {
                for (const item of products_used) {
                    const { product_id, qty_used, lot_number } = item

                    // Create inventory_usage record
                    await tx.inventory_usage.create({
                        data: {
                            usage_id: serviceUsage.usage_id,
                            product_id,
                            qty_used,
                            lot_number: lot_number || null,
                        },
                    })

                    // Deduct from inventory
                    await tx.inventory.updateMany({
                        where: { product_id },
                        data: {
                            opened_qty: { decrement: qty_used },
                        },
                    })
                }
            }

            return serviceUsage
        })

        // Fetch the complete record with updated customer_course
        const completeUsage = await prisma.service_usage.findUnique({
            where: { usage_id: result.usage_id },
            include: {
                customer: {
                    select: { full_name: true, hn_code: true },
                },
                customer_course: {
                    include: {
                        course: { select: { course_name: true, session_count: true } },
                    },
                },
                fee_log: {
                    include: {
                        staff: { select: { full_name: true, position: true } },
                    },
                },
                inventory_usage: {
                    include: {
                        product: { select: { product_name: true } },
                    },
                },
            },
        })

        if (!completeUsage) {
            throw new Error('Failed to retrieve newly created service usage record')
        }

        // Calculate session number (which session this was)
        let session_number = null
        let total_sessions = null
        if (completeUsage?.customer_course) {
            total_sessions = completeUsage.customer_course.total_sessions
            // Session number = total - remaining (after deduction)
            session_number = total_sessions - completeUsage.customer_course.remaining_sessions
        }

        // Audit Log
        await logAudit({
            action: 'CREATE',
            target_resource: `ServiceUsage_${completeUsage.usage_id}`,
            details: {
                customer_id: completeUsage.customer_id,
                service_name: completeUsage.service_name,
                session_number,
                doctor_fee_source: doctorFeeSource,
                therapist_fee_source: therapistFeeSource,
            },
            request
        });

        return NextResponse.json({
            ...completeUsage,
            session_number,
            total_sessions,
            fee_source: {
                doctor: doctorFeeSource,
                therapist: therapistFeeSource,
            },
            auto_fee: {
                doctor: resolvedDoctorFee,
                therapist: resolvedTherapistFee,
            },
        }, { status: 201 })
    } catch (error) {
        console.error('Error creating service usage:', error)
        return NextResponse.json(
            { error: 'Failed to create service usage' },
            { status: 500 }
        )
    }
}
