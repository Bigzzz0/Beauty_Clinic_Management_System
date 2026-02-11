import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { addDays, startOfDay, endOfDay } from 'date-fns'

export async function GET() {
    try {
        const now = new Date();
        const nextWeek = addDays(now, 7);

        const upcomingCourses = await prisma.customer_course.findMany({
            where: {
                status: 'ACTIVE',
                expiry_date: {
                    gte: startOfDay(now),
                    lte: endOfDay(nextWeek)
                }
            },
            include: {
                customer: true,
                course: true
            },
            orderBy: {
                expiry_date: 'asc'
            }
        });

        // แปลงรูปแบบให้ตรงกับ UI (Mockเดิม)
        const formattedData = upcomingCourses.map(item => ({
            time: item.expiry_date ? new Date(item.expiry_date).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) : 'ไม่ระบุ',
            customer: item.customer?.full_name || 'ไม่ระบุชื่อ',
            service: item.course?.course_name || 'ไม่ระบุบริการ',
            remaining: item.remaining_sessions
        }));

        return NextResponse.json(formattedData);
    } catch (error) {
        console.error('Upcoming Appointments Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}