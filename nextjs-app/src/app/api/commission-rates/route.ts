import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const VALID_FEE_TYPES = new Set(['DF', 'HAND_FEE'])

// GET /api/commission-rates - List all commission rates
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const category = searchParams.get('category')
        const isActive = searchParams.get('isActive')
        const courseId = searchParams.get('courseId')
        const feeType = searchParams.get('feeType')

        const where: Record<string, unknown> = {}

        if (category) {
            where.category = category
        }

        if (courseId) {
            const parsedCourseId = parseInt(courseId, 10)
            if (Number.isNaN(parsedCourseId) || parsedCourseId <= 0) {
                return NextResponse.json(
                    { error: 'Invalid courseId' },
                    { status: 400 }
                )
            }
            where.course_id = parsedCourseId
        }

        if (feeType) {
            if (!VALID_FEE_TYPES.has(feeType)) {
                return NextResponse.json(
                    { error: 'Invalid feeType' },
                    { status: 400 }
                )
            }
            where.fee_type = feeType
        }

        if (isActive !== null && isActive !== undefined) {
            where.is_active = isActive === 'true'
        }

        const rates = await prisma.commission_rate.findMany({
            where,
            include: {
                course: {
                    select: {
                        course_id: true,
                        course_name: true,
                        course_code: true,
                    },
                },
            },
            orderBy: [
                { category: 'asc' },
                { course_id: 'asc' },
                { item_name: 'asc' },
            ],
        })

        // Group by category for easier display
        const grouped = rates.reduce((acc, rate) => {
            const cat = rate.category
            if (!acc[cat]) {
                acc[cat] = []
            }
            acc[cat].push({
                id: rate.id,
                itemName: rate.item_name,
                rateAmount: Number(rate.rate_amount),
                positionType: rate.position_type,
                courseId: rate.course_id,
                courseName: rate.course?.course_name || null,
                feeType: rate.fee_type,
                isActive: rate.is_active,
            })
            return acc
        }, {} as Record<string, Array<{
            id: number
            itemName: string
            rateAmount: number
            positionType: string | null
            courseId: number | null
            courseName: string | null
            feeType: 'DF' | 'HAND_FEE' | null
            isActive: boolean
        }>>)

        return NextResponse.json({
            rates,
            grouped,
            total: rates.length,
        })
    } catch (error) {
        console.error('Error fetching commission rates:', error)
        return NextResponse.json(
            { error: 'Failed to fetch commission rates' },
            { status: 500 }
        )
    }
}

// POST /api/commission-rates - Create new commission rate
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { category, itemName, rateAmount, positionType, courseId, feeType } = body

        const normalizedCategory = String(category || '').trim()
        const normalizedItemName = String(itemName || '').trim()

        if (!normalizedCategory || !normalizedItemName) {
            return NextResponse.json(
                { error: 'Category and item name are required' },
                { status: 400 }
            )
        }

        const normalizedCourseId =
            courseId === undefined || courseId === null || courseId === ''
                ? null
                : Number(courseId)

        if (normalizedCourseId !== null && (!Number.isInteger(normalizedCourseId) || normalizedCourseId <= 0)) {
            return NextResponse.json(
                { error: 'courseId must be a positive integer' },
                { status: 400 }
            )
        }

        const normalizedFeeType = feeType === undefined || feeType === null || feeType === ''
            ? null
            : String(feeType)

        if (normalizedFeeType && !VALID_FEE_TYPES.has(normalizedFeeType)) {
            return NextResponse.json(
                { error: 'Invalid feeType' },
                { status: 400 }
            )
        }

        if (normalizedCourseId && !normalizedFeeType) {
            return NextResponse.json(
                { error: 'feeType is required when linking a course' },
                { status: 400 }
            )
        }

        if (normalizedCourseId) {
            const foundCourse = await prisma.course.findUnique({
                where: { course_id: normalizedCourseId },
                select: { course_id: true },
            })

            if (!foundCourse) {
                return NextResponse.json(
                    { error: 'Course not found' },
                    { status: 404 }
                )
            }
        }

        const numericRate = Number(rateAmount ?? 30)
        if (Number.isNaN(numericRate) || numericRate < 0) {
            return NextResponse.json(
                { error: 'rateAmount must be a non-negative number' },
                { status: 400 }
            )
        }

        const rate = await prisma.commission_rate.create({
            data: {
                category: normalizedCategory,
                item_name: normalizedItemName,
                course_id: normalizedCourseId,
                fee_type: (normalizedFeeType as 'DF' | 'HAND_FEE' | null) || null,
                rate_amount: numericRate,
                position_type: positionType || null,
                is_active: true,
            },
            include: {
                course: {
                    select: {
                        course_id: true,
                        course_name: true,
                        course_code: true,
                    },
                },
            },
        })

        return NextResponse.json(rate, { status: 201 })
    } catch (error) {
        console.error('Error creating commission rate:', error)
        return NextResponse.json(
            { error: 'Failed to create commission rate' },
            { status: 500 }
        )
    }
}
