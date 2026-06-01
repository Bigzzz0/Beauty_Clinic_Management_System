const { PrismaClient } = require('@prisma/client');
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
        require('fs').writeFileSync('prisma_out.txt', 'success: ' + JSON.stringify(newAppointment));
    } catch (e) {
        require('fs').writeFileSync('prisma_out.txt', 'Error: ' + e.message + '\n\nStack:\n' + e.stack);
    } finally {
        await prisma.$disconnect();
    }
}
run();
