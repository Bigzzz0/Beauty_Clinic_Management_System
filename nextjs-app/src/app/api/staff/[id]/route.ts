import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { Prisma } from '@prisma/client'
import { authenticateStaffRequest, isAdminPosition, STAFF_POSITION_VALUES } from '@/lib/staff-auth'

const positionSchema = z.enum(STAFF_POSITION_VALUES)

const usernameSchema = z.string().trim()
    .min(3, 'Username ต้องมีอย่างน้อย 3 ตัวอักษร')
    .max(50, 'Username ต้องไม่เกิน 50 ตัวอักษร')
    .regex(/^(?![0-9]+$)[a-zA-Z0-9_]+$/, 'Username ต้องไม่เป็นตัวเลขล้วนและมีแค่ A-Z, 0-9, _')

const updateStaffSchema = z.object({
    full_name: z.string().trim().min(1, 'ต้องระบุชื่อ').max(50, 'ชื่อต้องไม่เกิน 50 ตัวอักษร')
        .regex(/^[a-zA-Z0-9\sก-๙]+$/, 'ชื่อต้องไม่มีสัญลักษณ์พิเศษ'),
    position: positionSchema,
    username: usernameSchema.optional(),
    is_active: z.boolean().optional(),
})

interface Params {
    params: Promise<{ id: string }>
}

// GET /api/staff/[id] - Get single staff
export async function GET(request: NextRequest, { params }: Params) {
    try {
        const authResult = await authenticateStaffRequest(request)
        if (!authResult.ok) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status })
        }

        const { id } = await params
        const staffId = Number.parseInt(id, 10)

        if (!Number.isInteger(staffId) || staffId <= 0) {
            return NextResponse.json({ error: 'Invalid staff id' }, { status: 400 })
        }

        const isAdmin = isAdminPosition(authResult.staff.position)
        if (!isAdmin && authResult.staff.staff_id !== staffId) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const staff = await prisma.staff.findUnique({
            where: { staff_id: staffId },
            select: {
                staff_id: true,
                full_name: true,
                position: true,
                username: true,
                is_active: true,
                must_change_password: true,
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
        const authResult = await authenticateStaffRequest(request)
        if (!authResult.ok) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status })
        }

        if (!isAdminPosition(authResult.staff.position)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const { id } = await params
        const staffId = Number.parseInt(id, 10)

        if (!Number.isInteger(staffId) || staffId <= 0) {
            return NextResponse.json({ error: 'Invalid staff id' }, { status: 400 })
        }

        const body = await request.json()

        const parseResult = updateStaffSchema.safeParse(body)
        if (!parseResult.success) {
            return NextResponse.json(
                { error: parseResult.error.issues[0].message },
                { status: 400 }
            )
        }

        if (authResult.staff.staff_id === staffId && parseResult.data.is_active === false) {
            return NextResponse.json(
                { error: 'ไม่สามารถปิดใช้งานบัญชีของตนเองได้' },
                { status: 400 }
            )
        }

        const existingStaff = await prisma.staff.findUnique({
            where: { staff_id: staffId },
            select: {
                staff_id: true,
                username: true,
                position: true,
                is_active: true,
            },
        })

        if (!existingStaff) {
            return NextResponse.json({ error: 'Staff not found' }, { status: 404 })
        }

        const nextUsername = parseResult.data.username?.trim() || existingStaff.username
        const usernameChanged = nextUsername !== existingStaff.username

        if (usernameChanged) {
            const usernameExists = await prisma.staff.findUnique({
                where: { username: nextUsername },
                select: { staff_id: true },
            })

            if (usernameExists && usernameExists.staff_id !== staffId) {
                return NextResponse.json(
                    { error: 'Username already exists' },
                    { status: 400 }
                )
            }
        }

        const updateData: Prisma.staffUpdateInput = {
            full_name: parseResult.data.full_name,
            position: parseResult.data.position,
            is_active: parseResult.data.is_active,
            username: nextUsername,
        }

        const positionChanged = existingStaff.position !== parseResult.data.position
        const statusChanged = parseResult.data.is_active !== undefined && Boolean(existingStaff.is_active) !== parseResult.data.is_active

        if (positionChanged || statusChanged || usernameChanged) {
            updateData.token_version = { increment: 1 }
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
                must_change_password: true,
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
        const authResult = await authenticateStaffRequest(request)
        if (!authResult.ok) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status })
        }

        if (!isAdminPosition(authResult.staff.position)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const { id } = await params
        const staffId = Number.parseInt(id, 10)

        if (!Number.isInteger(staffId) || staffId <= 0) {
            return NextResponse.json({ error: 'Invalid staff id' }, { status: 400 })
        }

        if (authResult.staff.staff_id === staffId) {
            return NextResponse.json(
                { error: 'ไม่สามารถปิดใช้งานบัญชีของตนเองได้' },
                { status: 400 }
            )
        }

        await prisma.staff.update({
            where: { staff_id: staffId },
            data: {
                is_active: false,
                must_change_password: false,
                token_version: { increment: 1 },
            },
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
