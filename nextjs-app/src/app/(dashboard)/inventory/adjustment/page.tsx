'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ClipboardEdit, Upload, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { ProductSearchSelect } from '@/components/inventory/product-search-select'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'

interface Product {
    product_id: number
    product_code: string | null
    product_name: string
    category: string
    main_unit: string
    sub_unit: string
}

const reasons = [
    { value: 'ADJUST_DAMAGED', label: '🔨 ของเสีย / แตกหัก' },
    { value: 'ADJUST_EXPIRED', label: '📅 หมดอายุ' },
    { value: 'ADJUST_LOST', label: '❓ สูญหาย' },
]

export default function AdjustmentPage() {
    const router = useRouter()
    const token = useAuthStore((s) => s.token)

    const [productId, setProductId] = useState<number | null>(null)
    const [qtyMain, setQtyMain] = useState(0)
    const [qtySub, setQtySub] = useState(0)
    const [reason, setReason] = useState('')
    const [note, setNote] = useState('')
    const [evidenceImage, setEvidenceImage] = useState<string | null>(null)
    const [imagePreview, setImagePreview] = useState<string | null>(null)

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

    const adjustMutation = useMutation({
        mutationFn: async (data: { product_id: number; qty_main: number; qty_sub: number; reason: string; note: string; evidence_image?: string }) => {
            const res = await fetch('/api/inventory/adjustment', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify(data),
            })
            if (!res.ok) throw new Error('Failed')
            return res.json()
        },
        onSuccess: () => {
            toast.success('ปรับยอดสำเร็จ')
            router.push('/inventory')
        },
        onError: () => {
            toast.error('เกิดข้อผิดพลาด')
        },
    })

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
        if (!productId || !reason || !note) {
            toast.error('กรุณากรอกข้อมูลให้ครบ')
            return
        }
        if (qtyMain === 0 && qtySub === 0) {
            toast.error('กรุณาระบุจำนวน')
            return
        }

        adjustMutation.mutate({
            product_id: productId,
            qty_main: qtyMain,
            qty_sub: qtySub,
            reason,
            note,
            evidence_image: evidenceImage || undefined,
        })
    }

    const selectedProduct = products.find(p => p.product_id === productId)

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <ClipboardEdit className="h-6 w-6 text-warning" />
                        ปรับยอด / ของเสีย
                    </h1>
                    <p className="text-muted-foreground">บันทึกการปรับปรุงจำนวนสินค้า</p>
                </div>
            </div>

            {/* Form */}
            <Card>
                <CardHeader>
                    <CardTitle>รายละเอียดการปรับยอด</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Product Search */}
                    <div>
                        <Label>สินค้า (พิมพ์ค้นหาได้) *</Label>
                        <ProductSearchSelect
                            products={products}
                            value={productId}
                            onSelect={setProductId}
                            placeholder="ค้นหาสินค้า..."
                        />
                    </div>

                    {/* Quantities */}
                    <div className="grid gap-4 md:grid-cols-2">
                        <div>
                            <Label>จำนวน (หน่วยหลัก - {selectedProduct?.main_unit || 'กล่อง'})</Label>
                            <Input
                                type="number"
                                min={0}
                                value={qtyMain}
                                onChange={(e) => setQtyMain(parseInt(e.target.value) || 0)}
                            />
                        </div>
                        <div>
                            <Label>จำนวน (หน่วยย่อย - {selectedProduct?.sub_unit || 'หน่วย'})</Label>
                            <Input
                                type="number"
                                min={0}
                                value={qtySub}
                                onChange={(e) => setQtySub(parseInt(e.target.value) || 0)}
                            />
                        </div>
                    </div>

                    {/* Reason */}
                    <div>
                        <Label>สาเหตุ *</Label>
                        <Select value={reason} onValueChange={setReason}>
                            <SelectTrigger>
                                <SelectValue placeholder="เลือกสาเหตุ" />
                            </SelectTrigger>
                            <SelectContent>
                                {reasons.map((r) => (
                                    <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Note */}
                    <div>
                        <Label>หมายเหตุ / รายละเอียด *</Label>
                        <Textarea
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            placeholder="ระบุรายละเอียดเพิ่มเติม เช่น หล่นแตก, ถูกน้ำ, etc."
                            rows={3}
                        />
                    </div>

                    {/* Photo Upload */}
                    <div>
                        <Label>รูปถ่ายหลักฐาน (ถ้ามี)</Label>
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
                                <img
                                    src={imagePreview}
                                    alt="Preview"
                                    className="h-20 w-20 object-cover rounded-lg border"
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
                            className="bg-warning text-warning-foreground hover:bg-warning/90"
                            onClick={handleSubmit}
                            disabled={adjustMutation.isPending}
                        >
                            {adjustMutation.isPending ? 'กำลังบันทึก...' : 'บันทึกการปรับยอด'}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
