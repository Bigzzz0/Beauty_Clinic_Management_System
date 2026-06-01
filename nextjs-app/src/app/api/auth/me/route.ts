import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authenticateStaffRequest } from '@/lib/staff-auth'

export async function GET(request: NextRequest) {
    try {
        const authResult = await authenticateStaffRequest(request)
        if (!authResult.ok) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status })
        }

        const staff = await prisma.staff.findUnique({
            where: { staff_id: authResult.staff.staff_id },
        })

        if (!staff || !staff.is_active) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const userWithoutPassword: Partial<typeof staff> = { ...staff }
        delete userWithoutPassword.password_hash

        return NextResponse.json({
            ...userWithoutPassword,
            created_at: userWithoutPassword.created_at?.toISOString() ?? null,
        })
    } catch (error) {
        console.error('Auth check error:', error)
        return NextResponse.json(
            { error: 'เกิดข้อผิดพลาด' },
            { status: 500 }
        )
    }
}
