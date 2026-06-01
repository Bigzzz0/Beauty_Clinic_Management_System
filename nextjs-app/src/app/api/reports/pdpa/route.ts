import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authenticateStaffRequest } from '@/lib/staff-auth'

export async function GET(request: NextRequest) {
    try {
        const authResult = await authenticateStaffRequest(request)
        if (!authResult.ok) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status })
        }

        // Fetch basic counts
        const totalPatients = await prisma.customer.count({
            where: { is_active: true }
        })

        // Fetch consent counts
        // PDPA Privacy
        const pdpaGranted = await prisma.customer_consent.count({
            where: {
                consent_type: 'PDPA_PRIVACY',
                is_granted: true,
                customer: { is_active: true }
            }
        })

        // Marketing
        const marketingGranted = await prisma.customer_consent.count({
            where: {
                consent_type: 'MARKETING',
                is_granted: true,
                customer: { is_active: true }
            }
        })

        // Medical Treatment
        const medicalGranted = await prisma.customer_consent.count({
            where: {
                consent_type: 'MEDICAL_TREATMENT',
                is_granted: true,
                customer: { is_active: true }
            }
        })

        // Anonymized patients (whose first_name has been anonymized, e.g. starts with 'Anonymized_')
        const anonymizedCount = await prisma.customer.count({
            where: {
                first_name: {
                    startsWith: 'Anonymized_'
                }
            }
        })

        // List of patients with active or upcoming appointments in the next 7 days who have NOT granted PDPA_PRIVACY consent yet
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const sevenDaysLater = new Date(today)
        sevenDaysLater.setDate(today.getDate() + 7)

        const upcomingAppointments = await prisma.appointment.findMany({
            where: {
                appointment_date: {
                    gte: today,
                    lte: sevenDaysLater
                },
                status: 'SCHEDULED'
            },
            include: {
                customer: {
                    select: {
                        customer_id: true,
                        hn_code: true,
                        full_name: true,
                        phone_number: true,
                        customer_consent: {
                            where: {
                                consent_type: 'PDPA_PRIVACY'
                            },
                            orderBy: {
                                consent_date: 'desc'
                            },
                            take: 1
                        }
                    }
                }
            },
            orderBy: {
                appointment_date: 'asc'
            }
        })

        // Filter out those who have given consent
        const pendingPDPAAppointments = upcomingAppointments
            .map((app) => {
                const latestConsent = app.customer.customer_consent[0]
                const isConsentGranted = latestConsent ? latestConsent.is_granted : false
                return {
                    appointment_id: app.id,
                    appointment_date: app.appointment_date,
                    customer_id: app.customer.customer_id,
                    hn_code: app.customer.hn_code,
                    full_name: app.customer.full_name,
                    phone_number: app.customer.phone_number,
                    is_pdpa_granted: isConsentGranted
                }
            })
            .filter((p) => !p.is_pdpa_granted)

        return NextResponse.json({
            stats: {
                totalPatients,
                pdpaGranted,
                pdpaPending: totalPatients - pdpaGranted,
                marketingGranted,
                marketingPending: totalPatients - marketingGranted,
                medicalGranted,
                medicalPending: totalPatients - medicalGranted,
                anonymizedCount
            },
            pendingPDPAAppointments: pendingPDPAAppointments.slice(0, 15) // Limit to top 15
        })
    } catch (error) {
        console.error('PDPA report error:', error)
        return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการดึงรายงานข้อมูลความเป็นส่วนตัว' }, { status: 500 })
    }
}
