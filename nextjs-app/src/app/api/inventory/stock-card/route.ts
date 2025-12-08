import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const month = parseInt(searchParams.get('month') || String(new Date().getMonth() + 1))
        const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()))

        // Build date range for the month
        const startDate = new Date(year, month - 1, 1)
        const endDate = new Date(year, month, 0, 23, 59, 59, 999)

        // Get all products with inventory
        const products = await prisma.product.findMany({
            where: { is_active: true },
            include: {
                inventory: true,
            },
            orderBy: { product_name: 'asc' },
        })

        // Get all stock movements for the month
        const movements = await prisma.stock_movement.findMany({
            where: {
                created_at: {
                    gte: startDate,
                    lte: endDate,
                },
            },
        })

        // Calculate movement totals per product
        const movementsByProduct = new Map<number, {
            stock_in: number
            stock_out: number
            adjustment: number
        }>()

        movements.forEach((m) => {
            const existing = movementsByProduct.get(m.product_id) || {
                stock_in: 0,
                stock_out: 0,
                adjustment: 0,
            }

            if (m.action_type === 'IN') {
                existing.stock_in += m.qty_main
            } else if (m.action_type === 'USAGE' || m.action_type === 'TRANSFER') {
                existing.stock_out += m.qty_sub || m.qty_main
            } else if (['ADJUST_DAMAGED', 'ADJUST_EXPIRED', 'ADJUST_LOST'].includes(m.action_type)) {
                existing.adjustment += m.qty_main + m.qty_sub
            }

            movementsByProduct.set(m.product_id, existing)
        })

        // Calculate totals
        let totalIn = 0
        let totalOut = 0
        let totalAdjust = 0

        // Build stock card data
        const stockCard = products.map((p) => {
            const inv = p.inventory[0]
            const movement = movementsByProduct.get(p.product_id) || {
                stock_in: 0,
                stock_out: 0,
                adjustment: 0,
            }

            totalIn += movement.stock_in
            totalOut += movement.stock_out
            totalAdjust += movement.adjustment

            // Calculate beginning balance (current - in + out + adjust)
            const currentQty = (inv?.full_qty || 0) * p.pack_size + (inv?.opened_qty || 0)
            const beginBalance = currentQty - (movement.stock_in * p.pack_size) + movement.stock_out + movement.adjustment

            return {
                product_id: p.product_id,
                product_code: p.product_code,
                product_name: p.product_name,
                category: p.category,
                sub_unit: p.sub_unit,
                begin_balance: Math.max(0, beginBalance),
                stock_in: movement.stock_in,
                stock_out: movement.stock_out,
                adjustment: movement.adjustment,
                end_balance: currentQty,
                opened_qty: inv?.opened_qty || 0,
            }
        })

        return NextResponse.json({
            month,
            year,
            summary: {
                total_products: products.length,
                total_in: totalIn,
                total_out: totalOut,
                total_adjustment: totalAdjust,
            },
            stock_card: stockCard,
        })
    } catch (error) {
        console.error('Error fetching stock card:', error)
        return NextResponse.json(
            { error: 'Failed to fetch stock card' },
            { status: 500 }
        )
    }
}
