const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
    console.log('Checking user: admin_may')
    const staff = await prisma.staff.findUnique({
        where: { username: 'admin_may' },
    })

    if (!staff) {
        console.log('User NOT FOUND.')
    } else {
        console.log('User FOUND.')
        console.log('ID:', staff.staff_id)
        console.log('Is Active:', staff.is_active)

        // Verify password '123'
        const isMatch = await bcrypt.compare('123', staff.password_hash)
        console.log('Password "123" match:', isMatch)

        if (!isMatch) {
            console.log('Updating password to "123"...')
            const hash = await bcrypt.hash('123', 10)
            await prisma.staff.update({
                where: { username: 'admin_may' },
                data: { password_hash: hash }
            })
            console.log('Password updated.')
        }
    }
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
