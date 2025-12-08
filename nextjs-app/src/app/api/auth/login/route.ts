import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

export async function POST(request: NextRequest) {
    try {
        const { username, password } = await request.json()

        if (!username || !password) {
            return NextResponse.json(
                { error: 'กรุณากรอกชื่อผู้ใช้และรหัสผ่าน' },
                { status: 400 }
            )
        }

        const staff = await prisma.staff.findUnique({
            where: { username },
        })

        if (!staff || !staff.is_active) {
            return NextResponse.json(
                { error: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' },
                { status: 401 }
            )
        }

        const isValidPassword = bcrypt.compareSync(password, staff.password_hash)
        if (!isValidPassword) {
            return NextResponse.json(
                { error: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' },
                { status: 401 }
            )
        }

        const token = jwt.sign(
            { staff_id: staff.staff_id, position: staff.position },
            process.env.JWT_SECRET || 'fallback-secret-key',
            { expiresIn: '7d' }
        )

        const { password_hash: _, ...userWithoutPassword } = staff

        return NextResponse.json({
            token,
            user: {
                ...userWithoutPassword,
                created_at: userWithoutPassword.created_at.toISOString(),
            },
        })
    } catch (error) {
        console.error('Login error:', error)
        return NextResponse.json(
            { error: 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ' },
            { status: 500 }
        )
    }
}
