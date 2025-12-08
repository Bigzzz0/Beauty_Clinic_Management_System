import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

// GET /api/staff - List all staff
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const position = searchParams.get('position')
        const includeInactive = searchParams.get('includeInactive') === 'true'

        const where: Record<string, unknown> = {}

        if (!includeInactive) {
            where.is_active = true
        }

        if (position) {
            where.position = position
        }

        const staff = await prisma.staff.findMany({
            where,
            select: {
                staff_id: true,
                full_name: true,
                position: true,
                username: true,
                is_active: true,
                created_at: true,
            },
            orderBy: { full_name: 'asc' },
        })

        return NextResponse.json(staff)
    } catch (error) {
        console.error('Error fetching staff:', error)
        return NextResponse.json(
            { error: 'Failed to fetch staff' },
            { status: 500 }
        )
    }
}

// POST /api/staff - Create new staff
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()

        // Check if username already exists
        const existing = await prisma.staff.findUnique({
            where: { username: body.username },
        })

        if (existing) {
            return NextResponse.json(
                { error: 'Username already exists' },
                { status: 400 }
            )
        }

        // Hash password
        const password_hash = await bcrypt.hash(body.password, 10)

        const staff = await prisma.staff.create({
            data: {
                full_name: body.full_name,
                position: body.position,
                username: body.username,
                password_hash,
                is_active: true,
            },
            select: {
                staff_id: true,
                full_name: true,
                position: true,
                username: true,
                is_active: true,
                created_at: true,
            },
        })

        return NextResponse.json(staff, { status: 201 })
    } catch (error) {
        console.error('Error creating staff:', error)
        return NextResponse.json(
            { error: 'Failed to create staff' },
            { status: 500 }
        )
    }
}
