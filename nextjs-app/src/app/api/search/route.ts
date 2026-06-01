import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const query = searchParams.get('q')

        if (!query || query.length < 2) {
            return NextResponse.json({ customers: [], products: [] })
        }

        const [customers, products] = await Promise.all([
            prisma.customer.findMany({
                where: {
                    OR: [
                        { first_name: { contains: query } },
                        { last_name: { contains: query } },
                        { hn_code: { contains: query } },
                        { phone_number: { contains: query } },
                        { nickname: { contains: query } },
                    ],
                },
                take: 5,
                select: {
                    customer_id: true,
                    first_name: true,
                    last_name: true,
                    hn_code: true,
                    phone_number: true,
                },
            }),
            prisma.product.findMany({
                where: {
                    OR: [
                        { product_name: { contains: query } },
                        { product_code: { contains: query } },
                    ],
                    is_active: true,
                },
                take: 5,
                select: {
                    product_id: true,
                    product_name: true,
                    product_code: true,
                    category: true,
                },
            }),
        ])

        return NextResponse.json({ customers, products })
    } catch (error) {
        console.error('Search error:', error)
        return NextResponse.json({ error: 'Failed to perform search' }, { status: 500 })
    }
}
