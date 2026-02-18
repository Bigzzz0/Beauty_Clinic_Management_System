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
            <Card>
                <CardContent className="p-4">
                    <div className="flex flex-wrap gap-4 items-end">
                        <div>
                            <Label>วันเริ่มต้น</Label>
                            <Input type="date" value={invStart} onChange={(e) => setInvStart(e.target.value)} />
                        </div>
                        <div>
                            <Label>วันสิ้นสุด</Label>
                            <Input type="date" value={invEnd} onChange={(e) => setInvEnd(e.target.value)} />
                        </div>
                        <div>
                            <Label>ประเภท</Label>
                            <Select value={invAction} onValueChange={setInvAction}>
                                <SelectTrigger className="w-40">
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
                </CardContent>
            </Card>

            {/* Summary by Type */}
            <div className="flex flex-wrap gap-2">
                {(inventoryData?.summary || []).map((s) => (
                    <Badge key={s.action_type} variant="secondary" className="text-sm py-1 px-3">
                        {ACTION_LABELS[s.action_type] || s.action_type}: {s.count} ครั้ง ({s.qty} หน่วย)
                    </Badge>
                ))}
            </div>

            {/* Movement Log */}
            <Card>
                <CardHeader>
                    <CardTitle>รายการเคลื่อนไหว</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="rounded-lg border overflow-hidden max-h-[500px] overflow-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-50">
                                    <TableHead>วันที่</TableHead>
                                    <TableHead>รหัส</TableHead>
                                    <TableHead>สินค้า</TableHead>
                                    <TableHead>ประเภท</TableHead>
                                    <TableHead className="text-right">จำนวน</TableHead>
                                    <TableHead>Lot</TableHead>
                                    <TableHead>ผู้ทำรายการ</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {inventoryLoading ? (
                                    <TableRow><TableCell colSpan={7} className="text-center py-8">กำลังโหลด...</TableCell></TableRow>
                                ) : (inventoryData?.movements || []).map((m) => (
                                    <TableRow key={m.movement_id}>
                                        <TableCell className="text-sm">{formatDate(m.date)}</TableCell>
                                        <TableCell className="font-mono text-sm">{m.product_code}</TableCell>
                                        <TableCell>{m.product_name}</TableCell>
                                        <TableCell>
                                            <Badge variant={m.action_type === 'IN' ? 'default' : 'secondary'}>
                                                {ACTION_LABELS[m.action_type] || m.action_type}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">{m.qty}</TableCell>
                                        <TableCell className="text-sm">{m.lot_number || '-'}</TableCell>
                                        <TableCell className="text-sm">{m.staff}</TableCell>
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
