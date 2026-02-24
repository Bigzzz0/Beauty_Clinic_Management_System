import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const customerSchema = z.object({
    first_name: z.string().min(1, 'ต้องระบุชื่อจริง').max(50, 'ชื่อจริงต้องไม่เกิน 50 ตัวอักษร'),
    last_name: z.string().min(1, 'ต้องระบุนามสกุล').max(50, 'นามสกุลต้องไม่เกิน 50 ตัวอักษร'),
    phone_number: z.string().min(9, 'เบอร์โทรศัพท์ต้องมีอย่างน้อย 9 หลัก').max(15, 'เบอร์โทรศัพท์ยาวเกินไป').regex(/^[0-9+() -]+$/, 'รูปแบบเบอร์โทรศัพท์ไม่ถูกต้อง'),
    id_card_number: z.string().nullable().optional(),
    nickname: z.string().nullable().optional(),
    address: z.string().nullable().optional(),
    birth_date: z.union([z.string(), z.date()]).nullable().optional(),
    drug_allergy: z.string().nullable().optional(),
    underlying_disease: z.string().nullable().optional(),
    member_level: z.string().nullable().optional(),
})
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '10')
        const search = searchParams.get('search') || ''
        const sortBy = searchParams.get('sortBy') || 'created_at'
        const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc'
        const hasDebt = searchParams.get('hasDebt') === 'true'

        const skip = (page - 1) * limit

        // Build search conditions - supports HN, nickname, first/last name, phone
        const searchConditions = search ? {
            OR: [
                { hn_code: { contains: search } },
                { first_name: { contains: search } },
                { last_name: { contains: search } },
                { full_name: { contains: search } },
                { nickname: { contains: search } },
                { phone_number: { contains: search } },
            ],
        } : {}

        // Build base query
        const whereCondition: any = { ...searchConditions }
        if (hasDebt) {
            const debtTx = await prisma.transaction_header.groupBy({
                by: ['customer_id'],
                where: { remaining_balance: { gt: 0 } },
            })
            const baseCustomerIdsWithDebt = debtTx.map(t => t.customer_id)
            whereCondition.customer_id = { in: baseCustomerIdsWithDebt }
        }

        // Fetch paginated customers without heavy transaction data
        const customers = await prisma.customer.findMany({
            where: whereCondition,
            skip,
            take: limit,
            select: {
                customer_id: true,
                hn_code: true,
                first_name: true,
                last_name: true,
                full_name: true,
                nickname: true,
                phone_number: true,
                member_level: true,
                drug_allergy: true,
                underlying_disease: true,
                created_at: true,
            }
        })

        // Fetch aggregated stats for these customers only
        const customerIds = customers.map(c => c.customer_id)

        const stats = customerIds.length > 0 ? await prisma.transaction_header.groupBy({
            by: ['customer_id'],
            where: { customer_id: { in: customerIds } },
            _sum: { remaining_balance: true },
            _max: { transaction_date: true },
        }) : []

        const statsMap = new Map(stats.map(s => [
            s.customer_id,
            {
                debt: Number(s._sum.remaining_balance || 0),
                lastVisit: s._max.transaction_date
            }
        ]))

        // Add calculated fields
        const customersWithStats = customers.map((c) => {
            const stat = statsMap.get(c.customer_id) || { debt: 0, lastVisit: null }

            return {
                customer_id: c.customer_id,
                hn_code: c.hn_code,
                first_name: c.first_name,
                last_name: c.last_name,
                full_name: c.full_name,
                nickname: c.nickname,
                phone_number: c.phone_number,
                member_level: c.member_level,
                drug_allergy: c.drug_allergy,
                underlying_disease: c.underlying_disease,
                created_at: c.created_at,
                total_debt: stat.debt,
                last_visit: stat.lastVisit,
            }
        })

        // Sorting will be handled correctly with JS logic

        // Sort
        customersWithStats.sort((a, b) => {
            if (sortBy === 'name') {
                const valA = a.full_name || `${a.first_name} ${a.last_name}`;
                const valB = b.full_name || `${b.first_name} ${b.last_name}`;
                return sortOrder === 'asc' ? valA.localeCompare(valB, 'th') : valB.localeCompare(valA, 'th');
            }

            let valA: any = null
            let valB: any = null

            if (sortBy === 'last_visit') {
                if (!a.last_visit && b.last_visit) return 1;
                if (a.last_visit && !b.last_visit) return -1;
                if (!a.last_visit && !b.last_visit) return 0;
                valA = new Date(a.last_visit!).getTime()
                valB = new Date(b.last_visit!).getTime()
            } else if (sortBy === 'debt') {
                valA = a.total_debt
                valB = b.total_debt
            } else {
                if (!a.created_at && b.created_at) return 1;
                if (a.created_at && !b.created_at) return -1;
                if (!a.created_at && !b.created_at) return 0;
                valA = new Date(a.created_at!).getTime()
                valB = new Date(b.created_at!).getTime()
            }

            if (valA === valB) return 0;
            if (sortOrder === 'asc') return valA > valB ? 1 : -1;
            return valA < valB ? 1 : -1;
        })

        const total = await prisma.customer.count({ where: whereCondition })

        return NextResponse.json({
            data: customersWithStats,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        })
    } catch (error) {
        console.error('Error fetching customers:', error)
        return NextResponse.json(
            { error: 'Failed to fetch customers' },
            { status: 500 }
        )
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()

        const parseResult = customerSchema.safeParse(body)
        if (!parseResult.success) {
            return NextResponse.json(
                { error: parseResult.error.issues[0].message },
                { status: 400 }
            )
        }

        // Generate HN code
        const timestamp = Date.now().toString(36).toUpperCase()
        const random = Math.random().toString(36).substring(2, 5).toUpperCase()
        const hn_code = `HN${timestamp}${random}`

        const customer = await prisma.customer.create({
            data: {
                hn_code,
                first_name: body.first_name,
                last_name: body.last_name,
                phone_number: body.phone_number,
                id_card_number: body.id_card_number || null,
                nickname: body.nickname || null,
                address: body.address || null,
                birth_date: body.birth_date ? new Date(body.birth_date) : null,
                drug_allergy: body.drug_allergy || null,
                underlying_disease: body.underlying_disease || null,
                member_level: body.member_level || 'General',
            },
        })

        return NextResponse.json(customer, { status: 201 })
    } catch (error: any) {
        console.error('Error creating customer:', error)
        return NextResponse.json(
            { error: error?.message || 'Failed to create customer' },
            { status: 500 }
        )
    }
}
