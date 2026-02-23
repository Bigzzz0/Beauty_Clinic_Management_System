import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { addDays, startOfDay, endOfDay } from 'date-fns'

export async function GET() {
    try {
        const now = new Date();
        const nextWeek = addDays(now, 7);

        const upcomingAppointments = await (prisma as any).appointment.findMany({
            where: {
                status: 'SCHEDULED',
                appointment_date: {
                    gte: startOfDay(now),
                    lte: endOfDay(now)
                }
            },
            include: {
                customer: true,
                customer_course: {
                    include: {
                        course: true
                    }
                }
            },
            orderBy: {
                appointment_date: 'asc'
            }
        });

        const formattedData = (upcomingAppointments as any[]).map((item: any) => {
            const time = new Date(item.appointment_date).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
            const serviceName = item.customer_course?.course?.course_name || 'บริการทั่วไป'
            return {
                time: time,
                customer: item.customer?.full_name || item.customer?.first_name || 'ไม่ระบุชื่อ',
                service: serviceName,
            }
        });

        return NextResponse.json(formattedData);
    } catch (error) {
        console.error('Upcoming Appointments Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}