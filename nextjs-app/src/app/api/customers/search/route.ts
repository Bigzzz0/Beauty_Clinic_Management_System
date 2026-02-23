import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const q = searchParams.get('q') || ''

        if (q.length < 2) {
            return NextResponse.json([])
        }

        const customers = await prisma.customer.findMany({
            where: {
                AND: [
                    {
                        OR: [
                            { first_name: { contains: q } },
                            { last_name: { contains: q } },
                            { hn_code: { contains: q } },
                            { phone_number: { contains: q } },
                            { full_name: { contains: q } },
                        ],
                    },
                    { first_name: { notIn: ['Admin', 'admin', 'System Admin'] } },
                ],
            },
            take: 10,
            orderBy: { created_at: 'desc' },
        })

        return NextResponse.json(customers)
    } catch (error) {
        console.error('Error searching customers:', error)
        return NextResponse.json(
            { error: 'Failed to search customers' },
            { status: 500 }
        )
    }
}
