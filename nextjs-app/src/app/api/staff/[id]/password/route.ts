import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

export async function PUT(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params
        const staffId = parseInt(id)

        const authHeader = request.headers.get('authorization')
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const token = authHeader.substring(7)
        let decoded: any;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-key')
        } catch {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
        }

        if (decoded.staff_id !== staffId && decoded.position !== 'Admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const { currentPassword, newPassword } = await request.json()
        if (!currentPassword || !newPassword) {
            return NextResponse.json({ error: 'Missing current or new password' }, { status: 400 })
        }

        const staff = await prisma.staff.findUnique({ where: { staff_id: staffId } })
        if (!staff) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        const isValid = bcrypt.compareSync(currentPassword, staff.password_hash)
        if (!isValid) {
            return NextResponse.json({ error: 'รหัสผ่านปัจจุบันไม่ถูกต้อง' }, { status: 400 })
        }

        const salt = bcrypt.genSaltSync(10)
        const hashedPassword = bcrypt.hashSync(newPassword, salt)

        await prisma.staff.update({
            where: { staff_id: staffId },
            data: { password_hash: hashedPassword }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Password update error:', error)
        return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน' }, { status: 500 })
    }
}
