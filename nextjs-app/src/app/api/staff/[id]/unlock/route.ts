import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authenticateStaffRequest, isAdminPosition } from '@/lib/staff-auth'
import { logAudit } from '@/lib/audit'

export async function POST(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const authResult = await authenticateStaffRequest(request)
        if (!authResult.ok) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status })
        }

        if (!isAdminPosition(authResult.staff.position)) {
            return NextResponse.json({ error: 'สิทธิ์เข้าใช้งานไม่เพียงพอ (ต้องการระดับแอดมิน)' }, { status: 403 })
        }

        const { id } = await context.params
        const staffId = parseInt(id, 10)
        if (isNaN(staffId) || staffId <= 0) {
            return NextResponse.json({ error: 'Invalid staff id' }, { status: 400 })
        }

        const targetStaff = await prisma.staff.findUnique({
            where: { staff_id: staffId },
            select: { staff_id: true, full_name: true, login_attempts: true }
        })

        if (!targetStaff) {
            return NextResponse.json({ error: 'ไม่พบรายชื่อพนักงาน' }, { status: 404 })
        }

        // Reset attempts
        await prisma.staff.update({
            where: { staff_id: staffId },
            data: {
                login_attempts: 0,
                locked_until: null
            }
        })

        // Log audit
        await logAudit({
            action: 'UPDATE',
            target_resource: `StaffSecurityUnlock_${staffId}`,
            details: {
                message: `Admin unlocked staff account ${targetStaff.full_name}`,
                previous_login_attempts: targetStaff.login_attempts
            },
            request,
            staffId: authResult.staff.staff_id
        })

        return NextResponse.json({
            success: true,
            message: `ปลดล็อกบัญชีของ ${targetStaff.full_name} เรียบร้อยแล้ว`
        })
    } catch (error) {
        console.error('Unlock staff account error:', error)
        return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการปลดล็อกบัญชีพนักงาน' }, { status: 500 })
    }
}
