import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const date = searchParams.get('date') || new Date().toISOString().split('T')[0]

        // Parse date for filtering
        const startOfDay = new Date(date)
        startOfDay.setHours(0, 0, 0, 0)
        const endOfDay = new Date(date)
        endOfDay.setHours(23, 59, 59, 999)

        // Get usage movements for the day
        const usageMovements = await prisma.stock_movement.findMany({
            where: {
                action_type: 'USAGE',
                created_at: {
                    gte: startOfDay,
                    lte: endOfDay,
                },
            },
            include: {
                product: true,
            },
            orderBy: {
                created_at: 'desc',
            },
        })

        // Get inventory usage records for the day (with service details)
        const inventoryUsages = await prisma.inventory_usage.findMany({
            where: {
                service_usage: {
                    service_date: {
                        gte: startOfDay,
                        lte: endOfDay,
                    },
                },
            },
            include: {
                product: true,
                service_usage: {
                    include: {
                        customer_course: {
                            include: {
                                customer: true,
                            },
                        },
                    },
                },
            },
        })

        // Aggregate by product
        const productUsage = new Map<number, {
            product_id: number
            product_code: string | null
            product_name: string
            category: string
            sub_unit: string
            times: number
            total_used: number
        }>()

        usageMovements.forEach((m) => {
            const existing = productUsage.get(m.product_id)
            if (existing) {
                existing.times += 1
                existing.total_used += m.qty_sub
            } else {
                productUsage.set(m.product_id, {
                    product_id: m.product_id,
                    product_code: m.product.product_code,
                    product_name: m.product.product_name,
                    category: m.product.category,
                    sub_unit: m.product.sub_unit,
                    times: 1,
                    total_used: m.qty_sub,
                })
            }
        })

        // Aggregate by category
        const categoryUsage = new Map<string, number>()
        productUsage.forEach((p) => {
            const existing = categoryUsage.get(p.category) || 0
            categoryUsage.set(p.category, existing + p.total_used)
        })

        // Format detail log
        const detailLog = inventoryUsages.map((u) => ({
            time: u.service_usage?.service_date,
            product_name: u.product.product_name,
            qty_used: u.qty_used,
            sub_unit: u.product.sub_unit,
            customer_name: u.service_usage?.customer_course?.customer
                ? `${u.service_usage.customer_course.customer.first_name} ${u.service_usage.customer_course.customer.last_name}`
                : null,
            note: u.service_usage?.note,
        }))

        return NextResponse.json({
            date,
            summary: {
                products_used: productUsage.size,
                total_times: usageMovements.length,
                total_units: [...productUsage.values()].reduce((sum, p) => sum + p.total_used, 0),
            },
            by_category: Object.fromEntries(categoryUsage),
            by_product: [...productUsage.values()],
            detail_log: detailLog,
        })
    } catch (error) {
        console.error('Error fetching daily usage:', error)
        return NextResponse.json(
            { error: 'Failed to fetch daily usage' },
            { status: 500 }
        )
    }
}
