'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { PackagePlus, Plus, Trash2, Upload, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { ProductSearchSelect } from '@/components/inventory/product-search-select'

interface Product {
    product_id: number
    product_code: string | null
    product_name: string
    category: string
    main_unit: string
    sub_unit: string
    pack_size: number
}

interface StockInRow {
    id: string
    product_id: number | null
    qty_main: number
}

export default function StockInPage() {
    const router = useRouter()
    const token = useAuthStore((s) => s.token)

    const [rows, setRows] = useState<StockInRow[]>([
        { id: '1', product_id: null, qty_main: 1 }
    ])
    const [note, setNote] = useState('')
    const [evidenceImage, setEvidenceImage] = useState<string | null>(null)
    const [imagePreview, setImagePreview] = useState<string | null>(null)

    // Fetch products
    const { data: products = [] } = useQuery<Product[]>({
        queryKey: ['products-list'],
        queryFn: async () => {
            const res = await fetch('/api/products', {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            })
            if (!res.ok) throw new Error('Failed to fetch products')
            return res.json()
        },
    })

    const stockInMutation = useMutation({
        mutationFn: async (data: { items: { product_id: number; qty_main: number }[]; evidence_image?: string; note?: string }) => {
            const res = await fetch('/api/inventory/stock-in', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify(data),
            })
            if (!res.ok) throw new Error('Failed to process stock in')
            return res.json()
        },
        onSuccess: () => {
            toast.success('รับสินค้าเข้าสำเร็จ')
            router.push('/inventory')
        },
        onError: () => {
            toast.error('เกิดข้อผิดพลาด กรุณาลองใหม่')
        },
    })

    const addRow = () => {
        setRows([
            ...rows,
            { id: Date.now().toString(), product_id: null, qty_main: 1 }
        ])
    }

    const removeRow = (id: string) => {
        if (rows.length > 1) {
            setRows(rows.filter(row => row.id !== id))
        }
    }

    const updateRow = (id: string, field: keyof StockInRow, value: unknown) => {
        setRows(rows.map(row =>
            row.id === id ? { ...row, [field]: value } : row
        ))
    }

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            const reader = new FileReader()
            reader.onloadend = () => {
                const base64 = reader.result as string
                setEvidenceImage(base64)
                setImagePreview(base64)
            }
            reader.readAsDataURL(file)
        }
    }

    const handleSubmit = () => {
        const validRows = rows.filter(row => row.product_id && row.qty_main > 0)
        if (validRows.length === 0) {
            toast.error('กรุณาเพิ่มสินค้าอย่างน้อย 1 รายการ')
            return
        }

        stockInMutation.mutate({
            items: validRows.map(row => ({
                product_id: row.product_id!,
                qty_main: row.qty_main,
            })),
            evidence_image: evidenceImage || undefined,
            note: note || undefined,
        })
    }

    const getProduct = (productId: number | null) =>
        products.find(p => p.product_id === productId)

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <PackagePlus className="h-6 w-6 text-emerald-600" />
                        รับสินค้าเข้า
                    </h1>
                    <p className="text-muted-foreground">บันทึกสินค้าเข้าคลัง (ระบบบันทึกวันเวลาอัตโนมัติ)</p>
                </div>
            </div>

            {/* Form */}
            <Card>
                <CardHeader>
                    <CardTitle>รายการสินค้า</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Dynamic rows */}
                    {rows.map((row) => {
                        const product = getProduct(row.product_id)
                        return (
                            <div key={row.id} className="grid gap-4 md:grid-cols-12 items-end p-4 bg-muted/50 rounded-lg">
                                <div className="md:col-span-7">
                                    <Label>สินค้า (พิมพ์ค้นหาได้)</Label>
                                    <ProductSearchSelect
                                        products={products}
                                        value={row.product_id}
                                        onSelect={(id) => updateRow(row.id, 'product_id', id)}
                                        placeholder="ค้นหาสินค้า..."
                                    />
                                </div>

                                <div className="md:col-span-4">
                                    <Label>จำนวน ({product?.main_unit || 'หน่วย'})</Label>
                                    <Input
                                        type="number"
                                        min={1}
                                        value={row.qty_main || ''}
                                        onChange={(e) => updateRow(row.id, 'qty_main', parseInt(e.target.value) || 0)}
                                    />
                                    {product && (
                                        <p className="text-xs text-slate-500 mt-1">
                                            = {row.qty_main * product.pack_size} {product.sub_unit}
                                        </p>
                                    )}
                                </div>

                                <div className="md:col-span-1">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="text-destructive"
                                        onClick={() => removeRow(row.id)}
                                        disabled={rows.length === 1}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        )
                    })}

                    <Button variant="outline" onClick={addRow} className="w-full">
                        <Plus className="h-4 w-4 mr-2" />
                        เพิ่มรายการ
                    </Button>

                    {/* Note */}
                    <div>
                        <Label>หมายเหตุ</Label>
                        <Textarea
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            placeholder="หมายเหตุเพิ่มเติม..."
                            rows={3}
                        />
                    </div>

                    {/* Photo Upload */}
                    <div>
                        <Label>รูปถ่ายใบส่งของ / สภาพกล่อง</Label>
                        <div className="mt-2 flex items-center gap-4">
                            <label className="cursor-pointer">
                                <div className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-slate-50">
                                    <Upload className="h-4 w-4" />
                                    <span>อัพโหลดรูป</span>
                                </div>
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleImageUpload}
                                />
                            </label>
                            {imagePreview && (
                                <Image
                                    src={imagePreview}
                                    alt="Preview"
                                    width={80}
                                    height={80}
                                    className="object-cover rounded-lg border"
                                />
                            )}
                        </div>
                    </div>

                    {/* Submit */}
                    <div className="flex justify-end gap-4 pt-4 border-t">
                        <Button variant="outline" onClick={() => router.back()}>
                            ยกเลิก
                        </Button>
                        <Button
                            className="bg-green-600 hover:bg-green-700 text-white"
                            onClick={handleSubmit}
                            disabled={stockInMutation.isPending}
                        >
                            {stockInMutation.isPending ? 'กำลังบันทึก...' : 'บันทึกรับสินค้า'}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
