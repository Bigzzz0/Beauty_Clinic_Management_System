import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/commission-rates - List all commission rates
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const category = searchParams.get('category')
        const isActive = searchParams.get('isActive')

        const where: Record<string, unknown> = {}

        if (category) {
            where.category = category
        }

        if (isActive !== null && isActive !== undefined) {
            where.is_active = isActive === 'true'
        }

        const rates = await prisma.commission_rate.findMany({
            where,
            orderBy: [
                { category: 'asc' },
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
                isActive: rate.is_active,
            })
            return acc
        }, {} as Record<string, Array<{
            id: number
            itemName: string
            rateAmount: number
            positionType: string | null
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
        const { category, itemName, rateAmount, positionType } = body

        if (!category || !itemName) {
            return NextResponse.json(
                { error: 'Category and item name are required' },
                { status: 400 }
            )
        }

        const rate = await prisma.commission_rate.create({
            data: {
                category,
                item_name: itemName,
                rate_amount: rateAmount || 30,
                position_type: positionType || null,
                is_active: true,
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
