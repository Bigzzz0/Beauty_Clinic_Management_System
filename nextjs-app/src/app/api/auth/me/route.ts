import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

export async function GET(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization')
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const token = authHeader.substring(7)

        try {
            const decoded = jwt.verify(
                token,
                process.env.JWT_SECRET || 'fallback-secret-key'
            ) as { staff_id: number }

            const staff = await prisma.staff.findUnique({
                where: { staff_id: decoded.staff_id },
            })

            if (!staff || !staff.is_active) {
                return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
            }

            const { password_hash: _, ...userWithoutPassword } = staff

            return NextResponse.json({
                ...userWithoutPassword,
                created_at: userWithoutPassword.created_at?.toISOString(),
            })
        } catch {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
        }
    } catch (error) {
        console.error('Auth check error:', error)
        return NextResponse.json(
            { error: 'เกิดข้อผิดพลาด' },
            { status: 500 }
        )
    }
}
