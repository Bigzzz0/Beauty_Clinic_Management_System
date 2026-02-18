'use client'

import { useState } from 'react'
import {
    Download
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { formatCurrency } from '@/lib/utils'
import { Button } from '@/components/ui/button'
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
            return res.json()
        },
    })

    return (
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
    )
}
