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

interface TransferItem {
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
        const { items, destination, evidence_image, note } = body as {
            items: TransferItem[]
            destination: string
            evidence_image: string // Mandatory
            note?: string
        }

        if (!evidence_image) {
            return NextResponse.json({ error: 'Photo is required for transfer' }, { status: 400 })
        }

        if (!items || items.length === 0) {
            return NextResponse.json({ error: 'No items provided' }, { status: 400 })
        }

        // Process each item - deduct from inventory
        const results = await Promise.all(
            items.map(async (item) => {
                const product = await prisma.product.findUnique({
                    where: { product_id: item.product_id },
                })

                if (!product) {
                    throw new Error(`Product ${item.product_id} not found`)
                }

                // Check inventory
                const inventory = await prisma.inventory.findFirst({
                    where: { product_id: item.product_id },
                })

                if (!inventory || inventory.full_qty < item.qty_main) {
                    throw new Error(`Insufficient stock for product ${product.product_name}`)
                }

                const qty_sub = item.qty_main * product.pack_size

                // Create stock movement record
                const movement = await prisma.stock_movement.create({
                    data: {
                        product_id: item.product_id,
                        staff_id: staffId,
                        action_type: 'TRANSFER',
                        qty_main: item.qty_main,
                        qty_sub: qty_sub,
                        evidence_image: evidence_image,
                        note: `Transfer to: ${destination}. ${note || ''}`,
                    },
                })

                // Deduct from inventory
                await prisma.inventory.update({
                    where: { inventory_id: inventory.inventory_id },
                    data: {
                        full_qty: inventory.full_qty - item.qty_main,
                        last_updated: new Date(),
                    },
                })

                return movement
            })
        )

        return NextResponse.json({ success: true, movements: results }, { status: 201 })
    } catch (error) {
        console.error('Error processing transfer:', error)
        const message = error instanceof Error ? error.message : 'Failed to process transfer'
        return NextResponse.json({ error: message }, { status: 500 })
    }
}
