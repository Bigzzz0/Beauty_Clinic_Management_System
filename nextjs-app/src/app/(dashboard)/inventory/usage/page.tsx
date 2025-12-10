'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Syringe, ArrowLeft, Plus, Trash2, ChevronDown, ChevronUp, Check } from 'lucide-react'
import { toast } from 'sonner'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth-store'
import { formatDateTime } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ProductSearchSelect } from '@/components/inventory/product-search-select'
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible'

interface PendingService {
    usage_id: number
    service_date: string
    service_name: string
    note: string | null
    customer_id: number | null
    customer_name: string | null
    course_name: string | null
    session_number: number | null
    total_sessions: number
}

interface Product {
    product_id: number
    product_code: string | null
    product_name: string
    category: string
    sub_unit: string
}

interface UsageRow {
    id: string
    product_id: number | null
    qty_used: number
}

export default function UsageRecordPage() {
    const router = useRouter()
    const queryClient = useQueryClient()
    const token = useAuthStore((s) => s.token)

    const [expandedService, setExpandedService] = useState<number | null>(null)
    const [usageRows, setUsageRows] = useState<Record<number, UsageRow[]>>({})

    // Fetch pending services
    const { data: pendingServices = [], isLoading } = useQuery<PendingService[]>({
        queryKey: ['pending-services'],
        queryFn: async () => {
            const res = await fetch('/api/inventory/usage', {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            })
            if (!res.ok) throw new Error('Failed to fetch')
            return res.json()
        },
    })

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

    const usageMutation = useMutation({
        mutationFn: async (data: { usage_id: number; items: { product_id: number; qty_used: number }[] }) => {
            const res = await fetch('/api/inventory/usage', {
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
            toast.success('บันทึกการใช้ยาสำเร็จ')
            queryClient.invalidateQueries({ queryKey: ['pending-services'] })
            queryClient.invalidateQueries({ queryKey: ['inventory'] })
            setExpandedService(null)
        },
        onError: (error: Error) => {
            toast.error(error.message || 'เกิดข้อผิดพลาด')
        },
    })

    const toggleService = (usageId: number) => {
        if (expandedService === usageId) {
            setExpandedService(null)
        } else {
            setExpandedService(usageId)
            // Initialize rows if not exists
            if (!usageRows[usageId]) {
                setUsageRows({
                    ...usageRows,
                    [usageId]: [{ id: '1', product_id: null, qty_used: 0 }]
                })
            }
        }
    }

    const addRow = (usageId: number) => {
        const current = usageRows[usageId] || []
        setUsageRows({
            ...usageRows,
            [usageId]: [...current, { id: Date.now().toString(), product_id: null, qty_used: 0 }]
        })
    }

    const removeRow = (usageId: number, rowId: string) => {
        const current = usageRows[usageId] || []
        if (current.length > 1) {
            setUsageRows({
                ...usageRows,
                [usageId]: current.filter(r => r.id !== rowId)
            })
        }
    }

    const updateRow = (usageId: number, rowId: string, field: keyof UsageRow, value: unknown) => {
        const current = usageRows[usageId] || []
        setUsageRows({
            ...usageRows,
            [usageId]: current.map(r => r.id === rowId ? { ...r, [field]: value } : r)
        })
    }

    const handleSubmit = (usageId: number) => {
        const rows = usageRows[usageId] || []
        const validRows = rows.filter(r => r.product_id && r.qty_used > 0)

        if (validRows.length === 0) {
            toast.error('กรุณาเพิ่มการใช้ยาอย่างน้อย 1 รายการ')
            return
        }

        usageMutation.mutate({
            usage_id: usageId,
            items: validRows.map(r => ({
                product_id: r.product_id!,
                qty_used: r.qty_used,
            }))
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
                        <Syringe className="h-6 w-6 text-primary" />
                        บันทึกการใช้ยา
                    </h1>
                    <p className="text-muted-foreground">ตัดสต๊อกจากการทำหัตถการ (ระบบบันทึกวันเวลาอัตโนมัติ)</p>
                </div>
            </div>

            {/* Pending Services */}
            <Card>
                <CardHeader>
                    <CardTitle>รอบันทึกการใช้ยา ({pendingServices.length})</CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="space-y-4">
                            {[...Array(3)].map((_, i) => (
                                <div key={i} className="h-20 animate-pulse rounded-lg bg-slate-100" />
                            ))}
                        </div>
                    ) : pendingServices.length === 0 ? (
                        <div className="py-12 text-center text-muted-foreground">
                            <Check className="h-12 w-12 mx-auto mb-4 text-success" />
                            <p>ไม่มีรายการรอบันทึก</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {pendingServices.map((service) => (
                                <Collapsible
                                    key={service.usage_id}
                                    open={expandedService === service.usage_id}
                                >
                                    <CollapsibleTrigger asChild>
                                        <div
                                            className="flex items-center justify-between p-4 rounded-lg bg-card border hover:bg-muted/50 transition-colors cursor-pointer"
                                            onClick={() => toggleService(service.usage_id)}
                                        >
                                            <div>
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <p className="font-medium">{service.customer_name || 'ลูกค้า'}</p>
                                                    <Badge variant="secondary">{service.service_name}</Badge>
                                                    {service.session_number && service.total_sessions > 0 && (
                                                        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                                                            ครั้งที่ {service.session_number}/{service.total_sessions}
                                                        </Badge>
                                                    )}
                                                </div>
                                                {service.course_name && (
                                                    <p className="text-sm text-muted-foreground">{service.course_name}</p>
                                                )}
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    {formatDateTime(service.service_date)}
                                                </p>
                                            </div>
                                            {expandedService === service.usage_id ? (
                                                <ChevronUp className="h-5 w-5 text-muted-foreground" />
                                            ) : (
                                                <ChevronDown className="h-5 w-5 text-muted-foreground" />
                                            )}
                                        </div>
                                    </CollapsibleTrigger>

                                    <CollapsibleContent>
                                        <div className="mt-4 p-4 border rounded-lg space-y-4">
                                            <Label>บันทึกการใช้ยา/อุปกรณ์ (พิมพ์ค้นหาได้)</Label>

                                            {(usageRows[service.usage_id] || []).map((row) => {
                                                const product = getProduct(row.product_id)
                                                return (
                                                    <div key={row.id} className="grid gap-4 md:grid-cols-12 items-end p-3 bg-muted/50 rounded-lg">
                                                        <div className="md:col-span-7">
                                                            <ProductSearchSelect
                                                                products={products}
                                                                value={row.product_id}
                                                                onSelect={(id) => updateRow(service.usage_id, row.id, 'product_id', id)}
                                                                placeholder="ค้นหาสินค้า..."
                                                            />
                                                        </div>

                                                        <div className="md:col-span-4">
                                                            <Input
                                                                type="number"
                                                                min={0}
                                                                value={row.qty_used}
                                                                onChange={(e) => updateRow(service.usage_id, row.id, 'qty_used', parseInt(e.target.value) || 0)}
                                                                placeholder={`จำนวน (${product?.sub_unit || 'หน่วย'})`}
                                                            />
                                                        </div>

                                                        <div className="md:col-span-1">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="text-destructive"
                                                                onClick={() => removeRow(service.usage_id, row.id)}
                                                                disabled={(usageRows[service.usage_id] || []).length === 1}
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                )
                                            })}

                                            <Button variant="outline" onClick={() => addRow(service.usage_id)} className="w-full">
                                                <Plus className="h-4 w-4 mr-2" />
                                                เพิ่มรายการ
                                            </Button>

                                            <div className="flex justify-end">
                                                <Button
                                                    variant="gradient"
                                                    onClick={() => handleSubmit(service.usage_id)}
                                                    disabled={usageMutation.isPending}
                                                >
                                                    {usageMutation.isPending ? 'กำลังบันทึก...' : 'บันทึกและตัดสต๊อก'}
                                                </Button>
                                            </div>
                                        </div>
                                    </CollapsibleContent>
                                </Collapsible>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
