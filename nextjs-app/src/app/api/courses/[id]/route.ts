import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

interface Params {
    params: Promise<{ id: string }>
}

// GET /api/courses/[id] - Get single course
export async function GET(request: NextRequest, { params }: Params) {
    try {
        const { id } = await params
        const courseId = parseInt(id)

        const course = await prisma.course.findUnique({
            where: { course_id: courseId },
            include: {
                course_item: true,
            },
        })

        if (!course) {
            return NextResponse.json({ error: 'Course not found' }, { status: 404 })
        }

        return NextResponse.json(course)
    } catch (error) {
        console.error('Error fetching course:', error)
        return NextResponse.json(
            { error: 'Failed to fetch course' },
            { status: 500 }
        )
    }
}

// PUT /api/courses/[id] - Update course
export async function PUT(request: NextRequest, { params }: Params) {
    try {
        const { id } = await params
        const courseId = parseInt(id)
        const body = await request.json()

        const course = await prisma.course.update({
            where: { course_id: courseId },
            data: {
                course_name: body.course_name,
                description: body.description,
                standard_price: body.standard_price,
                staff_price: body.staff_price,
                is_active: body.is_active,
            },
        })

        return NextResponse.json(course)
    } catch (error) {
        console.error('Error updating course:', error)
        return NextResponse.json(
            { error: 'Failed to update course' },
            { status: 500 }
        )
    }
}

// DELETE /api/courses/[id] - Soft delete course
export async function DELETE(request: NextRequest, { params }: Params) {
    try {
        const { id } = await params
        const courseId = parseInt(id)

        await prisma.course.update({
            where: { course_id: courseId },
            data: { is_active: false },
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error deleting course:', error)
        return NextResponse.json(
            { error: 'Failed to delete course' },
            { status: 500 }
        )
    }
}
