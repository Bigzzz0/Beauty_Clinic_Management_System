import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { logAudit } from '@/lib/audit'

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

        // Check brute-force lock
        if (staff.locked_until && new Date() < new Date(staff.locked_until)) {
            return NextResponse.json(
                { error: 'บัญชีถูกล็อคชั่วคราวเนื่องจากป้อนรหัสผิดหลายครั้ง โปรดลองใหม่ในภายหลัง' },
                { status: 429 }
            )
        }

        const isValidPassword = bcrypt.compareSync(password, staff.password_hash)
        if (!isValidPassword) {
            const updatedAttempts = (staff.login_attempts || 0) + 1
            const isLocked = updatedAttempts >= 5
            await prisma.staff.update({
                where: { staff_id: staff.staff_id },
                data: {
                    login_attempts: updatedAttempts,
                    locked_until: isLocked ? new Date(Date.now() + 5 * 60 * 1000) : null // Lock for 5 mins
                }
            })

            return NextResponse.json(
                { error: isLocked ? 'บัญชีถูกล็อคชั่วคราว 5 นาทีเนื่องจากป้อนรหัสผิดหลายครั้ง' : 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' },
                { status: 401 }
            )
        }

        // Reset attempts on successful login
        if ((staff.login_attempts && staff.login_attempts > 0) || staff.locked_until) {
            await prisma.staff.update({
                where: { staff_id: staff.staff_id },
                data: {
                    login_attempts: 0,
                    locked_until: null
                }
            })
        }

        const token = jwt.sign(
            { staff_id: staff.staff_id, position: staff.position },
            process.env.JWT_SECRET || 'fallback-secret-key',
            { expiresIn: '30d' }
        )

        await logAudit({
            action: 'LOGIN',
            target_resource: `Staff_${staff.staff_id}`,
            request,
            staffId: staff.staff_id
        })

        const userWithoutPassword = { ...staff } as Partial<typeof staff>
        delete userWithoutPassword.password_hash

        const response = NextResponse.json({
            token,
            user: {
                ...userWithoutPassword,
                created_at: userWithoutPassword.created_at?.toISOString() ?? null,
            },
        })

        // Set HTTP-Only Secure Cookie
        response.cookies.set({
            name: 'auth_token',
            value: token,
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 30 * 24 * 60 * 60, // 30 days
        })

        return response
    } catch (error) {
        console.error('Login error:', error)
        return NextResponse.json(
            { error: 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ' },
            { status: 500 }
        )
    }
}
