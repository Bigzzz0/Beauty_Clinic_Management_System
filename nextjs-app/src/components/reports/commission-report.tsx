'use client'

import { useState } from 'react'
import {
    Download,
    TrendingUp,
    HandCoins,
    Wallet
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { formatCurrency } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { useAuthStore } from '@/stores/auth-store'

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

export default function CommissionReportTab() {
    const token = useAuthStore((s) => s.token)
    const today = new Date()
    const [commissionMonth, setCommissionMonth] = useState(today.toISOString().substring(0, 7))

    const { data: commissionData, isLoading: commissionLoading } = useQuery<CommissionReport>({
        queryKey: ['report-commission', commissionMonth],
        queryFn: async () => {
            const res = await fetch(`/api/reports/commission?month=${commissionMonth}`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            })
            if (!res.ok) throw new Error(res.statusText)
            return res.json()
        },
    })

    const handleExport = () => {
        if (!commissionData) return;

        const formatCSVCell = (val: any) => {
            const str = String(val ?? '');
            if (str.includes(',') || str.includes('"') || str.includes('\n')) {
                return `"${str.replace(/"/g, '""')}"`;
            }
            return str;
        };

        const metadata = [
            ['รายงานสรุปค่าคอมมิชชันพนักงาน (Commission Report)'],
            ['ประจำเดือน', commissionMonth],
            ['DF รวม (บาท)', commissionData.grandTotal?.df || 0],
            ['Hand Fee รวม (บาท)', commissionData.grandTotal?.handFee || 0],
            ['ยอดรวมทั้งหมด (บาท)', commissionData.grandTotal?.total || 0],
            ['วันที่ดึงรายงาน', new Date().toLocaleString('th-TH')],
            [], // เว้นบรรทัด
        ];

        const metadataRows = metadata.map(row => row.map(formatCSVCell).join(','));
        const headers = ['พนักงาน', 'ตำแหน่ง', 'DF (บาท)', 'Hand Fee (บาท)', 'รวม (บาท)'];
        const dataRows = (commissionData.staffSummary || []).map(s => [
            s.full_name,
            s.position,
            s.df_total,
            s.hand_fee_total,
            s.total
        ]).map(row => row.map(formatCSVCell).join(','));

        const csvContent = [...metadataRows, headers.join(','), ...dataRows].join('\n');

        const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
        const blob = new Blob([bom, csvContent], { type: 'text/csv;charset=utf-8;' });

        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `commission_report_${commissionMonth}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const getPositionColor = (position: string) => {
        if (position.includes('Manager')) return 'bg-purple-100 text-purple-700 hover:bg-purple-200';
        if (position.includes('Therapist')) return 'bg-blue-100 text-blue-700 hover:bg-blue-200';
        return 'bg-slate-100 text-slate-700 hover:bg-slate-200';
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardContent className="p-6">
                    <div className="flex flex-col sm:flex-row gap-4 items-end justify-between">
                        <div>
                            <Label className="text-sm font-medium text-slate-500 mb-2 block">เลือกเดือน</Label>
                            <Input type="month" value={commissionMonth} onChange={(e) => setCommissionMonth(e.target.value)} className="w-48" />
                        </div>
                        <Button 
                            onClick={handleExport} 
                            disabled={!commissionData || commissionData.staffSummary.length === 0}
                            className="bg-slate-900 hover:bg-slate-800 text-white shadow-lg shadow-slate-200"
                        >
                            <Download className="h-4 w-4 mr-2" />
                            Export for Payroll
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-3">
                <Card className="border-none bg-gradient-to-br from-pink-500 to-rose-600 text-white shadow-lg">
                    <CardContent className="p-6 flex items-center justify-between">
                        <div>
                            <p className="text-pink-100 text-sm font-medium">DF รวม</p>
                            <p className="text-3xl font-bold mt-1">
                                {commissionLoading ? '...' : formatCurrency(commissionData?.grandTotal?.df || 0)}
                            </p>
                        </div>
                        <TrendingUp className="h-8 w-8 text-pink-200/50" />
                    </CardContent>
                </Card>
                <Card className="border-none bg-gradient-to-br from-indigo-500 to-blue-600 text-white shadow-lg">
                    <CardContent className="p-6 flex items-center justify-between">
                        <div>
                            <p className="text-indigo-100 text-sm font-medium">Hand Fee รวม</p>
                            <p className="text-3xl font-bold mt-1">
                                {commissionLoading ? '...' : formatCurrency(commissionData?.grandTotal?.handFee || 0)}
                            </p>
                        </div>
                        <HandCoins className="h-8 w-8 text-indigo-200/50" />
                    </CardContent>
                </Card>
                <Card className="border-none bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg">
                    <CardContent className="p-6 flex items-center justify-between">
                        <div>
                            <p className="text-emerald-100 text-sm font-medium">ค่าคอมรวม</p>
                            <p className="text-3xl font-bold mt-1">
                                {commissionLoading ? '...' : formatCurrency(commissionData?.grandTotal?.total || 0)}
                            </p>
                        </div>
                        <Wallet className="h-8 w-8 text-emerald-200/50" />
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg font-semibold">สรุปรายพนักงาน</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="rounded-lg border overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-50 hover:bg-slate-50">
                                    <TableHead className="uppercase text-xs font-bold tracking-wider">พนักงาน</TableHead>
                                    <TableHead className="uppercase text-xs font-bold tracking-wider">ตำแหน่ง</TableHead>
                                    <TableHead className="text-right uppercase text-xs font-bold tracking-wider">DF</TableHead>
                                    <TableHead className="text-right uppercase text-xs font-bold tracking-wider">Hand Fee</TableHead>
                                    <TableHead className="text-right uppercase text-xs font-bold tracking-wider">รวม</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {(commissionData?.staffSummary || []).map((s) => (
                                    <TableRow key={s.staff_id} className="hover:bg-slate-50/50">
                                        <TableCell className="flex items-center gap-3">
                                            <Avatar className="h-8 w-8">
                                                <AvatarFallback className="bg-slate-100 text-xs font-bold text-slate-600">
                                                    {s.full_name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <span className="font-medium">{s.full_name}</span>
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={`${getPositionColor(s.position)} border-none`}>
                                                {s.position}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right text-pink-600 font-medium">{formatCurrency(s.df_total)}</TableCell>
                                        <TableCell className="text-right text-indigo-600 font-medium">{formatCurrency(s.hand_fee_total)}</TableCell>
                                        <TableCell className="text-right font-bold text-slate-900">{formatCurrency(s.total)}</TableCell>
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
