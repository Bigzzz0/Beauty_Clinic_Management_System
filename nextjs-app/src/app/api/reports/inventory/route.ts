import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/reports/inventory - Inventory movement log
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const startDate = searchParams.get('startDate') || new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0]
        const endDate = searchParams.get('endDate') || new Date().toISOString().split('T')[0]
        const productId = searchParams.get('productId')
        const actionType = searchParams.get('actionType')

        const where: any = {
            created_at: {
                gte: new Date(startDate),
                lte: new Date(endDate + 'T23:59:59'),
            },
        }

        if (productId) {
            where.product_id = parseInt(productId)
        }

        if (actionType) {
            where.action_type = actionType
        }

        const movements = await prisma.stock_movement.findMany({
            where,
            include: {
                product: {
                    select: {
                        product_id: true,
                        product_code: true,
                        product_name: true,
                    },
                },
                // Staff relation missing in schema
            },
            orderBy: { created_at: 'desc' },
            take: 500,
        })

        // Summary by action type
        const summaryByType: Record<string, { count: number; qty: number }> = {}
        movements.forEach((m) => {
            if (!summaryByType[m.action_type]) {
                summaryByType[m.action_type] = { count: 0, qty: 0 }
            }
            summaryByType[m.action_type].count += 1
            summaryByType[m.action_type].qty += Number(m.qty_main)
        })

        return NextResponse.json({
            dateRange: { startDate, endDate },
            summary: Object.entries(summaryByType).map(([type, data]) => ({
                action_type: type,
                ...data,
            })),
            movements: movements.map((m) => ({
                movement_id: m.movement_id,
                date: m.created_at,
                product_code: m.product?.product_code,
                product_name: m.product?.product_name,
                action_type: m.action_type,
                qty: Number(m.qty_main),
                lot_number: m.lot_number,
                photo_url: m.evidence_image,
                note: m.note,
                staff: 'N/A', // Staff relation missing
            })),
        })
    } catch (error) {
        console.error('Error generating inventory report:', error)
        return NextResponse.json(
            { error: 'Failed to generate report' },
            { status: 500 }
        )
    }
}
