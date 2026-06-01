'use client'

import React, { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth-store'
import { Wallet, Stethoscope, Scissors, UserCheck, ChevronDown, ChevronUp } from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface CommissionItem {
    date: string | null
    type: string
    amount: number
    item: string
}

interface StaffSummary {
    staff_id: number
    full_name: string
    position: string
    df_total: number
    hand_fee_total: number
    total: number
    items: CommissionItem[]
}

interface CommissionReport {
    month: string
    staffSummary: StaffSummary[]
    grandTotal: {
        df: number
        handFee: number
        total: number
    }
}

function getPositionBadgeClass(position: string) {
    if (position === 'Doctor') return 'bg-blue-50 text-blue-700 border-blue-200'
    if (position === 'Therapist') return 'bg-purple-50 text-purple-700 border-purple-200'
    if (position === 'Nurse') return 'bg-emerald-50 text-emerald-700 border-emerald-200'
    return 'bg-slate-100 text-slate-600 border-slate-200'
}

function getAvatarBg(position: string) {
    if (position === 'Doctor') return 'bg-blue-100 text-blue-700'
    if (position === 'Therapist') return 'bg-purple-100 text-purple-700'
    if (position === 'Nurse') return 'bg-emerald-100 text-emerald-700'
    return 'bg-amber-100 text-amber-700'
}

export default function CommissionReportPage() {
    const token = useAuthStore((s) => s.token)
    
    // Default to current month
    const [selectedMonth, setSelectedMonth] = useState(() => {
        const d = new Date()
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    })

    const [expandedRows, setExpandedRows] = useState<Record<number, boolean>>({})

    const toggleRow = (staffId: number) => {
        setExpandedRows(prev => ({
            ...prev,
            [staffId]: !prev[staffId]
        }))
    }

    const { data, isLoading, error } = useQuery<CommissionReport>({
        queryKey: ['report-commission', selectedMonth],
        queryFn: async () => {
            const res = await fetch(`/api/reports/commission?month=${selectedMonth}`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {}
            })
            if (!res.ok) throw new Error('Failed to fetch commission report')
            return res.json()
        }
    })

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 shadow-sm shadow-amber-200">
                            <Wallet className="h-5 w-5 text-white" />
                        </div>
                        รายงานรายได้และค่าคอมมิชชัน
                    </h1>
                    <p className="text-muted-foreground text-sm mt-1 ml-0.5">
                        สรุปค่ามือแพทย์ (DF) และค่าคอมมิชชันพนักงานประจำเดือน
                    </p>
                </div>

                <div className="flex items-center gap-2 bg-white p-2 rounded-xl border shadow-sm">
                    <Label htmlFor="month-picker" className="whitespace-nowrap text-sm text-slate-600">เดือนที่แสดง:</Label>
                    <Input 
                        id="month-picker" 
                        type="month" 
                        value={selectedMonth} 
                        onChange={(e) => setSelectedMonth(e.target.value)} 
                        className="w-40 rounded-lg"
                    />
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card className="border-0 shadow-sm overflow-hidden">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 shadow-sm shadow-blue-100">
                            <Stethoscope className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">ค่ามือแพทย์ (DF)</p>
                            <p className="text-2xl font-bold text-blue-700">
                                ฿{data?.grandTotal.df.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-sm overflow-hidden">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-purple-400 to-purple-600 shadow-sm shadow-purple-100">
                            <Scissors className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">ค่ามือพนักงาน (Hand Fee)</p>
                            <p className="text-2xl font-bold text-purple-700">
                                ฿{data?.grandTotal.handFee.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-sm overflow-hidden bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 shadow-sm shadow-amber-200">
                            <Wallet className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <p className="text-xs font-medium text-amber-700 uppercase tracking-wide">ยอดสั่งจ่ายรวม</p>
                            <p className="text-3xl font-black text-amber-800">
                                ฿{data?.grandTotal.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Staff Data Table */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        สรุปแยกตามบุคคล
                        {data?.staffSummary && (
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">{data.staffSummary.length} คน</span>
                        )}
                    </CardTitle>
                    <CardDescription>คลิกที่แถวเพื่อดูรายละเอียดรายบุคคล</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="h-40 flex flex-col items-center justify-center gap-3 text-slate-400">
                            <div className="h-8 w-8 rounded-full border-2 border-t-amber-500 border-amber-200 animate-spin" />
                            <p className="text-sm">กำลังโหลดข้อมูล...</p>
                        </div>
                    ) : error ? (
                        <div className="h-32 flex items-center justify-center text-red-500 rounded-lg bg-red-50">
                            เกิดข้อผิดพลาดในการโหลดข้อมูล กรุณาลองใหม่อีกครั้ง
                        </div>
                    ) : data?.staffSummary.length === 0 ? (
                        <div className="h-40 flex items-center justify-center text-slate-400 flex-col gap-2">
                            <UserCheck className="h-10 w-10 opacity-20" />
                            <p className="text-sm">ไม่พบรายการค่ามือ/คอมมิชชันในเดือนนี้</p>
                        </div>
                    ) : (
                        <div className="rounded-xl border overflow-hidden">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-slate-50 hover:bg-slate-50">
                                        <TableHead className="w-10"></TableHead>
                                        <TableHead className="text-xs font-semibold uppercase tracking-wide text-slate-500">พนักงาน</TableHead>
                                        <TableHead className="text-xs font-semibold uppercase tracking-wide text-slate-500">ตำแหน่ง</TableHead>
                                        <TableHead className="text-right text-xs font-semibold uppercase tracking-wide text-slate-500">DF</TableHead>
                                        <TableHead className="text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Hand Fee</TableHead>
                                        <TableHead className="text-right text-xs font-semibold uppercase tracking-wide text-slate-800">รวมที่ต้องจ่าย</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {data?.staffSummary.map((staff) => (
                                        <React.Fragment key={staff.staff_id}>
                                            <TableRow 
                                                className="cursor-pointer hover:bg-amber-50/40 transition-colors"
                                                onClick={() => toggleRow(staff.staff_id)}
                                            >
                                                <TableCell>
                                                    <Button variant="ghost" size="icon" className="h-7 w-7 p-0 text-slate-400 hover:text-amber-600">
                                                        {expandedRows[staff.staff_id] ? 
                                                            <ChevronUp className="h-4 w-4" /> : 
                                                            <ChevronDown className="h-4 w-4" />
                                                        }
                                                    </Button>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${getAvatarBg(staff.position)}`}>
                                                            {staff.full_name.charAt(0)}
                                                        </div>
                                                        <span className="font-medium">{staff.full_name}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className={`text-xs ${getPositionBadgeClass(staff.position)}`}>
                                                        {staff.position}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right text-blue-600 font-medium">
                                                    {staff.df_total > 0 ? `฿${staff.df_total.toLocaleString()}` : <span className="text-slate-300">—</span>}
                                                </TableCell>
                                                <TableCell className="text-right text-purple-600 font-medium">
                                                    {staff.hand_fee_total > 0 ? `฿${staff.hand_fee_total.toLocaleString()}` : <span className="text-slate-300">—</span>}
                                                </TableCell>
                                                <TableCell className="text-right font-bold text-amber-700 text-base">
                                                    ฿{staff.total.toLocaleString()}
                                                </TableCell>
                                            </TableRow>
                                            
                                            {/* Expandable Details */}
                                            {expandedRows[staff.staff_id] && (
                                                <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
                                                    <TableCell colSpan={6} className="p-0 border-b">
                                                        <div className="px-14 py-4 space-y-3">
                                                            <h4 className="text-sm font-semibold text-slate-700">รายละเอียดรายการ</h4>
                                                            {staff.items.length > 0 ? (
                                                                <div className="border rounded-xl bg-white overflow-hidden">
                                                                    <Table>
                                                                        <TableHeader>
                                                                            <TableRow className="bg-slate-50">
                                                                                <TableHead className="w-[120px] text-xs font-semibold uppercase tracking-wide text-slate-500">วันที่</TableHead>
                                                                                <TableHead className="text-xs font-semibold uppercase tracking-wide text-slate-500">รายการบริการ</TableHead>
                                                                                <TableHead className="text-xs font-semibold uppercase tracking-wide text-slate-500">ประเภท</TableHead>
                                                                                <TableHead className="text-right text-xs font-semibold uppercase tracking-wide text-slate-500">ยอดเงิน (฿)</TableHead>
                                                                            </TableRow>
                                                                        </TableHeader>
                                                                        <TableBody>
                                                                            {staff.items.map((item, idx) => (
                                                                                <TableRow key={idx} className="hover:bg-amber-50/20">
                                                                                    <TableCell className="text-xs text-slate-500">
                                                                                        {item.date ? formatDate(item.date) : 'ไม่ระบุ'}
                                                                                    </TableCell>
                                                                                    <TableCell className="text-sm">
                                                                                        {item.item}
                                                                                    </TableCell>
                                                                                    <TableCell>
                                                                                        <Badge variant="secondary" className="text-[10px] bg-amber-100 text-amber-700">
                                                                                            {item.type}
                                                                                        </Badge>
                                                                                    </TableCell>
                                                                                    <TableCell className="text-right font-medium text-sm text-amber-700">
                                                                                        ฿{item.amount.toLocaleString()}
                                                                                    </TableCell>
                                                                                </TableRow>
                                                                            ))}
                                                                        </TableBody>
                                                                    </Table>
                                                                </div>
                                                            ) : (
                                                                <p className="text-sm text-slate-400 py-2">ไม่มีข้อมูลรายการย่อย</p>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </React.Fragment>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
