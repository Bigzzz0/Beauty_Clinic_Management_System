'use client'

import { useState } from 'react'
import {
    TrendingUp, Calendar, Download, ArrowUpRight, ArrowDownRight
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { useAuthStore } from '@/stores/auth-store'

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

export default function SalesReportTab() {
    const token = useAuthStore((s) => s.token)
    const today = new Date()
    const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    const [salesStart, setSalesStart] = useState(firstOfMonth.toISOString().split('T')[0])
    const [salesEnd, setSalesEnd] = useState(today.toISOString().split('T')[0])

    const { data: salesData, isLoading: salesLoading } = useQuery<SalesReport>({
        queryKey: ['report-sales', salesStart, salesEnd],
        queryFn: async () => {
            const res = await fetch(`/api/reports/sales?startDate=${salesStart}&endDate=${salesEnd}`, {
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
    )
}
