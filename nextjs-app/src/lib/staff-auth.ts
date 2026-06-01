import { NextRequest } from 'next/server'
import jwt from 'jsonwebtoken'
import { staff_position } from '@prisma/client'
import { prisma } from '@/lib/prisma'

export const STAFF_POSITION_VALUES = ['Admin', 'Doctor', 'Therapist', 'Sale', 'Cashier'] as const

export type AuthenticatedStaff = {
    staff_id: number
    position: staff_position
    token_version: number
    must_change_password: boolean
}

type AuthResult =
    | { ok: true; staff: AuthenticatedStaff }
    | { ok: false; status: number; error: string }

function extractBearerToken(request: NextRequest): string | null {
    const authHeader = request.headers.get('authorization')
    if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.substring(7).trim()
        return token || null
    }

    const tokenCookie = request.cookies.get('auth_token')?.value?.trim()
    return tokenCookie || null
}

export async function authenticateStaffRequest(request: NextRequest): Promise<AuthResult> {
    const token = extractBearerToken(request)
    if (!token) {
        return { ok: false, status: 401, error: 'Unauthorized' }
    }

    const jwtSecret = process.env.JWT_SECRET
    if (!jwtSecret) {
        console.error('FATAL ERROR: JWT_SECRET environment variable is not set.')
        return { ok: false, status: 500, error: 'Internal Server Error' }
    }

    try {
        const decoded = jwt.verify(token, jwtSecret) as jwt.JwtPayload & {
            staff_id?: number
            token_version?: number
        }

        const staffId = Number(decoded.staff_id)
        const tokenVersion = Number(decoded.token_version)

        if (!Number.isInteger(staffId) || staffId <= 0 || !Number.isInteger(tokenVersion) || tokenVersion < 0) {
            return { ok: false, status: 401, error: 'Invalid token payload' }
        }

        const staff = await prisma.staff.findUnique({
            where: { staff_id: staffId },
            select: {
                staff_id: true,
                position: true,
                token_version: true,
                must_change_password: true,
                is_active: true,
            },
        })

        if (!staff || !staff.is_active) {
            return { ok: false, status: 401, error: 'Unauthorized' }
        }

        if (staff.token_version !== tokenVersion) {
            return { ok: false, status: 401, error: 'Session expired. Please login again.' }
        }

        return {
            ok: true,
            staff: {
                staff_id: staff.staff_id,
                position: staff.position,
                token_version: staff.token_version,
                must_change_password: staff.must_change_password,
            },
        }
    } catch {
        return { ok: false, status: 401, error: 'Invalid token' }
    }
}

export function isAdminPosition(position: string): boolean {
    return position === 'Admin'
}
