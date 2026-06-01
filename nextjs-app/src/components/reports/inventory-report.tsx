'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { formatDate } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { useAuthStore } from '@/stores/auth-store'

interface InventoryReport {
    summary: Array<{ action_type: string; count: number; qty: number }>
    movements: Array<{
        movement_id: number
        date: string
        product_code: string
        product_name: string
        action_type: string
        qty: number
        lot_number: string
        photo_url: string | null
        note: string
        staff: string
    }>
}

const ACTION_LABELS: Record<string, string> = {
    IN: 'รับเข้า',
    OUT: 'เบิกออก',
    TRANSFER: 'โอนย้าย',
    ADJUST_DAMAGED: 'ปรับ-เสียหาย',
    ADJUST_EXPIRED: 'ปรับ-หมดอายุ',
    ADJUST_CLAIM: 'ปรับ-เคลม',
    ADJUST_LOST: 'ปรับ-สูญหาย',
    USAGE: 'ใช้งาน',
    VOID_RETURN: 'คืนสต๊อก',
}

function getActionBadgeClass(actionType: string): string {
    if (actionType === 'IN') return 'bg-emerald-100 text-emerald-700 border-emerald-200'
    if (actionType === 'VOID_RETURN') return 'bg-emerald-50 text-emerald-600 border-emerald-200'
    if (actionType === 'OUT') return 'bg-red-100 text-red-700 border-red-200'
    if (actionType === 'USAGE') return 'bg-blue-100 text-blue-700 border-blue-200'
    if (actionType === 'TRANSFER') return 'bg-purple-100 text-purple-700 border-purple-200'
    if (actionType.startsWith('ADJUST')) return 'bg-orange-100 text-orange-700 border-orange-200'
    return 'bg-slate-100 text-slate-600 border-slate-200'
}

function getQtyDisplay(actionType: string, qty: number) {
    const isPositive = actionType === 'IN' || actionType === 'VOID_RETURN'
    const isNegative = actionType === 'OUT' || actionType === 'USAGE' || actionType.startsWith('ADJUST')
    if (isPositive) return <span className="font-semibold text-emerald-600">+{qty}</span>
    if (isNegative) return <span className="font-semibold text-red-500">-{qty}</span>
    return <span className="font-medium">{qty}</span>
}

export default function InventoryReportTab() {
    const token = useAuthStore((s) => s.token)
    const today = new Date()
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
    const [invStart, setInvStart] = useState(thirtyDaysAgo.toISOString().split('T')[0])
    const [invEnd, setInvEnd] = useState(today.toISOString().split('T')[0])
    const [invAction, setInvAction] = useState('')

    const { data: inventoryData, isLoading: inventoryLoading } = useQuery<InventoryReport>({
        queryKey: ['report-inventory', invStart, invEnd, invAction],
        queryFn: async () => {
            const params = new URLSearchParams()
            params.set('startDate', invStart)
            params.set('endDate', invEnd)
            if (invAction) params.set('actionType', invAction)
            const res = await fetch(`/api/reports/inventory?${params}`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            })
            return res.json()
        },
    })

    return (
        <div className="space-y-4">
            {/* Filter Bar */}
            <div className="flex flex-wrap gap-4 items-end p-4 bg-white rounded-xl border shadow-sm">
                <div>
                    <Label className="text-xs text-slate-500 uppercase tracking-wide mb-1 block">วันเริ่มต้น</Label>
                    <Input type="date" value={invStart} onChange={(e) => setInvStart(e.target.value)} className="w-40" />
                </div>
                <div>
                    <Label className="text-xs text-slate-500 uppercase tracking-wide mb-1 block">วันสิ้นสุด</Label>
                    <Input type="date" value={invEnd} onChange={(e) => setInvEnd(e.target.value)} className="w-40" />
                </div>
                <div>
                    <Label className="text-xs text-slate-500 uppercase tracking-wide mb-1 block">ประเภท</Label>
                    <Select value={invAction} onValueChange={setInvAction}>
                        <SelectTrigger className="w-44">
                            <SelectValue placeholder="ทั้งหมด" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">ทั้งหมด</SelectItem>
                            {Object.entries(ACTION_LABELS).map(([k, v]) => (
                                <SelectItem key={k} value={k}>{v}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Summary Badges */}
            {(inventoryData?.summary || []).length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {(inventoryData?.summary || []).map((s) => (
                        <div
                            key={s.action_type}
                            className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold ${getActionBadgeClass(s.action_type)}`}
                        >
                            <span>{ACTION_LABELS[s.action_type] || s.action_type}</span>
                            <span className="opacity-60">·</span>
                            <span>{s.count} ครั้ง</span>
                            <span className="opacity-60">·</span>
                            <span>{s.qty} หน่วย</span>
                        </div>
                    ))}
                </div>
            )}

            {/* Movement Log */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        รายการเคลื่อนไหวสินค้า
                        {inventoryData?.movements && (
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
                                {inventoryData.movements.length} รายการ
                            </span>
                        )}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="rounded-xl border overflow-hidden max-h-[500px] overflow-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-50 hover:bg-slate-50">
                                    <TableHead className="text-xs font-semibold uppercase tracking-wide text-slate-500">วันที่</TableHead>
                                    <TableHead className="text-xs font-semibold uppercase tracking-wide text-slate-500">รหัส</TableHead>
                                    <TableHead className="text-xs font-semibold uppercase tracking-wide text-slate-500">สินค้า</TableHead>
                                    <TableHead className="text-xs font-semibold uppercase tracking-wide text-slate-500">ประเภท</TableHead>
                                    <TableHead className="text-right text-xs font-semibold uppercase tracking-wide text-slate-500">จำนวน</TableHead>
                                    <TableHead className="text-xs font-semibold uppercase tracking-wide text-slate-500">Lot</TableHead>
                                    <TableHead className="text-xs font-semibold uppercase tracking-wide text-slate-500">ผู้ทำรายการ</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {inventoryLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-10">
                                            <div className="flex flex-col items-center gap-3 text-slate-400">
                                                <div className="h-7 w-7 rounded-full border-2 border-t-amber-500 border-amber-200 animate-spin" />
                                                <p className="text-sm">กำลังโหลด...</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (inventoryData?.movements || []).map((m) => (
                                    <TableRow key={m.movement_id} className="hover:bg-slate-50/60 transition-colors">
                                        <TableCell className="text-sm text-slate-500">{formatDate(m.date)}</TableCell>
                                        <TableCell className="font-mono text-xs text-slate-500">{m.product_code}</TableCell>
                                        <TableCell className="font-medium">{m.product_name}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={`text-xs ${getActionBadgeClass(m.action_type)}`}>
                                                {ACTION_LABELS[m.action_type] || m.action_type}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {getQtyDisplay(m.action_type, m.qty)}
                                        </TableCell>
                                        <TableCell className="text-sm text-slate-500 font-mono">{m.lot_number || '—'}</TableCell>
                                        <TableCell className="text-sm text-slate-600">{m.staff}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
