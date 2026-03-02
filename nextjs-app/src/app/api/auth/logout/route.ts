import { NextResponse } from 'next/server'
import { logAudit } from '@/lib/audit'
import jwt from 'jsonwebtoken'

export async function POST(request: Request) {
    const response = NextResponse.json({ success: true, message: 'Logged out successfully' })

    // Log the logout action if we can identify the user from the cookie
    let staffId = null
    try {
        const tokenCookie = request.headers.get('cookie')?.match(/auth_token=([^;]+)/)?.[1]
        if (tokenCookie) {
            const decoded = jwt.verify(tokenCookie, process.env.JWT_SECRET || 'fallback-secret-key') as { staff_id?: number; id?: number }
            staffId = decoded.staff_id || decoded.id
            if (staffId) {
                await logAudit({
                    action: 'LOGOUT',
                    target_resource: `Staff_${staffId}`,
                    // Don't pass the full request to NextRequest expectations if we don't have it matching
                    staffId: staffId
                })
            }
        }
    } catch {
        // ignore errors on decode during logout
    }

    // Clear the cookie
    response.cookies.set({
        name: 'auth_token',
        value: '',
        httpOnly: true,
        expires: new Date(0),
        path: '/',
    })

    return response
}
