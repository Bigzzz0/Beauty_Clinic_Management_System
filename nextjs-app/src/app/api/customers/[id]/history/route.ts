import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

interface Params {
    params: Promise<{ id: string }>
}

// GET /api/customers/[id]/history - Get treatment history
export async function GET(request: NextRequest, { params }: Params) {
    try {
        const { id } = await params
        const customerId = parseInt(id)

        // Get all service usages for this customer
        const history = await prisma.service_usage.findMany({
            where: {
                customer_id: customerId,
            },
            include: {
                inventory_usage: {
                    include: {
                        product: {
                            select: {
                                product_name: true,
                                sub_unit: true,
                            },
                        },
                    },
                },
                fee_log: {
                    include: {
                        staff: {
                            select: {
                                full_name: true,
                                position: true,
                            },
                        },
                    },
                },
                customer_course: {
                    include: {
                        course: {
                            select: {
                                course_name: true,
                            },
                        },
                    },
                },
            },
            orderBy: {
                service_date: 'desc',
            },
        })

        // Format response
        const formatted = history.map((h) => {
            // Find doctor from fee_log (DF fee type usually means doctor)
            const doctorFee = h.fee_log.find((f) => f.fee_type === 'DF')

            return {
                usage_id: h.usage_id,
                service_date: h.service_date,
                service_name: h.service_name,
                note: h.note,
                course_name: h.customer_course?.course?.course_name || null,
                doctor: doctorFee?.staff?.full_name || null,
                products: h.inventory_usage.map((iu) => ({
                    product_name: iu.product.product_name,
                    qty_used: iu.qty_used,
                    unit: iu.product.sub_unit,
                    lot_number: iu.lot_number,
                })),
            }
        })

        return NextResponse.json(formatted)
    } catch (error) {
        console.error('Error fetching treatment history:', error)
        return NextResponse.json(
            { error: 'Failed to fetch treatment history' },
            { status: 500 }
        )
    }
}
