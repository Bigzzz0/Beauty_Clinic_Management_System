'use client'

import { useState } from 'react'
import {
    TrendingUp, Calendar, Download, ArrowUpRight, ArrowDownRight,
    Banknote, CreditCard, Smartphone
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

function getPaymentMethodConfig(method: string) {
    if (method === 'CASH') return {
        label: 'เงินสด',
        icon: Banknote,
        iconBg: 'bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-emerald-100',
        textColor: 'text-emerald-700',
        bg: 'bg-emerald-50',
        border: 'border-emerald-100',
    }
    if (method === 'TRANSFER') return {
        label: 'โอนเงิน',
        icon: Smartphone,
        iconBg: 'bg-gradient-to-br from-blue-400 to-blue-600 shadow-blue-100',
        textColor: 'text-blue-700',
        bg: 'bg-blue-50',
        border: 'border-blue-100',
    }
    if (method === 'CREDIT') return {
        label: 'บัตรเครดิต',
        icon: CreditCard,
        iconBg: 'bg-gradient-to-br from-purple-400 to-purple-600 shadow-purple-100',
        textColor: 'text-purple-700',
        bg: 'bg-purple-50',
        border: 'border-purple-100',
    }
    return {
        label: method,
        icon: Banknote,
        iconBg: 'bg-gradient-to-br from-slate-400 to-slate-600 shadow-slate-100',
        textColor: 'text-slate-700',
        bg: 'bg-slate-50',
        border: 'border-slate-100',
    }
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
            if (!res.ok) throw new Error(res.statusText)
            return res.json()
        },
    })

    const handleExport = () => {
        if (!salesData) return;
        const headers = ['วันที่', 'ยอดขาย', 'รับชำระ', 'จำนวนบิล'];
        const rows = (salesData.dailyBreakdown || []).map(d => [
            formatDate(d.date), d.sales, d.paid, d.count
        ]);
        const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
        const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
        const blob = new Blob([bom, csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `sales_report_${salesStart}_to_${salesEnd}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-4">
            {/* Filter Bar */}
            <div className="flex flex-wrap gap-4 items-end p-4 bg-white rounded-xl border shadow-sm">
                <div>
                    <Label className="text-xs text-slate-500 uppercase tracking-wide mb-1 block">วันเริ่มต้น</Label>
                    <Input type="date" value={salesStart} onChange={(e) => setSalesStart(e.target.value)} className="w-40" />
                </div>
                <div>
                    <Label className="text-xs text-slate-500 uppercase tracking-wide mb-1 block">วันสิ้นสุด</Label>
                    <Input type="date" value={salesEnd} onChange={(e) => setSalesEnd(e.target.value)} className="w-40" />
                </div>
                <Button
                    variant="outline"
                    onClick={handleExport}
                    disabled={!salesData || salesData.dailyBreakdown.length === 0}
                    className="gap-2 rounded-xl transition-all hover:-translate-y-0.5 hover:shadow-sm"
                >
                    <Download className="h-4 w-4" />
                    Export CSV
                </Button>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card className="border-0 shadow-sm overflow-hidden">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-sm shadow-emerald-100">
                            <TrendingUp className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">ยอดขายรวม</p>
                            <p className="text-xl font-bold text-emerald-700">
                                {salesLoading ? '...' : formatCurrency(salesData?.summary?.totalSales || 0)}
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-sm overflow-hidden">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 shadow-sm shadow-amber-100">
                            <ArrowUpRight className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">รับชำระแล้ว</p>
                            <p className="text-xl font-bold text-amber-700">
                                {salesLoading ? '...' : formatCurrency(salesData?.summary?.totalPaid || 0)}
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-sm overflow-hidden">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-red-400 to-red-500 shadow-sm shadow-red-100">
                            <ArrowDownRight className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">ค้างชำระ</p>
                            <p className="text-xl font-bold text-red-600">
                                {salesLoading ? '...' : formatCurrency(salesData?.summary?.totalOutstanding || 0)}
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-sm overflow-hidden">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-400 to-indigo-600 shadow-sm shadow-indigo-100">
                            <Calendar className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">จำนวนบิล</p>
                            <p className="text-xl font-bold text-indigo-700">
                                {salesLoading ? '...' : salesData?.summary?.transactionCount || 0}
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Payment Method Breakdown — color coded per method */}
            {(salesData?.byPaymentMethod || []).length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">แยกตามวิธีชำระ</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-4">
                            {(salesData?.byPaymentMethod || []).map((p) => {
                                const config = getPaymentMethodConfig(p.method)
                                const Icon = config.icon
                                return (
                                    <div
                                        key={p.method}
                                        className={`flex items-center gap-3 flex-1 min-w-[160px] rounded-xl border p-4 ${config.bg} ${config.border}`}
                                    >
                                        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg shadow-sm ${config.iconBg}`}>
                                            <Icon className="h-4 w-4 text-white" />
                                        </div>
                                        <div>
                                            <p className={`text-xs font-semibold uppercase tracking-wide ${config.textColor} opacity-70`}>{config.label}</p>
                                            <p className={`text-lg font-bold ${config.textColor}`}>{formatCurrency(p.amount)}</p>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Daily Breakdown Table */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">ยอดขายรายวัน</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="rounded-xl border overflow-hidden max-h-96 overflow-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-50 hover:bg-slate-50">
                                    <TableHead className="text-xs font-semibold uppercase tracking-wide text-slate-500">วันที่</TableHead>
                                    <TableHead className="text-right text-xs font-semibold uppercase tracking-wide text-slate-500">ยอดขาย</TableHead>
                                    <TableHead className="text-right text-xs font-semibold uppercase tracking-wide text-slate-500">รับชำระ</TableHead>
                                    <TableHead className="text-right text-xs font-semibold uppercase tracking-wide text-slate-500">จำนวนบิล</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {(salesData?.dailyBreakdown || []).map((d) => (
                                    <TableRow key={d.date} className="hover:bg-amber-50/20 transition-colors">
                                        <TableCell className="font-medium">{formatDate(d.date)}</TableCell>
                                        <TableCell className="text-right font-medium">{formatCurrency(d.sales)}</TableCell>
                                        <TableCell className="text-right text-emerald-600 font-semibold">{formatCurrency(d.paid)}</TableCell>
                                        <TableCell className="text-right">
                                            <span className="inline-flex items-center justify-center h-6 min-w-6 px-1.5 rounded-full bg-slate-100 text-xs font-bold text-slate-600">
                                                {d.count}
                                            </span>
                                        </TableCell>
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
