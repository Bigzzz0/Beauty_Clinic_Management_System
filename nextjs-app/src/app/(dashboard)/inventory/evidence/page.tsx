'use client'

import { useState } from 'react'
import {
    FileText,
    Eye,
    Calendar,
    Shield,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth-store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'

interface EvidenceLog {
    movement_id: number
    created_at: string | null
    action_type: string
    qty_main: number
    qty_sub: number
    note: string | null
    evidence_image: string | null
    product_name: string
    product_code: string | null
    main_unit: string
    sub_unit: string
    staff_name: string
    staff_position: string
}

interface InventoryEvidenceData {
    month: number
    year: number
    total: number
    movement_logs: EvidenceLog[]
}

const months = [
    { value: 1, label: 'มกราคม' },
    { value: 2, label: 'กุมภาพันธ์' },
    { value: 3, label: 'มีนาคม' },
    { value: 4, label: 'เมษายน' },
    { value: 5, label: 'พฤษภาคม' },
    { value: 6, label: 'มิถุนายน' },
    { value: 7, label: 'กรกฎาคม' },
    { value: 8, label: 'สิงหาคม' },
    { value: 9, label: 'กันยายน' },
    { value: 10, label: 'ตุลาคม' },
    { value: 11, label: 'พฤศจิกายน' },
    { value: 12, label: 'ธันวาคม' },
]

export default function InventoryEvidencePage() {
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
    const [selectedMovement, setSelectedMovement] = useState<EvidenceLog | null>(null)

    const token = useAuthStore((s) => s.token)

    const { data, isLoading } = useQuery<InventoryEvidenceData>({
        queryKey: ['inventory', 'evidence', selectedMonth, selectedYear],
        queryFn: async () => {
            const res = await fetch(`/api/inventory/evidence?month=${selectedMonth}&year=${selectedYear}`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            })

            if (!res.ok) {
                throw new Error('Failed to fetch inventory evidence')
            }

            return res.json()
        },
    })

    const getMovementActionLabel = (actionType: string) => {
        const labelMap: Record<string, string> = {
            IN: 'รับเข้า',
            OUT: 'เบิกออก',
            MANUAL_OUT: 'เบิกออก (Manual)',
            TRANSFER: 'โอนย้าย',
            USAGE: 'ใช้งาน',
            ADJUST_DAMAGED: 'ปรับยอด - ชำรุด',
            ADJUST_EXPIRED: 'ปรับยอด - หมดอายุ',
            ADJUST_LOST: 'ปรับยอด - สูญหาย',
            ADJUST_CLAIM: 'ปรับยอด - เคลม',
            VOID_RETURN: 'คืนจากยกเลิกรายการ',
        }

        return labelMap[actionType] || actionType
    }

    const formatMovementQty = (movement: EvidenceLog) => {
        if (movement.qty_sub > 0) {
            return `${movement.qty_sub} ${movement.sub_unit}`
        }

        return `${movement.qty_main} ${movement.main_unit}`
    }

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-slate-700 to-slate-900 shadow-sm">
                            <FileText className="h-5 w-5 text-white" />
                        </div>
                        รายละเอียดการเคลื่อนไหวและหลักฐาน
                    </h1>
                    <p className="text-muted-foreground text-sm mt-1 ml-0.5">ดูประวัติการเคลื่อนไหวสินค้าและรูปหลักฐานย้อนหลัง</p>
                </div>
                <Badge className="w-fit bg-red-100 text-red-700 border-red-200 gap-1">
                    <Shield className="h-3.5 w-3.5" />
                    Admin Only
                </Badge>
            </div>

            <Card>
                <CardContent className="p-4">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            ช่วงเวลาที่แสดงผล
                        </div>
                        <div className="flex items-center gap-3">
                            <Select value={selectedMonth.toString()} onValueChange={(v) => setSelectedMonth(parseInt(v))}>
                                <SelectTrigger className="w-44" aria-label="เลือกเดือน">
                                    <SelectValue placeholder="เลือกเดือน" />
                                </SelectTrigger>
                                <SelectContent>
                                    {months.map((m) => (
                                        <SelectItem key={m.value} value={m.value.toString()}>
                                            {m.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
                                <SelectTrigger className="w-32" aria-label="เลือกปี">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {[2024, 2025, 2026, 2027].map((y) => (
                                        <SelectItem key={y} value={y.toString()}>
                                            {y}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>
                        รายการทั้งหมด {isLoading ? '...' : (data?.total || 0)} รายการ
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="rounded-lg border overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/50">
                                    <TableHead>วันเวลา</TableHead>
                                    <TableHead>สินค้า</TableHead>
                                    <TableHead>ประเภท</TableHead>
                                    <TableHead className="text-right">จำนวน</TableHead>
                                    <TableHead>ผู้บันทึก</TableHead>
                                    <TableHead>หมายเหตุ</TableHead>
                                    <TableHead className="text-center">หลักฐาน</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                            กำลังโหลดข้อมูล...
                                        </TableCell>
                                    </TableRow>
                                ) : !data?.movement_logs?.length ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                            ไม่มีข้อมูลการเคลื่อนไหวในช่วงเวลาที่เลือก
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    data.movement_logs.map((movement) => (
                                        <TableRow key={movement.movement_id} className="hover:bg-muted/50 align-top">
                                            <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                                                {movement.created_at
                                                    ? new Date(movement.created_at).toLocaleString('th-TH', {
                                                        year: 'numeric',
                                                        month: '2-digit',
                                                        day: '2-digit',
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                    })
                                                    : '-'}
                                            </TableCell>
                                            <TableCell>
                                                <div className="font-medium">{movement.product_name}</div>
                                                <div className="text-xs text-muted-foreground font-mono">{movement.product_code || '-'}</div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="secondary">{getMovementActionLabel(movement.action_type)}</Badge>
                                            </TableCell>
                                            <TableCell className="text-right whitespace-nowrap">
                                                {formatMovementQty(movement)}
                                            </TableCell>
                                            <TableCell>
                                                <div className="font-medium">{movement.staff_name}</div>
                                                <div className="text-xs text-muted-foreground">{movement.staff_position}</div>
                                            </TableCell>
                                            <TableCell className="max-w-[280px] text-sm text-muted-foreground whitespace-pre-wrap break-words">
                                                {movement.note || '-'}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {movement.evidence_image ? (
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        className="gap-1"
                                                        onClick={() => setSelectedMovement(movement)}
                                                    >
                                                        <Eye className="h-3.5 w-3.5" />
                                                        ดูรูป
                                                    </Button>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground">ไม่มี</span>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            <Dialog open={!!selectedMovement} onOpenChange={(open) => !open && setSelectedMovement(null)}>
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>หลักฐานการเคลื่อนไหวสินค้า</DialogTitle>
                    </DialogHeader>

                    {selectedMovement && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                                <div>
                                    <p className="text-muted-foreground">สินค้า</p>
                                    <p className="font-medium">{selectedMovement.product_name}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">ประเภทการเคลื่อนไหว</p>
                                    <p className="font-medium">{getMovementActionLabel(selectedMovement.action_type)}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">จำนวน</p>
                                    <p className="font-medium">{formatMovementQty(selectedMovement)}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">ผู้บันทึก</p>
                                    <p className="font-medium">{selectedMovement.staff_name} ({selectedMovement.staff_position})</p>
                                </div>
                                <div className="sm:col-span-2">
                                    <p className="text-muted-foreground">หมายเหตุ</p>
                                    <p className="font-medium whitespace-pre-wrap">{selectedMovement.note || '-'}</p>
                                </div>
                            </div>

                            <div className="border rounded-lg overflow-hidden bg-slate-50">
                                <img
                                    src={selectedMovement.evidence_image || ''}
                                    alt="หลักฐานการเคลื่อนไหวสินค้า"
                                    className="w-full max-h-[65vh] object-contain"
                                />
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
