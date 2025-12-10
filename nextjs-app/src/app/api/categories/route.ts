import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/categories - List categories, optionally filter by type
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const type = searchParams.get('type') // 'PRODUCT' or 'COMMISSION'

        const where: Record<string, unknown> = {
            is_active: true,
        }

        if (type) {
            where.type = type
        }

        const categories = await prisma.category.findMany({
            where,
            orderBy: [
                { sort_order: 'asc' },
                { name: 'asc' },
            ],
        })

        return NextResponse.json(categories)
    } catch (error) {
        console.error('Error fetching categories:', error)
        return NextResponse.json(
            { error: 'Failed to fetch categories' },
            { status: 500 }
        )
    }
}

// POST /api/categories - Create new category
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { type, name, code, description, sort_order } = body

        if (!type || !name || !code) {
            return NextResponse.json(
                { error: 'Type, name, and code are required' },
                { status: 400 }
            )
        }

        // Check for duplicate code in the same type
        const existing = await prisma.category.findFirst({
            where: { type, code },
        })

        if (existing) {
            return NextResponse.json(
                { error: 'รหัสหมวดหมู่นี้มีอยู่แล้ว' },
                { status: 409 }
            )
        }

        const category = await prisma.category.create({
            data: {
                type,
                name,
                code,
                description: description || null,
                sort_order: sort_order || 0,
                is_active: true,
            },
        })

        return NextResponse.json(category, { status: 201 })
    } catch (error) {
        console.error('Error creating category:', error)
        return NextResponse.json(
            { error: 'Failed to create category' },
            { status: 500 }
        )
    }
}
