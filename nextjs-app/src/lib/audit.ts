import { prisma } from './prisma'
import { NextRequest } from 'next/server'
import jwt from 'jsonwebtoken'

export type AuditAction = 'CREATE' | 'READ' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'EXPORT'

interface AuditLogParams {
    action: AuditAction
    target_resource: string
    details?: unknown
    request?: NextRequest
    staffId?: number
}

export async function logAudit({ action, target_resource, details, request, staffId }: AuditLogParams) {
    try {
        let finalStaffId = staffId
        let ipAddress = 'unknown'

        if (request) {
            ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('remote-addr') || 'unknown'

            if (!finalStaffId) {
                const authHeader = request.headers.get('authorization')
                // Check both header and cookie for backward compatibility & migration
                let token = null
                if (authHeader?.startsWith('Bearer ') && authHeader !== 'Bearer null') {
                    token = authHeader.substring(7)
                } else {
                    token = request.cookies.get('auth_token')?.value
                }

                if (token && process.env.JWT_SECRET) {
                    try {
                        const decoded = jwt.verify(token, process.env.JWT_SECRET) as { staff_id?: number; id?: number }
                        finalStaffId = decoded.staff_id || decoded.id
                    } catch {
                        // ignore token errors for audit logging
                    }
                }

            }
        }

        await prisma.audit_log.create({
            data: {
                user_id: finalStaffId || null,
                action,
                target_resource,
                details: details ? JSON.stringify(details) : null,
                ip_address: ipAddress
            }
        })
    } catch (error) {
        console.error('Failed to write audit log:', error)
        // We don't throw here to prevent bringing down the main process if logging fails
    }
}
