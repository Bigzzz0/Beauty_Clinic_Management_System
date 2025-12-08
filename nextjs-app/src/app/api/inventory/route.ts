import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const category = searchParams.get('category')
        const sortBy = searchParams.get('sortBy') || 'product_name'
        const sortOrder = searchParams.get('sortOrder') || 'asc'
        const search = searchParams.get('search')

        // Build product filter
        const productWhere: Record<string, unknown> = {
            is_active: true,
        }
        if (category) {
            productWhere.category = category
        }
        if (search) {
            productWhere.OR = [
                { product_name: { contains: search } },
                { product_code: { contains: search } },
            ]
        }

        // Get all products with inventory
        const products = await prisma.product.findMany({
            where: productWhere,
            include: {
                inventory: true,
            },
            orderBy: sortBy === 'product_name'
                ? { product_name: sortOrder as 'asc' | 'desc' }
                : undefined,
        })

        // Format response with stock calculations
        const inventoryData = products.map((product) => {
            const inv = product.inventory[0]
            return {
                product_id: product.product_id,
                product_code: product.product_code,
                product_name: product.product_name,
                category: product.category,
                main_unit: product.main_unit,
                sub_unit: product.sub_unit,
                pack_size: product.pack_size,
                is_liquid: product.is_liquid,
                full_qty: inv?.full_qty || 0,
                opened_qty: inv?.opened_qty || 0,
                last_updated: inv?.last_updated || null,
                // Calculate total in sub units
                total_sub_units: (inv?.full_qty || 0) * product.pack_size + (inv?.opened_qty || 0),
            }
        })

        // Sort by quantity if requested
        if (sortBy === 'full_qty' || sortBy === 'opened_qty') {
            inventoryData.sort((a, b) => {
                const aVal = sortBy === 'full_qty' ? a.full_qty : a.opened_qty
                const bVal = sortBy === 'full_qty' ? b.full_qty : b.opened_qty
                return sortOrder === 'asc' ? aVal - bVal : bVal - aVal
            })
        }

        return NextResponse.json(inventoryData)
    } catch (error) {
        console.error('Error fetching inventory:', error)
        return NextResponse.json(
            { error: 'Failed to fetch inventory' },
            { status: 500 }
        )
    }
}
