import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

function getStaffIdFromRequest(request: NextRequest): number | null {
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) return null
    try {
        const token = authHeader.substring(7)
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as { staff_id: number }
        return decoded.staff_id
    } catch {
        return null
    }
}

// GET: List pending services (treatments without stock deduction)
export async function GET() {
    try {
        // Get services that don't have inventory_usage records yet
        const pendingServices = await prisma.service_usage.findMany({
            where: {
                inventory_usage: {
                    none: {},
                },
            },
            include: {
                customer_course: {
                    include: {
                        customer: true,
                        course: true,
                    },
                },
            },
            orderBy: {
                service_date: 'desc',
            },
        })

        // Format response with session number
        const formatted = pendingServices.map((service) => {
            const cc = service.customer_course
            const total_sessions = cc?.total_sessions || 0
            const remaining_sessions = cc?.remaining_sessions || 0
            // Session number = total - remaining (this service already deducted 1)
            const session_number = total_sessions > 0 ? total_sessions - remaining_sessions : null

            return {
                usage_id: service.usage_id,
                service_date: service.service_date,
                service_name: service.service_name,
                note: service.note,
                customer_id: cc?.customer_id,
                customer_name: cc?.customer
                    ? `${cc.customer.first_name} ${cc.customer.last_name}`
                    : null,
                course_name: cc?.course?.course_name,
                session_number,
                total_sessions,
            }
        })

        return NextResponse.json(formatted)
    } catch (error) {
        console.error('Error fetching pending services:', error)
        return NextResponse.json(
            { error: 'Failed to fetch pending services' },
            { status: 500 }
        )
    }
}

interface UsageItem {
    product_id: number
    qty_used: number
}

// POST: Record usage and deduct from inventory (timestamp recorded automatically)
export async function POST(request: NextRequest) {
    try {
        const staffId = getStaffIdFromRequest(request)
        if (!staffId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { usage_id, items } = body as {
            usage_id: number
            items: UsageItem[]
        }

        if (!usage_id || !items || items.length === 0) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        // Verify service exists
        const service = await prisma.service_usage.findUnique({
            where: { usage_id },
        })

        if (!service) {
            return NextResponse.json({ error: 'Service not found' }, { status: 404 })
        }

        // Process each item
        await Promise.all(
            items.map(async (item) => {
                const product = await prisma.product.findUnique({
                    where: { product_id: item.product_id },
                })

                if (!product) {
                    throw new Error(`Product ${item.product_id} not found`)
                }

                const inventory = await prisma.inventory.findFirst({
                    where: { product_id: item.product_id },
                })

                if (!inventory) {
                    throw new Error(`No inventory for product ${product.product_name}`)
                }

                // Calculate deduction: opened first, then full
                let remainingToDeduct = item.qty_used
                let newOpenedQty = inventory.opened_qty
                let newFullQty = inventory.full_qty

                // Deduct from opened first
                if (newOpenedQty >= remainingToDeduct) {
                    newOpenedQty -= remainingToDeduct
                    remainingToDeduct = 0
                } else {
                    remainingToDeduct -= newOpenedQty
                    newOpenedQty = 0
                }

                // If still remaining, open new full units
                if (remainingToDeduct > 0 && newFullQty > 0) {
                    // Open a new full package
                    newFullQty -= 1
                    newOpenedQty += product.pack_size

                    // Deduct from newly opened
                    if (newOpenedQty >= remainingToDeduct) {
                        newOpenedQty -= remainingToDeduct
                        remainingToDeduct = 0
                    } else {
                        remainingToDeduct -= newOpenedQty
                        newOpenedQty = 0
                    }
                }

                // Create inventory_usage record
                await prisma.inventory_usage.create({
                    data: {
                        usage_id,
                        product_id: item.product_id,
                        qty_used: item.qty_used,
                    },
                })

                // Create stock movement (timestamp recorded automatically via created_at)
                await prisma.stock_movement.create({
                    data: {
                        product_id: item.product_id,
                        staff_id: staffId,
                        action_type: 'USAGE',
                        qty_main: 0,
                        qty_sub: item.qty_used,
                        related_usage_id: usage_id,
                    },
                })

                // Update inventory
                await prisma.inventory.update({
                    where: { inventory_id: inventory.inventory_id },
                    data: {
                        full_qty: Math.max(0, newFullQty),
                        opened_qty: Math.max(0, newOpenedQty),
                        last_updated: new Date(),
                    },
                })
            })
        )

        return NextResponse.json({ success: true }, { status: 201 })
    } catch (error) {
        console.error('Error recording usage:', error)
        const message = error instanceof Error ? error.message : 'Failed to record usage'
        return NextResponse.json({ error: message }, { status: 500 })
    }
}
