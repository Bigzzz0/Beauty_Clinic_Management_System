import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
    try {
        // ดึงข้อมูลจากตาราง inventory ที่มีจำนวนคงเหลือ (stock_qty) น้อยกว่า 10
        const inventoryItems = await prisma.inventory.findMany({
            where: {
                full_qty: {
                    lt: 10 // น้อยกว่า 10
                }
            },
            include: {
                product: true // ดึงข้อมูลชื่อสินค้าจากตาราง product มาด้วย
            },
            orderBy: {
                full_qty: 'asc' // เรียงตามจำนวนน้อยไปมาก
            },
            take: 10 // เอามาแค่ 10 รายการที่วิกฤตที่สุด
        })

        // จัดรูปแบบข้อมูล (Mapping) ให้ตรงกับที่ Frontend ต้องการ
        const formattedData = inventoryItems.map(item => ({
            name: item.product?.product_name || 'Unknown Product',
            qty: item.full_qty,
            // เนื่องจากใน Schema ไม่มีฟิลด์ min_stock_qty 
            // เราจะใช้ค่า 10 เป็นเกณฑ์มาตรฐานตามที่คุณตั้งโจทย์ไว้ครับ
            minQty: 10 
        }))

        return NextResponse.json(formattedData)
    } catch (error) {
        console.error('Low Stock API Error:', error)
        return NextResponse.json({ error: 'Failed to fetch low stock' }, { status: 500 })
    }
}