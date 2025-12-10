import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

interface Params {
    params: Promise<{ id: string }>
}

// GET /api/categories/[id] - Get single category
export async function GET(request: NextRequest, { params }: Params) {
    try {
        const { id } = await params
        const categoryId = parseInt(id)

        const category = await prisma.category.findUnique({
            where: { id: categoryId },
        })

        if (!category) {
            return NextResponse.json({ error: 'Category not found' }, { status: 404 })
        }

        return NextResponse.json(category)
    } catch (error) {
        console.error('Error fetching category:', error)
        return NextResponse.json(
            { error: 'Failed to fetch category' },
            { status: 500 }
        )
    }
}

// PUT /api/categories/[id] - Update category
export async function PUT(request: NextRequest, { params }: Params) {
    try {
        const { id } = await params
        const categoryId = parseInt(id)
        const body = await request.json()

        const category = await prisma.category.update({
            where: { id: categoryId },
            data: {
                name: body.name,
                code: body.code,
                description: body.description,
                sort_order: body.sort_order,
                is_active: body.is_active,
            },
        })

        return NextResponse.json(category)
    } catch (error) {
        console.error('Error updating category:', error)
        return NextResponse.json(
            { error: 'Failed to update category' },
            { status: 500 }
        )
    }
}

// DELETE /api/categories/[id] - Soft delete category
export async function DELETE(request: NextRequest, { params }: Params) {
    try {
        const { id } = await params
        const categoryId = parseInt(id)

        await prisma.category.update({
            where: { id: categoryId },
            data: { is_active: false },
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error deleting category:', error)
        return NextResponse.json(
            { error: 'Failed to delete category' },
            { status: 500 }
        )
    }
}
