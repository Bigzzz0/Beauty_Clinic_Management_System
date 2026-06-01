import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { Prisma, staff_position } from '@prisma/client'
import { authenticateStaffRequest, isAdminPosition, STAFF_POSITION_VALUES } from '@/lib/staff-auth'

const positionSchema = z.enum(STAFF_POSITION_VALUES)

const passwordSchema = z.string()
    .min(8, 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร')
    .max(72, 'รหัสผ่านต้องไม่เกิน 72 ตัวอักษร')
    .regex(/[a-z]/, 'รหัสผ่านต้องมีตัวพิมพ์เล็กอย่างน้อย 1 ตัว')
    .regex(/[A-Z]/, 'รหัสผ่านต้องมีตัวพิมพ์ใหญ่อย่างน้อย 1 ตัว')
    .regex(/[0-9]/, 'รหัสผ่านต้องมีตัวเลขอย่างน้อย 1 ตัว')
    .regex(/[^A-Za-z0-9]/, 'รหัสผ่านต้องมีอักขระพิเศษอย่างน้อย 1 ตัว')

const staffSchema = z.object({
    full_name: z.string().trim().min(1, 'ต้องระบุชื่อ').max(50, 'ชื่อต้องไม่เกิน 50 ตัวอักษร')
        .regex(/^[a-zA-Z0-9\sก-๙]+$/, 'ชื่อต้องไม่มีสัญลักษณ์พิเศษ'),
    username: z.string().trim().min(3, 'Username ต้องมีอย่างน้อย 3 ตัวอักษร').max(50, 'Username ต้องไม่เกิน 50 ตัวอักษร')
        .regex(/^(?![0-9]+$)[a-zA-Z0-9_]+$/, 'Username ต้องไม่เป็นตัวเลขล้วนและมีแค่ A-Z, 0-9, _'),
    password: passwordSchema,
    position: positionSchema,
})

// GET /api/staff - List all staff
export async function GET(request: NextRequest) {
    try {
        const authResult = await authenticateStaffRequest(request)
        if (!authResult.ok) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status })
        }

        const { searchParams } = new URL(request.url)
        const position = searchParams.get('position')
        const includeInactive = searchParams.get('includeInactive') === 'true'

        if (includeInactive && !isAdminPosition(authResult.staff.position)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const where: Prisma.staffWhereInput = {}

        if (!includeInactive) {
            where.is_active = true
        }

        if (position) {
            const parsedPosition = positionSchema.safeParse(position)
            if (!parsedPosition.success) {
                return NextResponse.json(
                    { error: 'ตำแหน่งไม่ถูกต้อง' },
                    { status: 400 }
                )
            }
            where.position = parsedPosition.data as staff_position
        }

        const staff = await prisma.staff.findMany({
            where,
            select: {
                staff_id: true,
                full_name: true,
                position: true,
                username: true,
                is_active: true,
                must_change_password: true,
                login_attempts: true,
                locked_until: true,
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
        const authResult = await authenticateStaffRequest(request)
        if (!authResult.ok) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status })
        }

        if (!isAdminPosition(authResult.staff.position)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const body = await request.json()

        const parseResult = staffSchema.safeParse(body)
        if (!parseResult.success) {
            return NextResponse.json(
                { error: parseResult.error.issues[0].message },
                { status: 400 }
            )
        }

        const payload = parseResult.data

        // Check if username already exists
        const existing = await prisma.staff.findUnique({
            where: { username: payload.username },
        })

        if (existing) {
            return NextResponse.json(
                { error: 'Username already exists' },
                { status: 400 }
            )
        }

        // Hash password
        const password_hash = await bcrypt.hash(payload.password, 10)

        const staff = await prisma.staff.create({
            data: {
                full_name: payload.full_name,
                position: payload.position,
                username: payload.username,
                password_hash,
                is_active: true,
                must_change_password: false,
            },
            select: {
                staff_id: true,
                full_name: true,
                position: true,
                username: true,
                is_active: true,
                must_change_password: true,
                login_attempts: true,
                locked_until: true,
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
