import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/reports/commission - Commission report by staff for payroll
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const month = searchParams.get('month') || new Date().toISOString().substring(0, 7)
        const staffId = searchParams.get('staffId')

        const startDate = new Date(month + '-01')
        const endDate = new Date(startDate)
        endDate.setMonth(endDate.getMonth() + 1)
        endDate.setDate(0) // Last day of month

        // Build where clause — fee_log doesn't have a date field,
        // so we filter via the related service_usage.service_date
        const where: Record<string, unknown> = {
            service_usage: {
                service_date: {
                    gte: startDate,
                    lte: endDate,
                },
            },
        }

        if (staffId) {
            where.staff_id = parseInt(staffId)
        }

        const feeLogs = await prisma.fee_log.findMany({
            where,
            include: {
                staff: {
                    select: {
                        staff_id: true,
                        full_name: true,
                        position: true,
                    },
                },
                service_usage: {
                    select: {
                        service_date: true,
                        service_name: true,
                    },
                },
            },
        })

        // Group by staff
        const byStaff: Record<number, {
            staff_id: number
            full_name: string
            position: string
            df_total: number
            hand_fee_total: number
            items: Array<{
                date: Date | null
                type: string
                amount: number
                item: string
            }>
        }> = {}

        feeLogs.forEach((fee) => {
            if (!fee.staff) return

            if (!byStaff[fee.staff.staff_id]) {
                byStaff[fee.staff.staff_id] = {
                    staff_id: fee.staff.staff_id,
                    full_name: fee.staff.full_name,
                    position: fee.staff.position,
                    df_total: 0,
                    hand_fee_total: 0,
                    items: [],
                }
            }

            const amount = Number(fee.amount)
            if (fee.fee_type === 'DF') {
                byStaff[fee.staff.staff_id].df_total += amount
            } else {
                byStaff[fee.staff.staff_id].hand_fee_total += amount
            }

            byStaff[fee.staff.staff_id].items.push({
                date: fee.service_usage?.service_date ?? null,
                type: fee.fee_type,
                amount,
                item: fee.service_usage?.service_name || '-',
            })
        })

        const result = Object.values(byStaff).map((s) => ({
            ...s,
            total: s.df_total + s.hand_fee_total,
        }))

        return NextResponse.json({
            month,
            staffSummary: result.sort((a, b) => b.total - a.total),
            grandTotal: {
                df: result.reduce((s, r) => s + r.df_total, 0),
                handFee: result.reduce((s, r) => s + r.hand_fee_total, 0),
                total: result.reduce((s, r) => s + r.total, 0),
            },
        })
    } catch (error) {
        console.error('Error generating commission report:', error)
        return NextResponse.json(
            { error: 'Failed to generate report' },
            { status: 500 }
        )
    }
}
