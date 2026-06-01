'use client'

import { useQuery } from '@tanstack/react-query'
import { formatCurrency, formatDate } from '@/lib/utils'
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
import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'

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

export default function DebtReportTab() {
    const token = useAuthStore((s) => s.token)

    const { data: debtData, isLoading: debtLoading } = useQuery<DebtReport>({
        queryKey: ['report-debt'],
        queryFn: async () => {
            const res = await fetch('/api/reports/debt', {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            })
            return res.json()
        },
    })

    const handleExport = () => {
        if (!debtData) return;

        const formatCSVCell = (val: any) => {
            const str = String(val ?? '');
            if (str.includes(',') || str.includes('"') || str.includes('\n')) {
                return `"${str.replace(/"/g, '""')}"`;
            }
            return str;
        };

        const metadata = [
            ['รายงานสรุปลูกหนี้ค้างชำระ (Debtor Summary Report)'],
            ['ยอดหนี้ค้างชำระรวม (บาท)', debtData.summary?.totalDebt || 0],
            ['จำนวนลูกหนี้ทั้งหมด', `${debtData.summary?.customerCount || 0} คน`],
            ['จำนวนบิลค้างชำระทั้งหมด', `${debtData.summary?.transactionCount || 0} บิล`],
            ['วิเคราะห์อายุหนี้ - น้อยกว่า 30 วัน (บาท)', debtData.ageAnalysis?.current || 0],
            ['วิเคราะห์อายุหนี้ - 30-60 วัน (บาท)', debtData.ageAnalysis?.days30 || 0],
            ['วิเคราะห์อายุหนี้ - 60-90 วัน (บาท)', debtData.ageAnalysis?.days60 || 0],
            ['วิเคราะห์อายุหนี้ - มากกว่า 90 วัน (บาท)', debtData.ageAnalysis?.days90 || 0],
            ['วันที่ดึงรายงาน', new Date().toLocaleString('th-TH')],
            [], // เว้นบรรทัด
        ];

        const metadataRows = metadata.map(row => row.map(formatCSVCell).join(','));
        const headers = ['HN', 'ชื่อลูกค้า', 'ยอดหนี้ค้างชำระ (บาท)', 'วันที่เกิดหนี้เก่าที่สุด', 'จำนวนบิลค้างชำระ'];
        const dataRows = (debtData.customers || []).map(c => [
            c.hn_code,
            c.full_name,
            c.total_debt,
            formatDate(c.oldest_date),
            c.transaction_count
        ]).map(row => row.map(formatCSVCell).join(','));

        const csvContent = [...metadataRows, headers.join(','), ...dataRows].join('\n');
        const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
        const blob = new Blob([bom, csvContent], { type: 'text/csv;charset=utf-8;' });

        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `debtor_report_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-4">
            {/* Summary Cards with gradient icon boxes */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card className="border-0 shadow-sm overflow-hidden">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-red-400 to-red-600 shadow-sm shadow-red-100">
                            <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">ยอดหนี้รวม</p>
                            <p className="text-2xl font-bold text-red-600">
                                {debtLoading ? '...' : formatCurrency(debtData?.summary?.totalDebt || 0)}
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-sm overflow-hidden">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 shadow-sm shadow-orange-100">
                            <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">จำนวนลูกหนี้</p>
                            <p className="text-2xl font-bold text-orange-600">
                                {debtLoading ? '...' : `${debtData?.summary?.customerCount || 0} คน`}
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-sm overflow-hidden">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 shadow-sm shadow-amber-100">
                            <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">บิลค้างชำระ</p>
                            <p className="text-2xl font-bold text-amber-700">
                                {debtLoading ? '...' : `${debtData?.summary?.transactionCount || 0} บิล`}
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Age Analysis with left-border severity indicators */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">วิเคราะห์อายุหนี้</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-3 md:grid-cols-4">
                        <div className="rounded-xl border-l-4 border-green-400 bg-green-50 p-4">
                            <p className="text-xs font-semibold uppercase tracking-wide text-green-600">น้อยกว่า 30 วัน</p>
                            <p className="text-xl font-bold text-green-700 mt-1">{formatCurrency(debtData?.ageAnalysis?.current || 0)}</p>
                            <p className="text-[10px] text-green-500 mt-0.5">ยังไม่น่ากังวล</p>
                        </div>
                        <div className="rounded-xl border-l-4 border-yellow-400 bg-yellow-50 p-4">
                            <p className="text-xs font-semibold uppercase tracking-wide text-yellow-600">30–60 วัน</p>
                            <p className="text-xl font-bold text-yellow-700 mt-1">{formatCurrency(debtData?.ageAnalysis?.days30 || 0)}</p>
                            <p className="text-[10px] text-yellow-500 mt-0.5">ควรติดตาม</p>
                        </div>
                        <div className="rounded-xl border-l-4 border-orange-400 bg-orange-50 p-4">
                            <p className="text-xs font-semibold uppercase tracking-wide text-orange-600">60–90 วัน</p>
                            <p className="text-xl font-bold text-orange-700 mt-1">{formatCurrency(debtData?.ageAnalysis?.days60 || 0)}</p>
                            <p className="text-[10px] text-orange-500 mt-0.5">เร่งด่วน</p>
                        </div>
                        <div className="rounded-xl border-l-4 border-red-500 bg-red-50 p-4">
                            <p className="text-xs font-semibold uppercase tracking-wide text-red-600">มากกว่า 90 วัน</p>
                            <p className="text-xl font-bold text-red-700 mt-1">{formatCurrency(debtData?.ageAnalysis?.days90 || 0)}</p>
                            <p className="text-[10px] text-red-500 mt-0.5">วิกฤต</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Customer List */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                    <CardTitle className="flex items-center gap-2">
                        รายชื่อลูกหนี้
                        {debtData?.customers && (
                            <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-600">
                                {debtData.customers.length} ราย
                            </span>
                        )}
                    </CardTitle>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleExport}
                        disabled={!debtData || debtData.customers.length === 0}
                        className="gap-2 rounded-xl transition-all hover:-translate-y-0.5 hover:shadow-sm"
                    >
                        <Download className="h-4 w-4" />
                        Export CSV
                    </Button>
                </CardHeader>
                <CardContent>
                    <div className="rounded-xl border overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-50 hover:bg-slate-50">
                                    <TableHead className="text-xs font-semibold uppercase tracking-wide text-slate-500">HN</TableHead>
                                    <TableHead className="text-xs font-semibold uppercase tracking-wide text-slate-500">ชื่อลูกค้า</TableHead>
                                    <TableHead className="text-right text-xs font-semibold uppercase tracking-wide text-slate-500">ยอดหนี้</TableHead>
                                    <TableHead className="text-xs font-semibold uppercase tracking-wide text-slate-500">วันที่เก่าสุด</TableHead>
                                    <TableHead className="text-right text-xs font-semibold uppercase tracking-wide text-slate-500">บิล</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {(debtData?.customers || []).map((c) => (
                                    <TableRow key={c.customer_id} className="hover:bg-red-50/30 transition-colors">
                                        <TableCell className="font-mono text-xs text-slate-500">{c.hn_code}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-red-100 text-xs font-bold text-red-600">
                                                    {c.full_name.charAt(0)}
                                                </div>
                                                <span className="font-medium">{c.full_name}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right font-bold text-red-600">{formatCurrency(c.total_debt)}</TableCell>
                                        <TableCell className="text-sm text-slate-500">{formatDate(c.oldest_date)}</TableCell>
                                        <TableCell className="text-right">
                                            <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-red-100 text-xs font-bold text-red-600">
                                                {c.transaction_count}
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
