import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { logAudit } from '@/lib/audit'
import { z } from 'zod'

const loginSchema = z.object({
  username: z.string().min(1, 'กรุณากรอกชื่อผู้ใช้'),
  password: z.string().min(1, 'กรุณากรอกรหัสผ่าน'),
})

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const parseResult = loginSchema.safeParse(body)
        
        if (!parseResult.success) {
            return NextResponse.json(
                { error: parseResult.error.issues[0].message },
                { status: 400 }
            )
        }
        
        const { username, password } = parseResult.data

        const staff = await prisma.staff.findUnique({
            where: { username },
        })

        if (!staff || !staff.is_active) {
            return NextResponse.json(
                { error: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' },
                { status: 401 }
            )
        }

        // Artificial Delay Throttle to prevent Brute-Force without Account Lockout (DoS prevention)
        const currentAttempts = staff.login_attempts || 0
        if (currentAttempts >= 5) {
            await new Promise((resolve) => setTimeout(resolve, 3000))
        }

        const isValidPassword = bcrypt.compareSync(password, staff.password_hash)
        if (!isValidPassword) {
            const updatedAttempts = currentAttempts + 1
            await prisma.staff.update({
                where: { staff_id: staff.staff_id },
                data: {
                    login_attempts: updatedAttempts,
                    locked_until: null 
                }
            })

            return NextResponse.json(
                { error: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' },
                { status: 401 }
            )
        }

        // Reset attempts on successful login
        if (currentAttempts > 0) {
            await prisma.staff.update({
                where: { staff_id: staff.staff_id },
                data: {
                    login_attempts: 0,
                    locked_until: null
                }
            })
        }

        const jwtSecret = process.env.JWT_SECRET
        if (!jwtSecret) {
            throw new Error('FATAL ERROR: JWT_SECRET environment variable is not set.')
        }

        const token = jwt.sign(
            {
                staff_id: staff.staff_id,
                position: staff.position,
                token_version: staff.token_version,
                must_change_password: staff.must_change_password,
            },
            jwtSecret,
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
