import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { authenticateStaffRequest, isAdminPosition } from '@/lib/staff-auth'

const passwordSchema = z.string()
    .min(8, 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร')
    .max(72, 'รหัสผ่านต้องไม่เกิน 72 ตัวอักษร')
    .regex(/[a-z]/, 'รหัสผ่านต้องมีตัวพิมพ์เล็กอย่างน้อย 1 ตัว')
    .regex(/[A-Z]/, 'รหัสผ่านต้องมีตัวพิมพ์ใหญ่อย่างน้อย 1 ตัว')
    .regex(/[0-9]/, 'รหัสผ่านต้องมีตัวเลขอย่างน้อย 1 ตัว')
    .regex(/[^A-Za-z0-9]/, 'รหัสผ่านต้องมีอักขระพิเศษอย่างน้อย 1 ตัว')

const selfChangeSchema = z.object({
    currentPassword: z.string().min(1, 'ต้องระบุรหัสผ่านปัจจุบัน'),
    newPassword: passwordSchema,
    resetByAdmin: z.boolean().optional(),
})

const adminResetSchema = z.object({
    resetByAdmin: z.literal(true),
    newPassword: passwordSchema,
})

export async function PUT(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const authResult = await authenticateStaffRequest(request)
        if (!authResult.ok) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status })
        }

        const { id } = await context.params
        const staffId = Number.parseInt(id, 10)
        if (!Number.isInteger(staffId) || staffId <= 0) {
            return NextResponse.json({ error: 'Invalid staff id' }, { status: 400 })
        }

        const body = await request.json()
        const isAdminReset = body?.resetByAdmin === true

        if (isAdminReset) {
            if (!isAdminPosition(authResult.staff.position)) {
                return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
            }

            const parseResult = adminResetSchema.safeParse(body)
            if (!parseResult.success) {
                return NextResponse.json(
                    { error: parseResult.error.issues[0].message },
                    { status: 400 }
                )
            }

            const targetStaff = await prisma.staff.findUnique({
                where: { staff_id: staffId },
                select: { staff_id: true },
            })

            if (!targetStaff) {
                return NextResponse.json({ error: 'User not found' }, { status: 404 })
            }

            const hashedPassword = await bcrypt.hash(parseResult.data.newPassword, 10)

            await prisma.staff.update({
                where: { staff_id: staffId },
                data: {
                    password_hash: hashedPassword,
                    must_change_password: true,
                    login_attempts: 0,
                    locked_until: null,
                    token_version: { increment: 1 },
                },
            })

            return NextResponse.json({
                success: true,
                message: 'รีเซ็ตรหัสผ่านสำเร็จ และผู้ใช้จะถูกบังคับให้เปลี่ยนรหัสผ่านหลังเข้าสู่ระบบ',
            })
        }

        if (authResult.staff.staff_id !== staffId) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const parseResult = selfChangeSchema.safeParse(body)
        if (!parseResult.success) {
            return NextResponse.json(
                { error: parseResult.error.issues[0].message },
                { status: 400 }
            )
        }

        const { currentPassword, newPassword } = parseResult.data

        const staff = await prisma.staff.findUnique({ where: { staff_id: staffId } })
        if (!staff) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        const isValid = await bcrypt.compare(currentPassword, staff.password_hash)
        if (!isValid) {
            return NextResponse.json({ error: 'รหัสผ่านปัจจุบันไม่ถูกต้อง' }, { status: 400 })
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10)

        await prisma.staff.update({
            where: { staff_id: staffId },
            data: {
                password_hash: hashedPassword,
                must_change_password: false,
                login_attempts: 0,
                locked_until: null,
            },
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Password update error:', error)
        return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน' }, { status: 500 })
    }
}
