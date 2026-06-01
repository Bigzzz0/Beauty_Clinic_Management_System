import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authenticateStaffRequest, isAdminPosition } from '@/lib/staff-auth'

export async function GET(request: NextRequest) {
    try {
        const authResult = await authenticateStaffRequest(request)
        if (!authResult.ok) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status })
        }

        if (!isAdminPosition(authResult.staff.position)) {
            return NextResponse.json({ error: 'สิทธิ์เข้าใช้งานไม่เพียงพอ (ต้องการระดับแอดมิน)' }, { status: 403 })
        }

        const { searchParams } = new URL(request.url)
        const page = parseInt(searchParams.get('page') || '1', 10)
        const limit = parseInt(searchParams.get('limit') || '50', 10)
        const action = searchParams.get('action') || undefined
        const resource = searchParams.get('resource') || undefined
        const staffIdStr = searchParams.get('staffId') || undefined
        const search = searchParams.get('search') || undefined
        const startDateStr = searchParams.get('startDate') || undefined
        const endDateStr = searchParams.get('endDate') || undefined

        const skip = (page - 1) * limit

        // Build Prisma where filter
        const where: any = {}

        if (action) {
            where.action = action
        }

        if (resource) {
            where.target_resource = resource
        }

        if (staffIdStr) {
            const staffId = parseInt(staffIdStr, 10)
            if (!isNaN(staffId)) {
                where.user_id = staffId
            }
        }

        if (search) {
            where.OR = [
                { details: { contains: search } },
                { target_id: { contains: search } },
                { ip_address: { contains: search } },
            ]
        }

        if (startDateStr || endDateStr) {
            where.timestamp = {}
            if (startDateStr) {
                where.timestamp.gte = new Date(startDateStr)
            }
            if (endDateStr) {
                // Set to end of the day if it's just date string
                const endDate = new Date(endDateStr)
                if (endDateStr.length <= 10) {
                    endDate.setHours(23, 59, 59, 999)
                }
                where.timestamp.lte = endDate
            }
        }

        // Fetch logs and total count in parallel
        const [logs, total] = await Promise.all([
            prisma.audit_log.findMany({
                where,
                include: {
                    staff: {
                        select: {
                            staff_id: true,
                            full_name: true,
                            position: true,
                            username: true,
                        }
                    }
                },
                orderBy: {
                    timestamp: 'desc'
                },
                skip,
                take: limit,
            }),
            prisma.audit_log.count({ where }),
        ])

        return NextResponse.json({
            logs,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            }
        })
    } catch (error) {
        console.error('Fetch audit logs error:', error)
        return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการดึงข้อมูลประวัติระบบ' }, { status: 500 })
    }
}
