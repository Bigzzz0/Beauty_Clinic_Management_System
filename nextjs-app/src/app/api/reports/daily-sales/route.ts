import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/reports/daily-sales - Detailed daily sales report matching Excel format
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const dateParam = searchParams.get('date') || new Date().toISOString().split('T')[0]

        // Parse date for range query
        const startDate = new Date(dateParam)
        startDate.setHours(0, 0, 0, 0)
        const endDate = new Date(dateParam)
        endDate.setHours(23, 59, 59, 999)

        // Get all transactions for the day with full details
        const transactions = await prisma.transaction_header.findMany({
            where: {
                transaction_date: {
                    gte: startDate,
                    lte: endDate,
                },
                payment_status: { not: 'VOIDED' },
            },
            include: {
                customer: {
                    select: {
                        customer_id: true,
                        hn_code: true,
                        full_name: true,
                    },
                },
                transaction_item: {
                    include: {
                        product: {
                            select: {
                                product_id: true,
                                product_code: true,
                                product_name: true,
                                category: true,
                            },
                        },
                        course: {
                            select: {
                                course_id: true,
                                course_code: true,
                                course_name: true,
                            },
                        },
                    },
                },
                payment_log: {
                    select: {
                        payment_id: true,
                        amount_paid: true,
                        payment_method: true,
                        payment_date: true,
                    },
                },
            },
            orderBy: { transaction_id: 'asc' },
        })

        // Get fee logs for calculating commissions
        const feeLogsByTransaction: Record<number, Array<{
            staff_name: string
            position: string
            fee_type: string
            amount: number
        }>> = {}

        // Format detailed sales data matching Excel layout
        const salesDetails = transactions.map((t, index) => {
            // Calculate payment breakdown
            const cashPayment = t.payment_log
                .filter(p => p.payment_method === 'CASH')
                .reduce((sum, p) => sum + Number(p.amount_paid), 0)
            const transferPayment = t.payment_log
                .filter(p => p.payment_method === 'TRANSFER')
                .reduce((sum, p) => sum + Number(p.amount_paid), 0)
            const creditPayment = t.payment_log
                .filter(p => p.payment_method === 'CREDIT')
                .reduce((sum, p) => sum + Number(p.amount_paid), 0)

            // Build items description
            const itemsDescription = t.transaction_item.map(item => {
                const name = item.product?.product_name || item.course?.course_name || '-'
                const code = item.product?.product_code || item.course?.course_code || ''
                return `${code ? code + ' ' : ''}${name} x${item.qty}`
            }).join(' + ')

            return {
                rowNumber: index + 1,
                transactionId: t.transaction_id,
                hnCode: t.customer?.hn_code || '-',
                customerName: t.customer?.full_name || '-',
                items: itemsDescription,
                deposit: 0, // มัดจำ - placeholder for future deposit system
                transfer: transferPayment,
                credit: creditPayment,
                cash: cashPayment,
                totalAmount: Number(t.net_amount),
                paymentChannel: t.channel || 'WALK_IN',
                note: '',
                // Commission breakdown (placeholders - will be linked to commission_rate table)
                operationFee: 0, // ค่าดำเนินการ
                assistantFee: 0, // ค่าผู้ช่วยแพทย์
                staffFee: 0, // ค่าพนักงาน
                treatmentFee: 0, // พตร.ทรีทเมนต์
                handFee: 0, // ค่าหัดการทำ
                // Raw data for export
                transactionDate: t.transaction_date,
                items_raw: t.transaction_item.map(item => ({
                    name: item.product?.product_name || item.course?.course_name || '-',
                    code: item.product?.product_code || item.course?.course_code || '',
                    qty: item.qty,
                    unitPrice: Number(item.unit_price),
                    subtotal: Number(item.subtotal),
                    category: item.product?.category || 'Course',
                })),
                payments_raw: t.payment_log.map(p => ({
                    method: p.payment_method,
                    amount: Number(p.amount_paid),
                    date: p.payment_date,
                })),
            }
        })

        // Calculate daily summary
        const summary = {
            date: dateParam,
            transactionCount: transactions.length,
            totalSales: transactions.reduce((sum, t) => sum + Number(t.net_amount), 0),
            totalPaid: transactions.reduce((sum, t) =>
                sum + t.payment_log.reduce((ps, p) => ps + Number(p.amount_paid), 0), 0
            ),
            totalOutstanding: transactions.reduce((sum, t) => sum + Number(t.remaining_balance), 0),
            byPaymentMethod: {
                cash: salesDetails.reduce((sum, s) => sum + s.cash, 0),
                transfer: salesDetails.reduce((sum, s) => sum + s.transfer, 0),
                credit: salesDetails.reduce((sum, s) => sum + s.credit, 0),
                deposit: salesDetails.reduce((sum, s) => sum + s.deposit, 0),
            },
            commissionSummary: {
                operationFee: salesDetails.reduce((sum, s) => sum + s.operationFee, 0),
                assistantFee: salesDetails.reduce((sum, s) => sum + s.assistantFee, 0),
                staffFee: salesDetails.reduce((sum, s) => sum + s.staffFee, 0),
                treatmentFee: salesDetails.reduce((sum, s) => sum + s.treatmentFee, 0),
                handFee: salesDetails.reduce((sum, s) => sum + s.handFee, 0),
            },
        }

        return NextResponse.json({
            summary,
            details: salesDetails,
        })
    } catch (error) {
        console.error('Error generating daily sales report:', error)
        return NextResponse.json(
            { error: 'Failed to generate daily sales report' },
            { status: 500 }
        )
    }
}
