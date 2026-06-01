import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const VALID_FEE_TYPES = new Set(['DF', 'HAND_FEE'])

interface RouteParams {
    params: Promise<{ id: string }>
}

// GET /api/commission-rates/[id] - Get single commission rate
export async function GET(
    request: NextRequest,
    { params }: RouteParams
) {
    try {
        const { id } = await params
        const rateId = parseInt(id)

        if (isNaN(rateId)) {
            return NextResponse.json(
                { error: 'Invalid rate ID' },
                { status: 400 }
            )
        }

        const rate = await prisma.commission_rate.findUnique({
            where: { id: rateId },
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

        if (!rate) {
            return NextResponse.json(
                { error: 'Commission rate not found' },
                { status: 404 }
            )
        }

        return NextResponse.json(rate)
    } catch (error) {
        console.error('Error fetching commission rate:', error)
        return NextResponse.json(
            { error: 'Failed to fetch commission rate' },
            { status: 500 }
        )
    }
}

// PUT /api/commission-rates/[id] - Update commission rate
export async function PUT(
    request: NextRequest,
    { params }: RouteParams
) {
    try {
        const { id } = await params
        const rateId = parseInt(id)

        if (isNaN(rateId)) {
            return NextResponse.json(
                { error: 'Invalid rate ID' },
                { status: 400 }
            )
        }

        const body = await request.json()
        const { category, itemName, rateAmount, positionType, isActive, courseId, feeType } = body

        const existingRate = await prisma.commission_rate.findUnique({
            where: { id: rateId },
        })

        if (!existingRate) {
            return NextResponse.json(
                { error: 'Commission rate not found' },
                { status: 404 }
            )
        }

        const data: Record<string, unknown> = {}

        if (category !== undefined) {
            const normalizedCategory = String(category).trim()
            if (!normalizedCategory) {
                return NextResponse.json(
                    { error: 'category cannot be empty' },
                    { status: 400 }
                )
            }
            data.category = normalizedCategory
        }

        if (itemName !== undefined) {
            const normalizedItemName = String(itemName).trim()
            if (!normalizedItemName) {
                return NextResponse.json(
                    { error: 'itemName cannot be empty' },
                    { status: 400 }
                )
            }
            data.item_name = normalizedItemName
        }

        if (rateAmount !== undefined) {
            const numericRate = Number(rateAmount)
            if (Number.isNaN(numericRate) || numericRate < 0) {
                return NextResponse.json(
                    { error: 'rateAmount must be a non-negative number' },
                    { status: 400 }
                )
            }
            data.rate_amount = numericRate
        }

        if (positionType !== undefined) {
            data.position_type = positionType || null
        }

        if (isActive !== undefined) {
            if (typeof isActive === 'boolean') {
                data.is_active = isActive
            } else if (isActive === 'true' || isActive === 'false') {
                data.is_active = isActive === 'true'
            } else {
                return NextResponse.json(
                    { error: 'isActive must be a boolean' },
                    { status: 400 }
                )
            }
        }

        if (courseId !== undefined) {
            const normalizedCourseId =
                courseId === null || courseId === ''
                    ? null
                    : Number(courseId)

            if (normalizedCourseId !== null && (!Number.isInteger(normalizedCourseId) || normalizedCourseId <= 0)) {
                return NextResponse.json(
                    { error: 'courseId must be a positive integer' },
                    { status: 400 }
                )
            }

            if (normalizedCourseId !== null) {
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

            data.course_id = normalizedCourseId
        }

        if (feeType !== undefined) {
            const normalizedFeeType = feeType === null || feeType === ''
                ? null
                : String(feeType)

            if (normalizedFeeType && !VALID_FEE_TYPES.has(normalizedFeeType)) {
                return NextResponse.json(
                    { error: 'Invalid feeType' },
                    { status: 400 }
                )
            }

            data.fee_type = normalizedFeeType
        }

        const nextCourseId = (data.course_id as number | null | undefined) !== undefined
            ? (data.course_id as number | null)
            : existingRate.course_id

        const nextFeeType = (data.fee_type as string | null | undefined) !== undefined
            ? (data.fee_type as string | null)
            : existingRate.fee_type

        if (nextCourseId && !nextFeeType) {
            return NextResponse.json(
                { error: 'feeType is required when linking a course' },
                { status: 400 }
            )
        }

        const rate = await prisma.commission_rate.update({
            where: { id: rateId },
            data,
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

        return NextResponse.json(rate)
    } catch (error) {
        console.error('Error updating commission rate:', error)
        return NextResponse.json(
            { error: 'Failed to update commission rate' },
            { status: 500 }
        )
    }
}

// DELETE /api/commission-rates/[id] - Delete commission rate
export async function DELETE(
    request: NextRequest,
    { params }: RouteParams
) {
    try {
        const { id } = await params
        const rateId = parseInt(id)

        if (isNaN(rateId)) {
            return NextResponse.json(
                { error: 'Invalid rate ID' },
                { status: 400 }
            )
        }

        await prisma.commission_rate.delete({
            where: { id: rateId },
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error deleting commission rate:', error)
        return NextResponse.json(
            { error: 'Failed to delete commission rate' },
            { status: 500 }
        )
    }
}
