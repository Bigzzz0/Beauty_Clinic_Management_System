import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { jwtVerify } from 'jose'

export async function GET(request: NextRequest) {
    try {
        // Decode token to find role
        let userRole = ''
        const authHeader = request.headers.get('authorization')
        let token = null
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.split(' ')[1]
        } else {
            token = request.cookies.get('auth_token')?.value
        }

        if (token) {
            try {
                if (!process.env.JWT_SECRET) {
                    throw new Error('JWT_SECRET is not configured in environment variables.')
                }
                const secret = new TextEncoder().encode(process.env.JWT_SECRET)
                const { payload } = await jwtVerify(token, secret)
                userRole = (payload.position as string) || ''
            } catch (e) {
                console.error("Failed to decode token in notifications", e)
            }
        }

        const canViewDebtors = ['Admin', 'Manager', 'Sale', 'Cashier'].includes(userRole)
        // Find inventory items with full_qty < 5
        const lowStockInventory = await prisma.inventory.findMany({
            where: {
                full_qty: {
                    lt: 5
                },
                product: {
                    is_active: true
                }
            },
            include: {
                product: true
            },
            orderBy: {
                full_qty: 'asc'
            }
        })

        // Find debtors (total_debt > 0) ONLY if authorized
        let debtors: any[] = []
        if (canViewDebtors) {
            // Find customers with outstanding transactions dynamically
            const debtorTransactions = await prisma.transaction_header.groupBy({
                by: ['customer_id'],
                where: { remaining_balance: { gt: 0 }, payment_status: { not: 'VOIDED' } },
                _sum: { remaining_balance: true },
                orderBy: {
                    _sum: {
                        remaining_balance: 'desc'
                    }
                },
                take: 20
            })

            const debtorIds = debtorTransactions.map(t => t.customer_id)
            if (debtorIds.length > 0) {
                const customerData = await prisma.customer.findMany({
                    where: { customer_id: { in: debtorIds } }
                })
                debtors = customerData.map(c => {
                    const debt = debtorTransactions.find(t => t.customer_id === c.customer_id)?._sum.remaining_balance || 0
                    return { ...c, total_debt: Number(debt) }
                })
            }
        }

        const notifications = lowStockInventory.map((item) => ({
            id: `low-stock-${item.inventory_id}`,
            title: 'สินค้าใกล้หมดสต็อก',
            description: `${item.product.product_name} เหลือเพียง ${item.full_qty} ${item.product.main_unit}`,
            type: 'alert',
            icon: 'package',
            link: `/inventory?search=${encodeURIComponent(item.product.product_code || item.product.product_name)}`,
            // Realtime time relative to server can be fetched, or just mapped to a static text for now
            time: 'ล่าสุด'
        }))

        const debtorNotifications = debtors.map((customer) => ({
            id: `debtor-${customer.customer_id}`,
            title: 'ลูกค้ายอดค้างชำระ',
            description: `${customer.first_name} ${customer.last_name || ''} มียอดค้างชำระ ฿${customer.total_debt.toLocaleString()}`,
            type: 'alert',
            icon: 'calendar', // UI currently supports 'package' or 'calendar', let's stick to these or add more securely if not strict. (calendar used safely)
            link: `/debtors?search=${encodeURIComponent(customer.hn_code)}`,
            time: 'ล่าสุด'
        }))

        return NextResponse.json({ notifications: [...notifications, ...debtorNotifications] })
    } catch (error) {
        console.error('Failed to fetch notifications:', error)
        return NextResponse.json({ error: 'Failed to evaluate notifications' }, { status: 500 })
    }
}
