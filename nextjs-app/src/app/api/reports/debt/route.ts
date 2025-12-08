import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/reports/debt - Outstanding debt summary
export async function GET() {
    try {
        // Get all transactions with remaining balance
        const transactions = await prisma.transaction_header.findMany({
            where: {
                remaining_balance: { gt: 0 },
                payment_status: { not: 'VOIDED' },
            },
            include: {
                customer: {
                    select: {
                        customer_id: true,
                        hn_code: true,
                        first_name: true,
                        last_name: true,
                        phone_number: true,
                    },
                },
            },
            orderBy: { transaction_date: 'desc' },
        })

        // Group by customer
        const byCustomer: Record<number, {
            customer_id: number
            hn_code: string
            full_name: string
            phone_number: string
            total_debt: number
            oldest_date: Date
            transaction_count: number
        }> = {}

        transactions.forEach((t) => {
            const cid = t.customer_id
            if (!byCustomer[cid]) {
                byCustomer[cid] = {
                    customer_id: cid,
                    hn_code: t.customer.hn_code,
                    full_name: `${t.customer.first_name} ${t.customer.last_name}`,
                    phone_number: t.customer.phone_number,
                    total_debt: 0,
                    oldest_date: t.transaction_date,
                    transaction_count: 0,
                }
            }

            byCustomer[cid].total_debt += Number(t.remaining_balance)
            byCustomer[cid].transaction_count += 1
            if (t.transaction_date < byCustomer[cid].oldest_date) {
                byCustomer[cid].oldest_date = t.transaction_date
            }
        })

        const customers = Object.values(byCustomer).sort((a, b) => b.total_debt - a.total_debt)
        const totalDebt = customers.reduce((s, c) => s + c.total_debt, 0)

        // Age analysis
        const now = new Date()
        const ageGroups = {
            current: 0,    // < 30 days
            days30: 0,     // 30-60 days
            days60: 0,     // 60-90 days
            days90: 0,     // > 90 days
        }

        customers.forEach((c) => {
            const days = Math.floor((now.getTime() - c.oldest_date.getTime()) / (1000 * 60 * 60 * 24))
            if (days < 30) ageGroups.current += c.total_debt
            else if (days < 60) ageGroups.days30 += c.total_debt
            else if (days < 90) ageGroups.days60 += c.total_debt
            else ageGroups.days90 += c.total_debt
        })

        return NextResponse.json({
            summary: {
                totalDebt,
                customerCount: customers.length,
                transactionCount: transactions.length,
            },
            ageAnalysis: ageGroups,
            customers,
        })
    } catch (error) {
        console.error('Error generating debt report:', error)
        return NextResponse.json(
            { error: 'Failed to generate report' },
            { status: 500 }
        )
    }
}
