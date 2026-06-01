import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/export?type=customers|transactions|service-history
// Exports data as CSV for use in accounting or reporting software
// Optional query params: startDate, endDate (ISO date strings)
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'customers'
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    try {
        let csvContent = ''
        let filename = ''

        // --- EXPORT: Customer List ---
        if (type === 'customers') {
            const customers = await prisma.customer.findMany({
                where: { is_active: true },
                select: {
                    hn_code: true,
                    full_name: true,
                    phone_number: true,
                    birth_date: true,
                    member_level: true,
                    address: true,
                    created_at: true,
                },
                orderBy: { created_at: 'desc' },
            })

            const headers = ['HN Code', 'ชื่อ-นามสกุล', 'เบอร์โทร', 'วันเกิด', 'ระดับสมาชิก', 'ที่อยู่', 'วันที่สมัคร']
            const rows = customers.map(c => [
                c.hn_code ?? '',
                c.full_name ?? '',
                c.phone_number ?? '',
                c.birth_date ? new Date(c.birth_date).toLocaleDateString('th-TH') : '',
                c.member_level ?? '',
                (c.address ?? '').replace(/"/g, '""'),
                c.created_at ? new Date(c.created_at).toLocaleDateString('th-TH') : '',
            ])

            csvContent = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n')
            filename = `customers-export-${formatDateForFilename(new Date())}.csv`

        // --- EXPORT: Transaction / Sales History ---
        } else if (type === 'transactions') {
            const dateFilter = buildDateFilter(startDate, endDate, 'transaction_date')

            const transactions = await prisma.transaction_header.findMany({
                where: { is_cancelled: false, ...dateFilter },
                include: {
                    customer: { select: { hn_code: true, full_name: true } },
                    staff: { select: { full_name: true } },
                    transaction_item: {
                        include: {
                            product: { select: { product_name: true } },
                            course: { select: { course_name: true } },
                        },
                    },
                    payment_log: {
                        where: { is_cancelled: false },
                        select: { payment_method: true },
                    },
                },
                orderBy: { transaction_date: 'desc' },
            })

            const headers = [
                'เลขที่บิล', 'วันที่', 'HN', 'ชื่อลูกค้า', 'ผู้ขาย',
                'รายการ', 'ยอดรวม', 'ส่วนลด', 'ยอดสุทธิ', 'สถานะชำระ'
            ]
            const rows = transactions.flatMap(t => {
                const itemNames = t.transaction_item
                    .map(i => i.product?.product_name ?? i.course?.course_name ?? 'N/A')
                    .join('; ')
                const paymentMethods = [...new Set(t.payment_log.map(p => p.payment_method))].join(', ')

                // One row per transaction (not per item — for cleaner accounting export)
                return [[
                    t.transaction_id.toString(),
                    t.transaction_date ? new Date(t.transaction_date).toLocaleDateString('th-TH') : '',
                    t.customer?.hn_code ?? '',
                    t.customer?.full_name ?? '',
                    t.staff?.full_name ?? '',
                    itemNames,
                    t.total_amount?.toString() ?? '0',
                    t.discount?.toString() ?? '0',
                    t.net_amount?.toString() ?? '0',
                    paymentMethods,
                ]]
            })

            csvContent = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n')
            filename = `transactions-export-${formatDateForFilename(new Date())}.csv`

        // --- EXPORT: Service History ---
        } else if (type === 'service-history') {
            const dateFilter = buildDateFilter(startDate, endDate, 'service_date')

            const usages = await prisma.service_usage.findMany({
                where: dateFilter,
                include: {
                    customer: { select: { hn_code: true, full_name: true } },
                    customer_course: {
                        include: { course: { select: { course_name: true } } }
                    },
                    fee_log: {
                        include: { staff: { select: { full_name: true, position: true } } }
                    },
                },
                orderBy: { service_date: 'desc' },
            })

            const headers = [
                'วันที่ให้บริการ', 'HN', 'ชื่อลูกค้า',
                'บริการ/คอร์ส', 'ครั้งที่เหลือ',
                'แพทย์', 'ค่ามือแพทย์', 'ช่างเสริมสวย', 'ค่ามือช่าง',
                'หมายเหตุ'
            ]
            const rows = usages.map(u => {
                const doctorFees = u.fee_log.filter(f => f.fee_type === 'DF')
                const therapistFees = u.fee_log.filter(f => f.fee_type === 'HAND_FEE')

                const doctorNames = doctorFees
                    .map((f) => f.staff?.full_name)
                    .filter(Boolean)
                    .join('; ')

                const therapistNames = therapistFees
                    .map((f) => f.staff?.full_name)
                    .filter(Boolean)
                    .join('; ')

                const doctorFeeTotal = doctorFees.reduce((sum, f) => sum + Number(f.amount || 0), 0)
                const therapistFeeTotal = therapistFees.reduce((sum, f) => sum + Number(f.amount || 0), 0)

                return [
                    u.service_date ? new Date(u.service_date).toLocaleDateString('th-TH') : '',
                    u.customer?.hn_code ?? '',
                    u.customer?.full_name ?? '',
                    u.customer_course?.course?.course_name ?? u.service_name ?? '',
                    u.customer_course?.remaining_sessions?.toString() ?? 'N/A',
                    doctorNames,
                    doctorFeeTotal.toString(),
                    therapistNames,
                    therapistFeeTotal.toString(),
                    (u.note ?? '').replace(/"/g, '""'),
                ]
            })

            csvContent = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n')
            filename = `service-history-${formatDateForFilename(new Date())}.csv`

        } else {
            return NextResponse.json(
                { error: 'Invalid export type. Use: customers, transactions, or service-history' },
                { status: 400 }
            )
        }

        // Add UTF-8 BOM for proper Thai character rendering in Excel
        const bom = '\uFEFF'
        const csvBuffer = Buffer.from(bom + csvContent, 'utf-8')

        return new NextResponse(csvBuffer, {
            status: 200,
            headers: {
                'Content-Type': 'text/csv; charset=utf-8',
                'Content-Disposition': `attachment; filename="${filename}"`,
            },
        })
    } catch (error) {
        console.error('Export error:', error)
        return NextResponse.json({ error: 'Export failed' }, { status: 500 })
    }
}

function formatDateForFilename(date: Date): string {
    return date.toISOString().split('T')[0]
}

function buildDateFilter(startDate: string | null, endDate: string | null, field: string): Record<string, unknown> {
    if (!startDate && !endDate) return {}

    const filter: { gte?: Date; lte?: Date } = {}
    if (startDate) filter.gte = new Date(startDate)
    if (endDate) {
        const end = new Date(endDate)
        end.setHours(23, 59, 59, 999)
        filter.lte = end
    }

    return { [field]: filter }
}
