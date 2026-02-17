import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function GET() {
    try {
        const staff = await prisma.staff.findUnique({
            where: { username: 'admin_may' }
        })

        if (!staff) {
            return NextResponse.json({ status: 'User not found' })
        }

        const isMatch = await bcrypt.compare('123', staff.password_hash)

        return NextResponse.json({
            status: 'User found',
            id: staff.staff_id,
            isActive: staff.is_active,
            passwordMatch: isMatch,
            hash: staff.password_hash.substring(0, 10) + '...'
        })
    } catch (e: any) {
        return NextResponse.json({ error: e.message })
    }
}

export async function POST() {
    try {
        const hash = await bcrypt.hash('123', 10)
        const user = await prisma.staff.create({
            data: {
                username: 'admin_may',
                password_hash: hash,
                full_name: 'Admin May',
                position: 'Admin',
                is_active: true
            }
        })
        return NextResponse.json({ status: 'User created', user })
    } catch (e: any) {
        return NextResponse.json({ error: e.message })
    }
}
