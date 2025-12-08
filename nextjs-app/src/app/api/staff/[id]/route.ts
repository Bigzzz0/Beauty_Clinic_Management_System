import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

interface Params {
    params: Promise<{ id: string }>
}

// GET /api/staff/[id] - Get single staff
export async function GET(request: NextRequest, { params }: Params) {
    try {
        const { id } = await params
        const staffId = parseInt(id)

        const staff = await prisma.staff.findUnique({
            where: { staff_id: staffId },
            select: {
                staff_id: true,
                full_name: true,
                position: true,
                username: true,
                is_active: true,
                created_at: true,
            },
        })

        if (!staff) {
            return NextResponse.json({ error: 'Staff not found' }, { status: 404 })
        }

        return NextResponse.json(staff)
    } catch (error) {
        console.error('Error fetching staff:', error)
        return NextResponse.json(
            { error: 'Failed to fetch staff' },
            { status: 500 }
        )
    }
}

// PUT /api/staff/[id] - Update staff
export async function PUT(request: NextRequest, { params }: Params) {
    try {
        const { id } = await params
        const staffId = parseInt(id)
        const body = await request.json()

        const updateData: Record<string, unknown> = {
            full_name: body.full_name,
            position: body.position,
            is_active: body.is_active,
        }

        // If new password provided, hash it
        if (body.password) {
            updateData.password_hash = await bcrypt.hash(body.password, 10)
        }

        const staff = await prisma.staff.update({
            where: { staff_id: staffId },
            data: updateData,
            select: {
                staff_id: true,
                full_name: true,
                position: true,
                username: true,
                is_active: true,
                created_at: true,
            },
        })

        return NextResponse.json(staff)
    } catch (error) {
        console.error('Error updating staff:', error)
        return NextResponse.json(
            { error: 'Failed to update staff' },
            { status: 500 }
        )
    }
}

// DELETE /api/staff/[id] - Soft delete staff
export async function DELETE(request: NextRequest, { params }: Params) {
    try {
        const { id } = await params
        const staffId = parseInt(id)

        await prisma.staff.update({
            where: { staff_id: staffId },
            data: { is_active: false },
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error deleting staff:', error)
        return NextResponse.json(
            { error: 'Failed to delete staff' },
            { status: 500 }
        )
    }
}
