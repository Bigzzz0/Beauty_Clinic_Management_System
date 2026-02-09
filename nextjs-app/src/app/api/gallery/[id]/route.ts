import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import path from 'path'
import fs from 'fs/promises'

interface Params {
    params: Promise<{ id: string }>
}

// DELETE /api/gallery/[id] - Delete a gallery image
export async function DELETE(request: NextRequest, { params }: Params) {
    try {
        const { id } = await params
        const galleryId = parseInt(id)

        // 1. Find the image record
        const image = await prisma.patient_gallery.findUnique({
            where: { gallery_id: galleryId },
        })

        if (!image) {
            return NextResponse.json({ error: 'Image not found' }, { status: 404 })
        }

        // 2. Delete file from filesystem if it exists
        if (image.image_path) {
            try {
                // image_path is like "/uploads/gallery/gallery_1_1739...jpg"
                // We need to construct the absolute path
                const relativePath = image.image_path.startsWith('/')
                    ? image.image_path.substring(1)
                    : image.image_path

                const absolutePath = path.join(process.cwd(), 'public', relativePath)

                await fs.unlink(absolutePath)
                console.log(`Deleted file: ${absolutePath}`)
            } catch (err) {
                console.error('Error deleting file from filesystem:', err)
                // Continue to delete from DB even if file delete fails (maybe file was already gone)
            }
        }

        // 3. Delete from database
        await prisma.patient_gallery.delete({
            where: { gallery_id: galleryId },
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error deleting gallery image:', error)
        return NextResponse.json(
            { error: 'Failed to delete image' },
            { status: 500 }
        )
    }
}
