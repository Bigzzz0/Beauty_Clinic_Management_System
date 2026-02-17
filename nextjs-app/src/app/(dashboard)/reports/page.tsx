'use client'

import { useState } from 'react'
import {
    BarChart3, DollarSign, Users, Package, CreditCard,
    TrendingUp, Calendar, Download, ArrowUpRight, ArrowDownRight
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth-store'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
import Link from 'next/link'

interface SalesReport {
    summary: {
        totalSales: number
        totalPaid: number
        totalOutstanding: number
        transactionCount: number
    }
    byPaymentMethod: Array<{ method: string; amount: number }>
    dailyBreakdown: Array<{ date: string; sales: number; paid: number; count: number }>
}

interface CommissionReport {
    month: string
    grandTotal: { df: number; handFee: number; total: number }
    staffSummary: Array<{
        staff_id: number
        full_name: string
        position: string
        df_total: number
        hand_fee_total: number
        total: number
    }>
}

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

interface DebtReport {
    summary: { totalDebt: number; customerCount: number; transactionCount: number }
    ageAnalysis: { current: number; days30: number; days60: number; days90: number }
    customers: Array<{
        customer_id: number
        hn_code: string
        full_name: string
        total_debt: number
        oldest_date: string
        transaction_count: number
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

export default function ReportsPage() {
    const token = useAuthStore((s) => s.token)

    // Sales dates
    const today = new Date()
    const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    const [salesStart, setSalesStart] = useState(firstOfMonth.toISOString().split('T')[0])
    const [salesEnd, setSalesEnd] = useState(today.toISOString().split('T')[0])

    // Commission month
    const [commissionMonth, setCommissionMonth] = useState(today.toISOString().substring(0, 7))

    // Inventory dates
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
    const [invStart, setInvStart] = useState(thirtyDaysAgo.toISOString().split('T')[0])
    const [invEnd, setInvEnd] = useState(today.toISOString().split('T')[0])
    const [invAction, setInvAction] = useState('')

    // Fetch Sales Report
    const { data: salesData, isLoading: salesLoading } = useQuery<SalesReport>({
        queryKey: ['report-sales', salesStart, salesEnd],
        queryFn: async () => {
            const res = await fetch(`/api/reports/sales?startDate=${salesStart}&endDate=${salesEnd}`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            })
            return res.json()
        },
    })

    // Fetch Commission Report
    const { data: commissionData, isLoading: commissionLoading } = useQuery<CommissionReport>({
        queryKey: ['report-commission', commissionMonth],
        queryFn: async () => {
            const res = await fetch(`/api/reports/commission?month=${commissionMonth}`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            })
            return res.json()
        },
    })

    // Fetch Inventory Report
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

    // Fetch Debt Report
    const { data: debtData, isLoading: debtLoading } = useQuery<DebtReport>({
        queryKey: ['report-debt'],
        queryFn: async () => {
            const res = await fetch('/api/reports/debt', {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            })
            return res.json()
        },
    })

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <BarChart3 className="h-6 w-6 text-primary" />
                        รายงาน
                    </h1>
                    <p className="text-muted-foreground">สรุปข้อมูลการดำเนินงาน</p>
                </div>
                <div className="flex gap-2">
                    <Link href="/reports/daily-sales">
                        <Button variant="gradient">
                            <Calendar className="h-4 w-4 mr-2" />
                            ยอดขายรายวัน
                        </Button>
                    </Link>

                </div>
            </div>

            <Tabs defaultValue="sales" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="sales">
                        <DollarSign className="h-4 w-4 mr-2" />
                        ยอดขาย
                    </TabsTrigger>
                    <TabsTrigger value="commission">
                        <Users className="h-4 w-4 mr-2" />
                        ค่าคอมมิชชั่น
                    </TabsTrigger>
                    <TabsTrigger value="inventory">
                        <Package className="h-4 w-4 mr-2" />
                        เคลื่อนไหวสินค้า
                    </TabsTrigger>
                    <TabsTrigger value="debt">
                        <CreditCard className="h-4 w-4 mr-2" />
                        ลูกหนี้ค้างชำระ
                    </TabsTrigger>
                </TabsList>

                {/* Sales Report */}
                <TabsContent value="sales">
                    <div className="space-y-4">
                        <Card>
                            <CardContent className="p-4">
                                <div className="flex flex-wrap gap-4 items-end">
                                    <div>
                                        <Label>วันเริ่มต้น</Label>
                                        <Input type="date" value={salesStart} onChange={(e) => setSalesStart(e.target.value)} />
                                    </div>
                                    <div>
                                        <Label>วันสิ้นสุด</Label>
                                        <Input type="date" value={salesEnd} onChange={(e) => setSalesEnd(e.target.value)} />
                                    </div>
                                    <Button variant="outline">
                                        <Download className="h-4 w-4 mr-2" />
                                        Export
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Summary Cards */}
                        <div className="grid gap-4 md:grid-cols-4">
                            <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/30 dark:to-emerald-900/30">
                                <CardContent className="p-4">
                                    <div className="flex items-center gap-2">
                                        <TrendingUp className="h-5 w-5 text-emerald-600" />
                                        <span className="text-sm text-emerald-700 dark:text-emerald-400">ยอดขายรวม</span>
                                    </div>
                                    <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400 mt-1">
                                        {salesLoading ? '...' : formatCurrency(salesData?.summary?.totalSales || 0)}
                                    </p>
                                </CardContent>
                            </Card>
                            <Card className="bg-gradient-to-br from-primary/10 to-primary/20 dark:from-primary/20 dark:to-primary/30">
                                <CardContent className="p-4">
                                    <div className="flex items-center gap-2">
                                        <ArrowUpRight className="h-5 w-5 text-primary" />
                                        <span className="text-sm text-primary">รับชำระแล้ว</span>
                                    </div>
                                    <p className="text-2xl font-bold text-primary mt-1">
                                        {salesLoading ? '...' : formatCurrency(salesData?.summary?.totalPaid || 0)}
                                    </p>
                                </CardContent>
                            </Card>
                            <Card className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/30 dark:to-amber-900/30">
                                <CardContent className="p-4">
                                    <div className="flex items-center gap-2">
                                        <ArrowDownRight className="h-5 w-5 text-amber-600" />
                                        <span className="text-sm text-amber-700 dark:text-amber-400">ค้างชำระ</span>
                                    </div>
                                    <p className="text-2xl font-bold text-amber-700 dark:text-amber-400 mt-1">
                                        {salesLoading ? '...' : formatCurrency(salesData?.summary?.totalOutstanding || 0)}
                                    </p>
                                </CardContent>
                            </Card>
                            <Card className="bg-gradient-to-br from-accent/10 to-accent/20 dark:from-accent/20 dark:to-accent/30">
                                <CardContent className="p-4">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="h-5 w-5 text-accent" />
                                        <span className="text-sm text-accent">จำนวนบิล</span>
                                    </div>
                                    <p className="text-2xl font-bold text-accent mt-1">
                                        {salesLoading ? '...' : salesData?.summary?.transactionCount || 0}
                                    </p>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Payment Method Breakdown */}
                        <Card>
                            <CardHeader>
                                <CardTitle>แยกตามวิธีชำระ</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-wrap gap-4">
                                    {(salesData?.byPaymentMethod || []).map((p) => (
                                        <div key={p.method} className="flex-1 min-w-[150px] p-4 rounded-lg bg-muted text-center">
                                            <p className="text-sm text-muted-foreground">{p.method === 'CASH' ? 'เงินสด' : p.method === 'TRANSFER' ? 'โอนเงิน' : 'บัตรเครดิต'}</p>
                                            <p className="text-xl font-bold">{formatCurrency(p.amount)}</p>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Daily Breakdown */}
                        <Card>
                            <CardHeader>
                                <CardTitle>ยอดขายรายวัน</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="rounded-lg border overflow-hidden max-h-96 overflow-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="bg-slate-50">
                                                <TableHead>วันที่</TableHead>
                                                <TableHead className="text-right">ยอดขาย</TableHead>
                                                <TableHead className="text-right">รับชำระ</TableHead>
                                                <TableHead className="text-right">จำนวนบิล</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {(salesData?.dailyBreakdown || []).map((d) => (
                                                <TableRow key={d.date}>
                                                    <TableCell>{formatDate(d.date)}</TableCell>
                                                    <TableCell className="text-right">{formatCurrency(d.sales)}</TableCell>
                                                    <TableCell className="text-right text-green-600">{formatCurrency(d.paid)}</TableCell>
                                                    <TableCell className="text-right">{d.count}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* Commission Report */}
                <TabsContent value="commission">
                    <div className="space-y-4">
                        <Card>
                            <CardContent className="p-4">
                                <div className="flex gap-4 items-end">
                                    <div>
                                        <Label>เดือน</Label>
                                        <Input type="month" value={commissionMonth} onChange={(e) => setCommissionMonth(e.target.value)} />
                                    </div>
                                    <Button variant="outline">
                                        <Download className="h-4 w-4 mr-2" />
                                        Export for Payroll
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Grand Total */}
                        <div className="grid gap-4 md:grid-cols-3">
                            <Card className="bg-gradient-to-br from-pink-50 to-pink-100">
                                <CardContent className="p-4">
                                    <p className="text-sm text-pink-700">DF รวม</p>
                                    <p className="text-2xl font-bold text-pink-700">
                                        {commissionLoading ? '...' : formatCurrency(commissionData?.grandTotal?.df || 0)}
                                    </p>
                                </CardContent>
                            </Card>
                            <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100">
                                <CardContent className="p-4">
                                    <p className="text-sm text-indigo-700">Hand Fee รวม</p>
                                    <p className="text-2xl font-bold text-indigo-700">
                                        {commissionLoading ? '...' : formatCurrency(commissionData?.grandTotal?.handFee || 0)}
                                    </p>
                                </CardContent>
                            </Card>
                            <Card className="bg-gradient-to-br from-green-50 to-green-100">
                                <CardContent className="p-4">
                                    <p className="text-sm text-green-700">ค่าคอมรวม</p>
                                    <p className="text-2xl font-bold text-green-700">
                                        {commissionLoading ? '...' : formatCurrency(commissionData?.grandTotal?.total || 0)}
                                    </p>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Staff Breakdown */}
                        <Card>
                            <CardHeader>
                                <CardTitle>สรุปรายพนักงาน</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="rounded-lg border overflow-hidden">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="bg-slate-50">
                                                <TableHead>พนักงาน</TableHead>
                                                <TableHead>ตำแหน่ง</TableHead>
                                                <TableHead className="text-right">DF</TableHead>
                                                <TableHead className="text-right">Hand Fee</TableHead>
                                                <TableHead className="text-right">รวม</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {(commissionData?.staffSummary || []).map((s) => (
                                                <TableRow key={s.staff_id}>
                                                    <TableCell className="font-medium">{s.full_name}</TableCell>
                                                    <TableCell><Badge variant="outline">{s.position}</Badge></TableCell>
                                                    <TableCell className="text-right text-pink-600">{formatCurrency(s.df_total)}</TableCell>
                                                    <TableCell className="text-right text-indigo-600">{formatCurrency(s.hand_fee_total)}</TableCell>
                                                    <TableCell className="text-right font-bold">{formatCurrency(s.total)}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* Inventory Report */}
                <TabsContent value="inventory">
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
                </TabsContent>

                {/* Debt Report */}
                <TabsContent value="debt">
                    <div className="space-y-4">
                        {/* Summary */}
                        <div className="grid gap-4 md:grid-cols-3">
                            <Card className="bg-gradient-to-br from-red-50 to-red-100">
                                <CardContent className="p-4">
                                    <p className="text-sm text-red-700">ยอดหนี้รวม</p>
                                    <p className="text-2xl font-bold text-red-700">
                                        {debtLoading ? '...' : formatCurrency(debtData?.summary?.totalDebt || 0)}
                                    </p>
                                </CardContent>
                            </Card>
                            <Card className="bg-gradient-to-br from-orange-50 to-orange-100">
                                <CardContent className="p-4">
                                    <p className="text-sm text-orange-700">จำนวนลูกหนี้</p>
                                    <p className="text-2xl font-bold text-orange-700">
                                        {debtLoading ? '...' : `${debtData?.summary?.customerCount || 0} คน`}
                                    </p>
                                </CardContent>
                            </Card>
                            <Card className="bg-gradient-to-br from-amber-50 to-amber-100">
                                <CardContent className="p-4">
                                    <p className="text-sm text-amber-700">จำนวนบิลค้างชำระ</p>
                                    <p className="text-2xl font-bold text-amber-700">
                                        {debtLoading ? '...' : `${debtData?.summary?.transactionCount || 0} บิล`}
                                    </p>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Age Analysis */}
                        <Card>
                            <CardHeader>
                                <CardTitle>วิเคราะห์อายุหนี้</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid gap-4 md:grid-cols-4">
                                    <div className="p-4 rounded-lg bg-green-50 text-center">
                                        <p className="text-sm text-green-700">&lt; 30 วัน</p>
                                        <p className="text-xl font-bold text-green-700">{formatCurrency(debtData?.ageAnalysis?.current || 0)}</p>
                                    </div>
                                    <div className="p-4 rounded-lg bg-yellow-50 text-center">
                                        <p className="text-sm text-yellow-700">30-60 วัน</p>
                                        <p className="text-xl font-bold text-yellow-700">{formatCurrency(debtData?.ageAnalysis?.days30 || 0)}</p>
                                    </div>
                                    <div className="p-4 rounded-lg bg-orange-50 text-center">
                                        <p className="text-sm text-orange-700">60-90 วัน</p>
                                        <p className="text-xl font-bold text-orange-700">{formatCurrency(debtData?.ageAnalysis?.days60 || 0)}</p>
                                    </div>
                                    <div className="p-4 rounded-lg bg-red-50 text-center">
                                        <p className="text-sm text-red-700">&gt; 90 วัน</p>
                                        <p className="text-xl font-bold text-red-700">{formatCurrency(debtData?.ageAnalysis?.days90 || 0)}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Customer List */}
                        <Card>
                            <CardHeader>
                                <CardTitle>รายชื่อลูกหนี้</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="rounded-lg border overflow-hidden">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="bg-slate-50">
                                                <TableHead>HN</TableHead>
                                                <TableHead>ชื่อ</TableHead>
                                                <TableHead className="text-right">ยอดหนี้</TableHead>
                                                <TableHead>วันที่เก่าสุด</TableHead>
                                                <TableHead className="text-right">จำนวนบิล</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {(debtData?.customers || []).map((c) => (
                                                <TableRow key={c.customer_id}>
                                                    <TableCell className="font-mono text-sm">{c.hn_code}</TableCell>
                                                    <TableCell className="font-medium">{c.full_name}</TableCell>
                                                    <TableCell className="text-right font-bold text-red-600">{formatCurrency(c.total_debt)}</TableCell>
                                                    <TableCell className="text-sm">{formatDate(c.oldest_date)}</TableCell>
                                                    <TableCell className="text-right">{c.transaction_count}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    )
}
