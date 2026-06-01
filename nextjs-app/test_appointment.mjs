import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    try {
        const newAppointment = await prisma.appointment.create({
            data: {
                customer_id: 1, // Assumes customer 1 exists
                appointment_date: new Date(),
                duration_minutes: 60,
                doctor_id: null,
                therapist_id: null,
                notes: null,
                status: 'SCHEDULED'
            }
        })
        console.log('Success:', newAppointment)
    } catch (error) {
        console.error('Error:', error)
    } finally {
        await prisma.$disconnect()
    }
}

main()
