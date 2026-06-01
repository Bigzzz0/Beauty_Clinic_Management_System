import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth-rbac'

export const GET = withAuth(async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const month = parseInt(searchParams.get('month') || String(new Date().getMonth() + 1))
        const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()))

        const startDate = new Date(year, month - 1, 1)
        const endDate = new Date(year, month, 0, 23, 59, 59, 999)

        const movements = await prisma.stock_movement.findMany({
            where: {
                created_at: {
                    gte: startDate,
                    lte: endDate,
                },
            },
            include: {
                product: {
                    select: {
                        product_name: true,
                        product_code: true,
                        main_unit: true,
                        sub_unit: true,
                    },
                },
                staff: {
                    select: {
                        full_name: true,
                        position: true,
                    },
                },
            },
            orderBy: {
                created_at: 'desc',
            },
        })

        const movementLogs = movements.map((m) => ({
            movement_id: m.movement_id,
            created_at: m.created_at,
            action_type: m.action_type,
            qty_main: m.qty_main,
            qty_sub: m.qty_sub,
            note: m.note,
            evidence_image: m.evidence_image,
            product_name: m.product.product_name,
            product_code: m.product.product_code,
            main_unit: m.product.main_unit,
            sub_unit: m.product.sub_unit,
            staff_name: m.staff.full_name,
            staff_position: m.staff.position,
        }))

        return NextResponse.json({
            month,
            year,
            total: movementLogs.length,
            movement_logs: movementLogs,
        })
    } catch (error) {
        console.error('Error fetching inventory evidence:', error)
        return NextResponse.json(
            { error: 'Failed to fetch inventory evidence' },
            { status: 500 }
        )
    }
}, ['Admin'])
