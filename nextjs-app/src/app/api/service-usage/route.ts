import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

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
        const body = await request.json()
        const {
            customer_id,
            customer_course_id,
            service_name,
            doctor_id,
            therapist_id,
            doctor_fee,
            therapist_fee,
            products_used,
            note,
        } = body

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

        // Create service usage with related records in a transaction
        const result = await prisma.$transaction(async (tx) => {
            // 1. Create service_usage
            const serviceUsage = await tx.service_usage.create({
                data: {
                    customer_id,
                    customer_course_id: customer_course_id || null,
                    doctor_id: doctor_id || null,
                    therapist_id: therapist_id || null,
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
                        status: newRemaining === 0 ? 'COMPLETED' as const : 'ACTIVE' as const,
                    },
                })
            }

            // 3. Create fee_log for doctor if provided
            if (doctor_id && doctor_fee && doctor_fee > 0) {
                await tx.fee_log.create({
                    data: {
                        usage_id: serviceUsage.usage_id,
                        staff_id: doctor_id,
                        fee_type: 'DF',
                        amount: doctor_fee,
                    },
                })
            }

            // 4. Create fee_log for therapist if provided
            if (therapist_id && therapist_fee && therapist_fee > 0) {
                await tx.fee_log.create({
                    data: {
                        usage_id: serviceUsage.usage_id,
                        staff_id: therapist_id,
                        fee_type: 'HAND_FEE',
                        amount: therapist_fee,
                    },
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

        // Calculate session number (which session this was)
        let session_number = null
        let total_sessions = null
        if (completeUsage?.customer_course) {
            total_sessions = completeUsage.customer_course.total_sessions
            // Session number = total - remaining (after deduction)
            session_number = total_sessions - completeUsage.customer_course.remaining_sessions
        }

        return NextResponse.json({
            ...completeUsage,
            session_number,
            total_sessions,
        }, { status: 201 })
    } catch (error) {
        console.error('Error creating service usage:', error)
        return NextResponse.json(
            { error: 'Failed to create service usage' },
            { status: 500 }
        )
    }
}
