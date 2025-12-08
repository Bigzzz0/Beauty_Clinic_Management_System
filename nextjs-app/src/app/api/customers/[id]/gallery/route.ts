import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import path from 'path'
import fs from 'fs/promises'

interface Params {
  params: Promise<{ id: string }>
}

// GET /api/customers/[id]/gallery - Get patient gallery
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const customerId = parseInt(id)

    const gallery = await prisma.patient_gallery.findMany({
      where: { customer_id: customerId },
      include: {
        service_usage: {
          select: {
            service_name: true,
          },
        },
      },
      orderBy: [
        { taken_date: 'desc' },
        { image_type: 'asc' }, // Before comes before After
      ],
    })

    // Group by date
    const grouped: Record<string, typeof gallery> = {}
    gallery.forEach((img) => {
      const dateKey = new Date(img.taken_date).toISOString().split('T')[0]
      if (!grouped[dateKey]) {
        grouped[dateKey] = []
      }
      grouped[dateKey].push(img)
    })

    return NextResponse.json({
      images: gallery,
      grouped,
    })
  } catch (error) {
    console.error('Error fetching gallery:', error)
    return NextResponse.json(
      { error: 'Failed to fetch gallery' },
      { status: 500 }
    )
  }
}

// POST /api/customers/[id]/gallery - Upload image
export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const customerId = parseInt(id)
    const body = await request.json()

    const { image_data, image_type, notes, taken_date, usage_id } = body as {
      image_data: string
      image_type: 'Before' | 'After'
      notes?: string
      taken_date?: string
      usage_id?: number
    }

    if (!image_data) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 })
    }

    // Save image to uploads folder
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'gallery')
    await fs.mkdir(uploadsDir, { recursive: true })

    const timestamp = Date.now()
    const fileName = `gallery_${customerId}_${timestamp}.jpg`
    const filePath = path.join(uploadsDir, fileName)

    // Extract base64 data and save
    const base64Data = image_data.replace(/^data:image\/\w+;base64,/, '')
    await fs.writeFile(filePath, base64Data, 'base64')

    // Save to database
    const gallery = await prisma.patient_gallery.create({
      data: {
        customer_id: customerId,
        usage_id: usage_id || null,
        image_type: image_type,
        image_path: `/uploads/gallery/${fileName}`,
        taken_date: taken_date ? new Date(taken_date) : new Date(),
        notes: notes || null,
      },
    })

    return NextResponse.json(gallery, { status: 201 })
  } catch (error) {
    console.error('Error uploading gallery image:', error)
    return NextResponse.json(
      { error: 'Failed to upload image' },
      { status: 500 }
    )
  }
}
