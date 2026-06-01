import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { shouldMask, maskPhoneNumber } from '@/lib/masking'
import { encryptData } from '@/lib/encryption'
import jwt from 'jsonwebtoken'

const customerSchema = z.object({
    first_name: z.string().min(1, 'ต้องระบุชื่อจริง').max(50, 'ชื่อจริงต้องไม่เกิน 50 ตัวอักษร'),
    last_name: z.string().min(1, 'ต้องระบุนามสกุล').max(50, 'นามสกุลต้องไม่เกิน 50 ตัวอักษร'),
    phone_number: z.string().min(9, 'เบอร์โทรศัพท์ต้องมีอย่างน้อย 9 หลัก').max(15, 'เบอร์โทรศัพท์ยาวเกินไป').regex(/^[0-9+() -]+$/, 'รูปแบบเบอร์โทรศัพท์ไม่ถูกต้อง'),
    id_card_number: z.string()
        .regex(/^\d{13}$/, 'เลขบัตรประชาชนต้องเป็นตัวเลข 13 หลักเท่านั้น')
        .nullable()
        .optional(),

    nickname: z.string().nullable().optional(),
    address: z.string().nullable().optional(),
    birth_date: z.union([z.string(), z.date()]).nullable().optional(),
    drug_allergy: z.string().nullable().optional(),
    underlying_disease: z.string().nullable().optional(),
    member_level: z.string().nullable().optional(),
    consent_pdpa: z.boolean().optional().default(false),
    consent_marketing: z.boolean().optional().default(false),
})
export async function GET(request: NextRequest) {
    try {
        let userRole = 'General'
        const authHeader = request.headers.get('authorization')
        if (authHeader?.startsWith('Bearer ')) {
            const token = authHeader.substring(7)
            try {
                if (!process.env.JWT_SECRET) {
                    throw new Error('JWT_SECRET is not configured')
                }
                const decoded = jwt.verify(token, process.env.JWT_SECRET) as any
                userRole = decoded.position || decoded.role || 'General'
            } catch (err) {
                console.error('JWT verification failed:', err)
            }
        }
        const applyMask = shouldMask(userRole)

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

        // Fetch ALL matching IDs to compute global sort efficiently
        const allCustomerIdsDb = await prisma.customer.findMany({
            where: whereCondition,
            select: { customer_id: true, first_name: true, last_name: true, full_name: true, created_at: true }
        })
        const allCustomerIds = allCustomerIdsDb.map(c => c.customer_id)

        // Fetch aggregated stats for ALL matched customers
        const stats = allCustomerIds.length > 0 ? await prisma.transaction_header.groupBy({
            by: ['customer_id'],
            where: { customer_id: { in: allCustomerIds } },
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

        // Create a lightweight array to sort
        const sortableArray = allCustomerIdsDb.map(c => ({
            customer_id: c.customer_id,
            name: c.full_name || `${c.first_name} ${c.last_name}`,
            created_at: c.created_at,
            debt: statsMap.get(c.customer_id)?.debt || 0,
            lastVisit: statsMap.get(c.customer_id)?.lastVisit || null
        }))

        // Global Sort
        sortableArray.sort((a, b) => {
            if (sortBy === 'name') {
                return sortOrder === 'asc' ? a.name.localeCompare(b.name, 'th') : b.name.localeCompare(a.name, 'th');
            }

            let valA: any = null
            let valB: any = null

            if (sortBy === 'last_visit') {
                if (!a.lastVisit && b.lastVisit) return 1;
                if (a.lastVisit && !b.lastVisit) return -1;
                if (!a.lastVisit && !b.lastVisit) return 0;
                valA = new Date(a.lastVisit!).getTime()
                valB = new Date(b.lastVisit!).getTime()
            } else if (sortBy === 'debt') {
                valA = a.debt
                valB = b.debt
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

        const total = sortableArray.length
        
        // Paginate using slices
        const paginatedItems = sortableArray.slice(skip, skip + limit)
        const paginatedIds = paginatedItems.map(item => item.customer_id)

        // Fetch full details for the paginated slice
        const paginatedCustomers = await prisma.customer.findMany({
            where: { customer_id: { in: paginatedIds } },
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

        // Map them back into correct sorted order explicitly
        const customersWithStats = paginatedItems.map(sortItem => {
            const c = paginatedCustomers.find(pc => pc.customer_id === sortItem.customer_id)!
            return {
                customer_id: c.customer_id,
                hn_code: c.hn_code,
                first_name: c.first_name,
                last_name: c.last_name,
                full_name: c.full_name,
                nickname: c.nickname,
                phone_number: applyMask ? maskPhoneNumber(c.phone_number) : c.phone_number,
                member_level: c.member_level,
                drug_allergy: c.drug_allergy,
                underlying_disease: c.underlying_disease,
                created_at: c.created_at,
                total_debt: sortItem.debt,
                last_visit: sortItem.lastVisit,
            }
        })

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

        // Step 1: Insert with a temporary unique HN to get the auto-increment customer_id
        // HN-T- (5) + Base36 timestamp (~8) = ~13 chars → fits VARCHAR(20)
        const tempHn = `HN-T-${Date.now().toString(36)}`
        const tempCustomer = await prisma.customer.create({
            data: {
                hn_code: tempHn,
                first_name: body.first_name,
                last_name: body.last_name,
                phone_number: body.phone_number,
                id_card_number: body.id_card_number ? encryptData(body.id_card_number) : null,
                nickname: body.nickname || null,
                address: body.address || null,
                birth_date: body.birth_date ? new Date(body.birth_date) : null,
                drug_allergy: body.drug_allergy || null,
                underlying_disease: body.underlying_disease || null,
                member_level: body.member_level || 'General',
            },
        })

        // Step 2: Use the auto-increment customer_id to generate sequential HN-000001
        // This is safe from race conditions because customer_id is guaranteed unique by DB
        const hn_code = `HN-${String(tempCustomer.customer_id).padStart(6, '0')}`

        const customer = await prisma.customer.update({
            where: { customer_id: tempCustomer.customer_id },
            data: { hn_code },
        })

        // Step 3: Insert Consent records
        await prisma.customer_consent.createMany({
            data: [
                {
                    customer_id: tempCustomer.customer_id,
                    consent_type: 'PDPA_PRIVACY',
                    is_granted: body.consent_pdpa,
                    version: 'v1.0'
                },
                {
                    customer_id: tempCustomer.customer_id,
                    consent_type: 'MARKETING',
                    is_granted: body.consent_marketing,
                    version: 'v1.0'
                }
            ]
        });

        return NextResponse.json(customer, { status: 201 })
    } catch (error: any) {
        console.error('Error creating customer:', error)
        return NextResponse.json(
            { error: error?.message || 'Failed to create customer' },
            { status: 500 }
        )
    }
}
