import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function run() {
    try {
        const newAppointment = await prisma.appointment.create({
            data: {
                customer_id: 1,
                appointment_date: new Date(),
                duration_minutes: 60,
                doctor_id: null,
                therapist_id: null,
                notes: null,
                status: 'SCHEDULED'
            }
        });
        console.log('success', newAppointment);
    } catch (e) {
        console.error('Error', e);
    } finally {
        await prisma.$disconnect();
    }
}
run();
