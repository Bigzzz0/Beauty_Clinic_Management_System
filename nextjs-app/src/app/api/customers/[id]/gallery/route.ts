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
    
    const formData = await request.formData()
    
    const image_file = formData.get('image_file') as File | null
    const image_data = formData.get('image_data') as string | null
    const image_type = formData.get('image_type') as 'Before' | 'After'
    const notes = formData.get('notes') as string | null
    const taken_date = formData.get('taken_date') as string | null
    const usage_id = formData.get('usage_id') as string | null
    const is_marketing_allowed = formData.get('is_marketing_allowed') === 'true'

    if (!image_file && !image_data) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 })
    }

    // Save image to uploads folder
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'gallery')
    await fs.mkdir(uploadsDir, { recursive: true })

    const timestamp = Date.now()
    let filePath = ''
    let fileName = ''

    if (image_file) {
        // Binary FormData Path (Scalable)
        const ext = image_file.name.split('.').pop() || 'jpg'
        fileName = `gallery_${customerId}_${timestamp}.${ext}`
        filePath = path.join(uploadsDir, fileName)
        
        const arrayBuffer = await image_file.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)
        await fs.writeFile(filePath, buffer)
    } else if (image_data) {
        // Fallback Base64 JSON mechanism
        const match = image_data.match(/^data:image\/(\w+);base64,/)
        const ext = match ? match[1] : 'jpg'
        fileName = `gallery_${customerId}_${timestamp}.${ext}`
        filePath = path.join(uploadsDir, fileName)

        const base64Data = image_data.replace(/^data:image\/\w+;base64,/, '')
        await fs.writeFile(filePath, base64Data, 'base64')
    }

    // Save to database
    const gallery = await prisma.patient_gallery.create({
      data: {
        customer_id: customerId,
        usage_id: usage_id ? parseInt(usage_id) : null,
        image_type: image_type || 'Before',
        image_path: `/uploads/gallery/${fileName}`,
        taken_date: taken_date ? new Date(taken_date) : new Date(),
        notes: notes || null,
        is_marketing_allowed: is_marketing_allowed ?? false,
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
