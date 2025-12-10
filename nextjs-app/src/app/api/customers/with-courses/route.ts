import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/customers/with-courses - Get customers with active courses
export async function GET() {
    try {
        // Find all customer_courses with remaining_sessions > 0
        const activeCourses = await prisma.customer_course.findMany({
            where: {
                remaining_sessions: { gt: 0 },
                status: 'ACTIVE',
            },
            include: {
                customer: {
                    select: {
                        customer_id: true,
                        hn_code: true,
                        full_name: true,
                        first_name: true,
                        last_name: true,
                        phone_number: true,
                    },
                },
                course: {
                    select: {
                        course_id: true,
                        course_name: true,
                        session_count: true,
                    },
                },
            },
            orderBy: { purchase_date: 'desc' },
            take: 50,
        })

        // Group by customer
        const customerMap = new Map<number, {
            customer_id: number
            hn_code: string
            full_name: string
            phone_number: string
            courses: Array<{
                id: number
                course_name: string
                remaining_sessions: number
                total_sessions: number
            }>
        }>()

        for (const cc of activeCourses) {
            const cust = cc.customer
            if (!customerMap.has(cust.customer_id)) {
                customerMap.set(cust.customer_id, {
                    customer_id: cust.customer_id,
                    hn_code: cust.hn_code,
                    full_name: cust.full_name || `${cust.first_name} ${cust.last_name}`,
                    phone_number: cust.phone_number,
                    courses: [],
                })
            }

            customerMap.get(cust.customer_id)!.courses.push({
                id: cc.id,
                course_name: cc.course.course_name,
                remaining_sessions: cc.remaining_sessions,
                total_sessions: cc.total_sessions,
            })
        }

        // Convert to array and sort by most courses
        const result = Array.from(customerMap.values()).sort(
            (a, b) => b.courses.length - a.courses.length
        )

        return NextResponse.json(result)
    } catch (error) {
        console.error('Error fetching customers with courses:', error)
        return NextResponse.json(
            { error: 'Failed to fetch customers with courses' },
            { status: 500 }
        )
    }
}
