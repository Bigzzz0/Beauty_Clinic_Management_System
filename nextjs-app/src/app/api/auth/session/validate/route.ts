import { NextRequest, NextResponse } from 'next/server'
import { authenticateStaffRequest } from '@/lib/staff-auth'

export async function GET(request: NextRequest) {
    const authResult = await authenticateStaffRequest(request)

    if (!authResult.ok) {
        return NextResponse.json({ valid: false, error: authResult.error }, { status: authResult.status })
    }

    return NextResponse.json({
        valid: true,
        staffId: authResult.staff.staff_id,
        position: authResult.staff.position,
        mustChangePassword: authResult.staff.must_change_password,
    })
}
