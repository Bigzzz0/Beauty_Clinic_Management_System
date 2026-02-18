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

    return (
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
    )
}
