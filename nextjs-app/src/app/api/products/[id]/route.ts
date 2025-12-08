import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

interface Params {
    params: Promise<{ id: string }>
}

// GET /api/products/[id] - Get single product
export async function GET(request: NextRequest, { params }: Params) {
    try {
        const { id } = await params
        const productId = parseInt(id)

        const product = await prisma.product.findUnique({
            where: { product_id: productId },
            include: {
                inventory: true,
            },
        })

        if (!product) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 })
        }

        return NextResponse.json(product)
    } catch (error) {
        console.error('Error fetching product:', error)
        return NextResponse.json(
            { error: 'Failed to fetch product' },
            { status: 500 }
        )
    }
}

// PUT /api/products/[id] - Update product
export async function PUT(request: NextRequest, { params }: Params) {
    try {
        const { id } = await params
        const productId = parseInt(id)
        const body = await request.json()

        const product = await prisma.product.update({
            where: { product_id: productId },
            data: {
                product_name: body.product_name,
                category: body.category,
                main_unit: body.main_unit,
                sub_unit: body.sub_unit,
                pack_size: body.pack_size,
                is_liquid: body.is_liquid,
                cost_price: body.cost_price,
                standard_price: body.standard_price,
                staff_price: body.staff_price,
                is_active: body.is_active,
            },
        })

        return NextResponse.json(product)
    } catch (error) {
        console.error('Error updating product:', error)
        return NextResponse.json(
            { error: 'Failed to update product' },
            { status: 500 }
        )
    }
}

// DELETE /api/products/[id] - Soft delete product
export async function DELETE(request: NextRequest, { params }: Params) {
    try {
        const { id } = await params
        const productId = parseInt(id)

        await prisma.product.update({
            where: { product_id: productId },
            data: { is_active: false },
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error deleting product:', error)
        return NextResponse.json(
            { error: 'Failed to delete product' },
            { status: 500 }
        )
    }
}
