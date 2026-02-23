import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/products - List all products
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const category = searchParams.get('category')
        const search = searchParams.get('search')
        const includeInactive = searchParams.get('includeInactive') === 'true'

        const where: Record<string, unknown> = {}

        if (!includeInactive) {
            where.is_active = true
        }

        if (category && category !== 'all') {
            where.category = category
        }

        if (search) {
            where.OR = [
                { product_name: { contains: search } },
                { product_code: { contains: search } },
            ]
        }

        const products = await prisma.product.findMany({
            where,
            include: {
                inventory: true,
            },
            orderBy: { product_name: 'asc' },
        })

        return NextResponse.json(products)
    } catch (error) {
        console.error('Error fetching products:', error)
        return NextResponse.json(
            { error: 'Failed to fetch products' },
            { status: 500 }
        )
    }
}

// POST /api/products - Create new product
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()

        // Generate product code
        const prefixMap: Record<string, string> = {
            'Medicine': 'MED',
            'Botox': 'BTX',
            'Filler': 'FIL',
            'Treatment': 'TRT',
            'Equipment': 'EQP',
            'Skin': 'SKN'
        }
        const prefix = prefixMap[body.category] || 'PRD'
        const timestamp = Date.now().toString(36).toUpperCase()
        const product_code = `${prefix}${timestamp}`

        const product = await prisma.product.create({
            data: {
                product_code,
                product_name: body.product_name,
                category: body.category,
                main_unit: body.main_unit,
                sub_unit: body.sub_unit,
                pack_size: body.pack_size || 1,
                is_liquid: body.is_liquid || false,
                cost_price: body.cost_price || 0,
                standard_price: body.standard_price || 0,
                staff_price: body.staff_price || 0,
                is_active: true,
                inventory: {
                    create: {
                        full_qty: 0,
                        opened_qty: 0,
                    },
                },
            },
        })

        return NextResponse.json(product, { status: 201 })
    } catch (error) {
        console.error('Error creating product:', error)
        return NextResponse.json(
            { error: 'Failed to create product' },
            { status: 500 }
        )
    }
}
