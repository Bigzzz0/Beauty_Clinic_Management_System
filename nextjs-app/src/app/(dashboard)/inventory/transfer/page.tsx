'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Truck, Plus, Trash2, Upload, ArrowLeft, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
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
}

interface TransferRow {
    id: string
    product_id: number | null
    qty_main: number
}

const branches = [
    { value: 'branch_2', label: 'สาขา 2 - เซ็นทรัล' },
    { value: 'branch_3', label: 'สาขา 3 - เมกาบางนา' },
    { value: 'warehouse', label: 'คลังกลาง' },
]

export default function TransferPage() {
    const router = useRouter()
    const token = useAuthStore((s) => s.token)

    const [destination, setDestination] = useState('')
    const [rows, setRows] = useState<TransferRow[]>([
        { id: '1', product_id: null, qty_main: 1 }
    ])
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

    const transferMutation = useMutation({
        mutationFn: async (data: { items: { product_id: number; qty_main: number }[]; destination: string; evidence_image: string; note?: string }) => {
            const res = await fetch('/api/inventory/transfer', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify(data),
            })
            if (!res.ok) {
                const err = await res.json()
                throw new Error(err.error || 'Failed')
            }
            return res.json()
        },
        onSuccess: () => {
            toast.success('โอนย้ายสินค้าสำเร็จ')
            router.push('/inventory')
        },
        onError: (error: Error) => {
            toast.error(error.message || 'เกิดข้อผิดพลาด')
        },
    })

    const addRow = () => {
        setRows([...rows, { id: Date.now().toString(), product_id: null, qty_main: 1 }])
    }

    const removeRow = (id: string) => {
        if (rows.length > 1) {
            setRows(rows.filter(row => row.id !== id))
        }
    }

    const updateRow = (id: string, field: keyof TransferRow, value: unknown) => {
        setRows(rows.map(row => row.id === id ? { ...row, [field]: value } : row))
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
        if (!destination) {
            toast.error('กรุณาเลือกปลายทาง')
            return
        }
        if (!evidenceImage) {
            toast.error('กรุณาถ่ายรูปพัสดุก่อนส่ง')
            return
        }

        const validRows = rows.filter(row => row.product_id && row.qty_main > 0)
        if (validRows.length === 0) {
            toast.error('กรุณาเพิ่มสินค้าอย่างน้อย 1 รายการ')
            return
        }

        transferMutation.mutate({
            items: validRows.map(row => ({
                product_id: row.product_id!,
                qty_main: row.qty_main,
            })),
            destination,
            evidence_image: evidenceImage,
            note: note || undefined,
        })
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Truck className="h-6 w-6 text-blue-500" />
                        โอนย้าย / ส่งออก
                    </h1>
                    <p className="text-slate-500">โอนสินค้าไปยังสาขาอื่น</p>
                </div>
            </div>

            <Alert variant="destructive" className="bg-amber-50 border-amber-200">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-800">
                    ⚠️ กรุณาถ่ายรูปพัสดุก่อนจัดส่ง (บังคับ)
                </AlertDescription>
            </Alert>

            {/* Form */}
            <Card>
                <CardHeader>
                    <CardTitle>รายละเอียดการโอนย้าย</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Destination */}
                    <div>
                        <Label>ปลายทาง *</Label>
                        <Select value={destination} onValueChange={setDestination}>
                            <SelectTrigger>
                                <SelectValue placeholder="เลือกปลายทาง" />
                            </SelectTrigger>
                            <SelectContent>
                                {branches.map((b) => (
                                    <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Items */}
                    <div className="space-y-3">
                        <Label>รายการสินค้า (พิมพ์ค้นหาได้)</Label>
                        {rows.map((row) => (
                            <div key={row.id} className="grid gap-4 md:grid-cols-12 items-end p-4 bg-slate-50 rounded-lg">
                                <div className="md:col-span-7">
                                    <ProductSearchSelect
                                        products={products}
                                        value={row.product_id}
                                        onSelect={(id) => updateRow(row.id, 'product_id', id)}
                                        placeholder="ค้นหาสินค้า..."
                                    />
                                </div>

                                <div className="md:col-span-4">
                                    <Input
                                        type="number"
                                        min={1}
                                        value={row.qty_main}
                                        onChange={(e) => updateRow(row.id, 'qty_main', parseInt(e.target.value) || 0)}
                                        placeholder="จำนวน"
                                    />
                                </div>

                                <div className="md:col-span-1">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="text-red-500"
                                        onClick={() => removeRow(row.id)}
                                        disabled={rows.length === 1}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}

                        <Button variant="outline" onClick={addRow} className="w-full">
                            <Plus className="h-4 w-4 mr-2" />
                            เพิ่มรายการ
                        </Button>
                    </div>

                    {/* Note */}
                    <div>
                        <Label>หมายเหตุ</Label>
                        <Textarea
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            placeholder="หมายเหตุเพิ่มเติม..."
                            rows={2}
                        />
                    </div>

                    {/* Photo Upload - Mandatory */}
                    <div>
                        <Label className="text-red-600">รูปถ่ายพัสดุ (บังคับ) *</Label>
                        <div className="mt-2 flex items-center gap-4">
                            <label className="cursor-pointer">
                                <div className={`flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-slate-50 ${!evidenceImage ? 'border-red-300 bg-red-50' : ''}`}>
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
                            className="bg-gradient-to-r from-blue-500 to-blue-600"
                            onClick={handleSubmit}
                            disabled={transferMutation.isPending}
                        >
                            {transferMutation.isPending ? 'กำลังบันทึก...' : 'ยืนยันโอนย้าย'}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
