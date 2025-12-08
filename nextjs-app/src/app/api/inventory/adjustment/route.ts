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

type AdjustmentReason = 'ADJUST_DAMAGED' | 'ADJUST_EXPIRED' | 'ADJUST_LOST'

export async function POST(request: NextRequest) {
    try {
        const staffId = getStaffIdFromRequest(request)
        if (!staffId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { product_id, qty_main, qty_sub, reason, note, evidence_image } = body as {
            product_id: number
            qty_main: number
            qty_sub?: number
            reason: AdjustmentReason
            note: string
            evidence_image?: string
        }

        if (!product_id || !reason || !note) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        const product = await prisma.product.findUnique({
            where: { product_id },
        })

        if (!product) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 })
        }

        const inventory = await prisma.inventory.findFirst({
            where: { product_id },
        })

        if (!inventory) {
            return NextResponse.json({ error: 'No inventory found for product' }, { status: 404 })
        }

        // Create stock movement
        const movement = await prisma.stock_movement.create({
            data: {
                product_id,
                staff_id: staffId,
                action_type: reason,
                qty_main: qty_main || 0,
                qty_sub: qty_sub || 0,
                note,
                evidence_image: evidence_image || null,
            },
        })

        // Update inventory - deduct quantities
        await prisma.inventory.update({
            where: { inventory_id: inventory.inventory_id },
            data: {
                full_qty: Math.max(0, inventory.full_qty - (qty_main || 0)),
                opened_qty: Math.max(0, inventory.opened_qty - (qty_sub || 0)),
                last_updated: new Date(),
            },
        })

        return NextResponse.json({ success: true, movement }, { status: 201 })
    } catch (error) {
        console.error('Error processing adjustment:', error)
        return NextResponse.json(
            { error: 'Failed to process adjustment' },
            { status: 500 }
        )
    }
}
