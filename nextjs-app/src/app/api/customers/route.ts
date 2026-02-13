import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

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

        // Build search conditions
        const searchFilter: Prisma.CustomerWhereInput = search ? {
            OR: [
                { hn_code: { contains: search } },
                { first_name: { contains: search } },
                { last_name: { contains: search } },
                { full_name: { contains: search } },
                { nickname: { contains: search } },
                { phone_number: { contains: search } },
            ],
        } : {}

        // Combine search and debt filter
        const where: Prisma.CustomerWhereInput = {
            ...searchFilter,
            ...(hasDebt ? {
                transaction_header: {
                    some: {
                        remaining_balance: {
                            gt: 0
                        }
                    }
                }
            } : {})
        }

        // Build orderBy
        let orderBy: Prisma.CustomerOrderByWithRelationInput = { created_at: sortOrder }

        if (sortBy === 'name') {
            orderBy = { full_name: sortOrder }
        } else if (sortBy === 'last_visit') {
            orderBy = {
                transaction_header: {
                    _max: {
                        transaction_date: sortOrder
                    }
                }
            }
        } else if (sortBy === 'debt') {
            orderBy = {
                transaction_header: {
                    _sum: {
                        remaining_balance: sortOrder
                    }
                }
            }
        } else {
            orderBy = { created_at: sortOrder }
        }

        // Fetch customers with pagination, filtering and sorting in DB
        const [customers, total] = await Promise.all([
            prisma.customer.findMany({
                where,
                orderBy,
                skip,
                take: limit,
                include: {
                    personal_consultant: {
                        select: {
                            staff_id: true,
                            full_name: true,
                            position: true,
                        },
                    },
                },
            }),
            prisma.customer.count({ where })
        ])

        // ⚡ Bolt: Optimize by fetching aggregated stats separately instead of fetching all transactions
        const customerIds = customers.map(c => c.customer_id)

        const transactionStats = customerIds.length > 0 ? await prisma.transaction_header.groupBy({
            by: ['customer_id'],
            where: {
                customer_id: { in: customerIds }
            },
            _sum: {
                remaining_balance: true
            },
            _max: {
                transaction_date: true
            }
        }) : []

        const statsMap = new Map(transactionStats.map(s => [s.customer_id, s]))

        // Add calculated fields
        const customersWithStats = customers.map((c) => {
            const stats = statsMap.get(c.customer_id)

            return {
                customer_id: c.customer_id,
                hn_code: c.hn_code,
                first_name: c.first_name,
                last_name: c.last_name,
                full_name: c.full_name,
                nickname: c.nickname,
                phone_number: c.phone_number,
                member_level: c.member_level,
                personal_consult: c.personal_consult,
                personal_consult_id: c.personal_consult_id,
                personal_consultant: c.personal_consultant,
                drug_allergy: c.drug_allergy,
                underlying_disease: c.underlying_disease,
                created_at: c.created_at,
                total_debt: Number(stats?._sum.remaining_balance || 0),
                last_visit: stats?._max.transaction_date || null,
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

        // Generate HN code
        const timestamp = Date.now().toString(36).toUpperCase()
        const random = Math.random().toString(36).substring(2, 5).toUpperCase()
        const hn_code = `HN${timestamp}${random}`

        const customer = await prisma.customer.create({
            data: {
                hn_code,
                first_name: body.first_name,
                last_name: body.last_name,
                full_name: `${body.first_name} ${body.last_name}`,
                phone_number: body.phone_number,
                id_card_number: body.id_card_number || null,
                nickname: body.nickname || null,
                address: body.address || null,
                birth_date: body.birth_date ? new Date(body.birth_date) : null,
                drug_allergy: body.drug_allergy || null,
                underlying_disease: body.underlying_disease || null,
                personal_consult: body.personal_consult || null,
                personal_consult_id: body.personal_consult_id || null,
                member_level: body.member_level || 'General',
            },
        })

        return NextResponse.json(customer, { status: 201 })
    } catch (error) {
        console.error('Error creating customer:', error)
        return NextResponse.json(
            { error: 'Failed to create customer' },
            { status: 500 }
        )
    }
}
