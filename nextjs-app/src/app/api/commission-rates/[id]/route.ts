import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

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
        const { category, itemName, rateAmount, positionType, isActive } = body

        const rate = await prisma.commission_rate.update({
            where: { id: rateId },
            data: {
                ...(category && { category }),
                ...(itemName && { item_name: itemName }),
                ...(rateAmount !== undefined && { rate_amount: rateAmount }),
                ...(positionType !== undefined && { position_type: positionType }),
                ...(isActive !== undefined && { is_active: isActive }),
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
