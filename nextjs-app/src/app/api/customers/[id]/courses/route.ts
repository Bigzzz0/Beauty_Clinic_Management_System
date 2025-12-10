import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

interface Params {
    params: Promise<{ id: string }>
}

// GET /api/customers/[id]/courses - Get customer's purchased courses
export async function GET(
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

        const { searchParams } = new URL(request.url)
        const status = searchParams.get('status') // ACTIVE, COMPLETED, EXPIRED

        const where: Record<string, unknown> = {
            customer_id: customerId,
        }

        if (status) {
            where.status = status
        }

        const courses = await prisma.customer_course.findMany({
            where,
            include: {
                course: {
                    select: {
                        course_id: true,
                        course_code: true,
                        course_name: true,
                        session_count: true,
                        standard_price: true,
                    },
                },
                service_usage: {
                    select: {
                        usage_id: true,
                        service_date: true,
                        service_name: true,
                    },
                    orderBy: { service_date: 'desc' },
                },
            },
            orderBy: { purchase_date: 'desc' },
        })

        // Add calculated fields
        const enrichedCourses = courses.map((cc) => ({
            ...cc,
            usage_count: cc.service_usage.length,
            is_expired: cc.expiry_date ? new Date(cc.expiry_date) < new Date() : false,
        }))

        return NextResponse.json(enrichedCourses)
    } catch (error) {
        console.error('Error fetching customer courses:', error)
        return NextResponse.json(
            { error: 'Failed to fetch customer courses' },
            { status: 500 }
        )
    }
}

// POST /api/customers/[id]/courses - Add a course to customer (usually from POS)
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
        const { course_id, transaction_id, expiry_months } = body

        if (!course_id || !transaction_id) {
            return NextResponse.json(
                { error: 'Course ID and Transaction ID are required' },
                { status: 400 }
            )
        }

        // Get course details
        const course = await prisma.course.findUnique({
            where: { course_id },
        })

        if (!course) {
            return NextResponse.json(
                { error: 'Course not found' },
                { status: 404 }
            )
        }

        // Calculate expiry date (default 12 months)
        const expiryDate = new Date()
        expiryDate.setMonth(expiryDate.getMonth() + (expiry_months || 12))

        // Create customer_course
        const customerCourse = await prisma.customer_course.create({
            data: {
                customer_id: customerId,
                course_id,
                transaction_id,
                total_sessions: course.session_count,
                remaining_sessions: course.session_count,
                purchase_date: new Date(),
                expiry_date: expiryDate,
                status: 'ACTIVE',
            },
            include: {
                course: true,
            },
        })

        return NextResponse.json(customerCourse, { status: 201 })
    } catch (error) {
        console.error('Error creating customer course:', error)
        return NextResponse.json(
            { error: 'Failed to create customer course' },
            { status: 500 }
        )
    }
}
