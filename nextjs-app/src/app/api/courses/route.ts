import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/courses - List all courses
export async function GET() {
    try {
        const courses = await prisma.course.findMany({
            where: { is_active: true },
            include: {
                course_item: true,
            },
            orderBy: { course_name: 'asc' },
        })

        return NextResponse.json(courses)
    } catch (error) {
        console.error('Error fetching courses:', error)
        return NextResponse.json(
            { error: 'Failed to fetch courses' },
            { status: 500 }
        )
    }
}

// POST /api/courses - Create new course
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()

        // Generate course code
        const timestamp = Date.now().toString(36).toUpperCase()
        const course_code = `C${timestamp}`

        const course = await prisma.course.create({
            data: {
                course_code,
                course_name: body.course_name,
                description: body.description || null,
                standard_price: body.standard_price,
                staff_price: body.staff_price || body.standard_price,
                is_active: true,
                course_item: body.items?.length > 0 ? {
                    create: body.items.map((item: { item_name: string; qty_limit: number }) => ({
                        item_name: item.item_name,
                        qty_limit: item.qty_limit || 1,
                    })),
                } : undefined,
            },
        })

        return NextResponse.json(course, { status: 201 })
    } catch (error) {
        console.error('Error creating course:', error)
        return NextResponse.json(
            { error: 'Failed to create course' },
            { status: 500 }
        )
    }
}
