import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

function getStaffIdFromRequest(request: NextRequest): number | null {
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) return null
    try {
        const token = authHeader.substring(7)
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as { staff_id: number }
        return decoded.staff_id
    } catch {
        return null
    }
}

interface StockInItem {
    product_id: number
    qty_main: number
}

export async function POST(request: NextRequest) {
    try {
        const staffId = getStaffIdFromRequest(request)
        if (!staffId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { items, evidence_image, note } = body as {
            items: StockInItem[]
            evidence_image?: string
            note?: string
        }

        if (!items || items.length === 0) {
            return NextResponse.json({ error: 'No items provided' }, { status: 400 })
        }

        // Process each item
        const results = await Promise.all(
            items.map(async (item) => {
                // Get product for pack_size
                const product = await prisma.product.findUnique({
                    where: { product_id: item.product_id },
                })

                if (!product) {
                    throw new Error(`Product ${item.product_id} not found`)
                }

                // Calculate sub units
                const qty_sub = item.qty_main * product.pack_size

                // Create stock movement record (timestamp recorded automatically via created_at)
                const movement = await prisma.stock_movement.create({
                    data: {
                        product_id: item.product_id,
                        staff_id: staffId,
                        action_type: 'IN',
                        qty_main: item.qty_main,
                        qty_sub: qty_sub,
                        evidence_image: evidence_image || null,
                        note: note || null,
                    },
                })

                // Update or create inventory
                const existingInventory = await prisma.inventory.findFirst({
                    where: { product_id: item.product_id },
                })

                if (existingInventory) {
                    await prisma.inventory.update({
                        where: { inventory_id: existingInventory.inventory_id },
                        data: {
                            full_qty: existingInventory.full_qty + item.qty_main,
                            last_updated: new Date(),
                        },
                    })
                } else {
                    await prisma.inventory.create({
                        data: {
                            product_id: item.product_id,
                            full_qty: item.qty_main,
                            opened_qty: 0,
                        },
                    })
                }

                return movement
            })
        )

        return NextResponse.json({ success: true, movements: results }, { status: 201 })
    } catch (error) {
        console.error('Error processing stock in:', error)
        return NextResponse.json(
            { error: 'Failed to process stock in' },
            { status: 500 }
        )
    }
}
