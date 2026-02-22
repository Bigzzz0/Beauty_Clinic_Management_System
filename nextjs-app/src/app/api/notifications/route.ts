import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
    try {
        // Find inventory items with full_qty < 5
        const lowStockInventory = await prisma.inventory.findMany({
            where: {
                full_qty: {
                    lt: 5
                },
                product: {
                    is_active: true
                }
            },
            include: {
                product: true
            },
            orderBy: {
                full_qty: 'asc'
            }
        })

        const notifications = lowStockInventory.map((item) => ({
            id: `low-stock-${item.inventory_id}`,
            title: 'สินค้าใกล้หมดสต็อก',
            description: `${item.product.product_name} เหลือเพียง ${item.full_qty} ${item.product.main_unit}`,
            type: 'alert',
            icon: 'package',
            link: `/inventory?search=${encodeURIComponent(item.product.product_code || item.product.product_name)}`,
            // Realtime time relative to server can be fetched, or just mapped to a static text for now
            time: 'ล่าสุด'
        }))

        return NextResponse.json({ notifications })
    } catch (error) {
        console.error('Failed to fetch notifications:', error)
        return NextResponse.json({ error: 'Failed to evaluate notifications' }, { status: 500 })
    }
}
