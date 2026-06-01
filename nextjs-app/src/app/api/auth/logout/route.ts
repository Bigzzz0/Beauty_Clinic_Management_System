import { NextResponse } from 'next/server'
import { logAudit } from '@/lib/audit'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

export async function POST(request: Request) {
    const response = NextResponse.json({ success: true, message: 'Logged out successfully' })
    const jwtSecret = process.env.JWT_SECRET

    // Log the logout action if we can identify the user from the cookie
    let staffId = null
    try {
        const authHeader = request.headers.get('authorization')
        const tokenFromHeader = authHeader?.startsWith('Bearer ') ? authHeader.substring(7).trim() : null
        const tokenCookie = request.headers.get('cookie')?.match(/auth_token=([^;]+)/)?.[1]
        const token = tokenFromHeader || tokenCookie || null

        if (token && jwtSecret) {
            const decoded = jwt.verify(token, jwtSecret) as jwt.JwtPayload & { staff_id?: number; id?: number }
            staffId = decoded.staff_id || decoded.id
            if (staffId) {
                await prisma.staff.update({
                    where: { staff_id: staffId },
                    data: { token_version: { increment: 1 } },
                })

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
