'use client'

import { useState } from 'react'
import Image from 'next/image'
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
    sub_unit: string
    inventory?: {
        full_qty: number
        opened_qty: number
    }[]
}

interface TransferRow {
    id: string
    product_id: number | null
    qty: number | ''
    unit_type: 'MAIN' | 'SUB'
}

const branches = [
    { value: 'sakon', label: 'สกลนคร' },
    { value: 'mahasarakham', label: 'มหาสารคาม' },
    { value: 'chonburi', label: 'ชลบุรี' },
    { value: 'khonkaen', label: 'ขอนแก่น' },
    { value: 'warehouse', label: 'คลังกลาง' },
]

export default function TransferPage() {
    const router = useRouter()
    const token = useAuthStore((s) => s.token)

    const [destination, setDestination] = useState('')
    const [reason, setReason] = useState('')
    const [rows, setRows] = useState<TransferRow[]>([
        { id: '1', product_id: null, qty: 1, unit_type: 'MAIN' }
    ])
    const [note, setNote] = useState('')
    const [evidenceImage, setEvidenceImage] = useState<string | null>(null)
    const [imagePreview, setImagePreview] = useState<string | null>(null)

    const { data: outReasons = [] } = useQuery<{ id: number, name: string }[]>({
        queryKey: ['categories-out-reason'],
        queryFn: async () => {
            const res = await fetch(`/api/categories?type=INVENTORY_OUT_REASON`)
            if (!res.ok) return [] // Fallback if no endpoint exists yet or fails
            return res.json()
        },
    })

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
        mutationFn: async (data: { items: { product_id: number; qty: number; unit_type: 'MAIN' | 'SUB' }[]; destination?: string; evidence_image?: string; note?: string; reason?: string }) => {
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
        setRows([...rows, { id: Date.now().toString(), product_id: null, qty: 1, unit_type: 'MAIN' }])
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
        if (!reason) {
            toast.error('กรุณาเลือกสาเหตุการเบิก/โอน')
            return
        }

        const isTransfer = reason.includes('โอนย้าย') || reason.includes('Transfer')

        if (isTransfer) {
            if (!destination) {
                toast.error('กรุณาเลือกปลายทาง')
                return
            }
            if (!evidenceImage) {
                toast.error('กรุณาถ่ายรูปพัสดุก่อนส่งสำหรับการโอนย้าย')
                return
            }
        }

        const validRows = rows.filter(row => row.product_id && Number(row.qty) > 0)
        if (validRows.length === 0) {
            toast.error('กรุณาเพิ่มสินค้าอย่างน้อย 1 รายการ')
            return
        }

        transferMutation.mutate({
            items: validRows.map(row => ({
                product_id: row.product_id!,
                qty: Number(row.qty),
                unit_type: row.unit_type,
            })),
            destination: isTransfer ? destination : undefined,
            evidence_image: evidenceImage || undefined,
            note: note || undefined,
            reason: reason,
        })
    }

    const isTransferForm = reason.includes('โอนย้าย') || reason.includes('Transfer') || !reason // Default to true if not selected just to show warning but not strict

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
                        เบิกจ่าย / โอนย้าย
                    </h1>
                    <p className="text-muted-foreground">บันทึกการเบิกใช้สินค้าหรือโอนย้ายระหว่างสาขา</p>
                </div>
            </div>

            {isTransferForm && (
                <Alert variant="destructive" className="bg-warning/10 border-warning/20 text-warning">
                    <AlertTriangle className="h-4 w-4 text-warning" />
                    <AlertDescription className="text-warning-foreground">
                        ⚠️ กรุณาถ่ายรูปพัสดุก่อนจัดส่งสำหรับการโอนย้าย (บังคับ)
                    </AlertDescription>
                </Alert>
            )}

            {/* Form */}
            <Card>
                <CardHeader>
                    <CardTitle>รายละเอียดการเบิก/โอน</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Reason */}
                    <div>
                        <Label>สาเหตุ *</Label>
                        <Select value={reason} onValueChange={setReason}>
                            <SelectTrigger>
                                <SelectValue placeholder="เลือกสาเหตุ" />
                            </SelectTrigger>
                            <SelectContent>
                                {outReasons.map((r) => (
                                    <SelectItem key={r.name} value={r.name}>{r.name}</SelectItem>
                                ))}
                                {outReasons.length === 0 && (
                                    <>
                                        <SelectItem value="โอนย้าย (Transfer)">โอนย้าย (Transfer)</SelectItem>
                                        <SelectItem value="ใช้ในคลินิก (Clinic Use)">ใช้ในคลินิก (Clinic Use)</SelectItem>
                                        <SelectItem value="สินค้าชำรุด/หมดอายุ (Damaged/Expired)">สินค้าชำรุด/หมดอายุ (Damaged/Expired)</SelectItem>
                                    </>
                                )}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Destination */}
                    {(isTransferForm || destination) && (
                        <div>
                            <Label>ปลายทาง {isTransferForm && '*'}</Label>
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
                    )}

                    {/* Items */}
                    <div className="space-y-3">
                        <Label>รายการสินค้า (พิมพ์ค้นหาได้)</Label>
                        {rows.map((row) => (
                            <div key={row.id} className="p-4 bg-muted/50 rounded-lg space-y-3">
                                <div className="grid gap-4 md:grid-cols-12 items-end">
                                    <div className="md:col-span-7">
                                        <ProductSearchSelect
                                            products={products}
                                            value={row.product_id}
                                            onSelect={(id) => updateRow(row.id, 'product_id', id)}
                                            placeholder="ค้นหาสินค้า..."
                                        />
                                    </div>

                                    <div className="md:col-span-4 flex gap-2">
                                        <div className="flex-1">
                                            <Label>จำนวน</Label>
                                            <Input
                                                type="number"
                                                min={1}
                                                value={row.qty || ''}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    updateRow(row.id, 'qty', val === '' ? '' : parseInt(val, 10));
                                                }}
                                                placeholder="จำนวน"
                                            />
                                        </div>
                                        <div className="w-[120px]">
                                            <Label>หน่วย</Label>
                                            <Select
                                                value={row.unit_type}
                                                onValueChange={(val) => updateRow(row.id, 'unit_type', val)}
                                                disabled={!row.product_id}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="MAIN">{products.find(p => p.product_id === row.product_id)?.main_unit || 'หน่วยใหญ่'}</SelectItem>
                                                    <SelectItem value="SUB">{products.find(p => p.product_id === row.product_id)?.sub_unit || 'หน่วยย่อย'}</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
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
                                {row.product_id && (() => {
                                    const product = products.find(p => p.product_id === row.product_id);
                                    const inv = product?.inventory?.[0];
                                    if (!inv) return null;
                                    return (
                                        <div className="text-sm font-medium text-blue-600 pl-1">
                                            คงเหลือ: {inv.full_qty} {product.main_unit}
                                            {inv.opened_qty > 0 ? ` (และ ${inv.opened_qty} ${product.sub_unit})` : ''}
                                        </div>
                                    );
                                })()}
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

                    {/* Photo Upload */}
                    {(isTransferForm || evidenceImage) && (
                        <div>
                            <Label className={isTransferForm ? "text-red-600" : ""}>รูปถ่ายพัสดุ/หลักฐาน {isTransferForm ? '(บังคับ) *' : '(ถ้ามี)'}</Label>
                            <div className="mt-2 flex items-center gap-4">
                                <label className="cursor-pointer">
                                    <div className={`flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-muted/50 ${isTransferForm && !evidenceImage ? 'border-destructive/30 bg-destructive/10' : ''}`}>
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
                    )}

                    {/* Submit */}
                    <div className="flex justify-end gap-4 pt-4 border-t">
                        <Button variant="outline" onClick={() => router.back()}>
                            ยกเลิก
                        </Button>
                        <Button
                            className="bg-blue-600 hover:bg-blue-700"
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
