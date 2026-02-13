'use client'

import { useState } from 'react'
import {
    Users, TrendingUp, DollarSign, UserPlus,
    ChevronLeft, ChevronRight,
    ArrowLeft, Award
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import Link from 'next/link'
import { formatCurrency } from '@/lib/utils'

interface ConsultantPerformance {
    staff_id: number
    full_name: string
    position: string
    customer_count: number
    new_customers_this_month: number
    total_sales: number
    transaction_count: number
    average_per_customer: number
}

interface ConsultantReportData {
    month: string
    consultants: ConsultantPerformance[]
    grandTotal: {
        total_customers: number
        new_customers: number
        total_sales: number
        total_transactions: number
    }
}

function formatMonth(monthStr: string) {
    const date = new Date(monthStr + '-01')
    return date.toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'long',
    })
}

function formatMonthInput(date: Date) {
    return date.toISOString().substring(0, 7)
}

const positionColors: Record<string, string> = {
    Doctor: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
    Sale: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20',
    Therapist: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
    Admin: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    Cashier: 'bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20',
}

export default function ConsultantPerformancePage() {
    const [selectedMonth, setSelectedMonth] = useState(formatMonthInput(new Date()))

    const { data, isLoading } = useQuery<ConsultantReportData>({
        queryKey: ['consultant-performance', selectedMonth],
        queryFn: async () => {
            const res = await fetch(`/api/reports/consultant-performance?month=${selectedMonth}`)
            if (!res.ok) throw new Error('Failed to fetch')
            return res.json()
        },
    })

    const handlePrevMonth = () => {
        const date = new Date(selectedMonth + '-01')
        date.setMonth(date.getMonth() - 1)
        setSelectedMonth(formatMonthInput(date))
    }

    const handleNextMonth = () => {
        const date = new Date(selectedMonth + '-01')
        date.setMonth(date.getMonth() + 1)
        setSelectedMonth(formatMonthInput(date))
    }

    // Find top performer
    const topPerformer = data?.consultants?.[0]

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Link href="/reports">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-3 text-foreground">
                            <Users className="h-8 w-8 text-primary" />
                            ผลงาน Personal Consultant
                        </h1>
                        <p className="text-muted-foreground mt-1">ติดตามผลงานของ Personal Consultant แต่ละคน</p>
                    </div>
                </div>

                {/* Month Navigation */}
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={handlePrevMonth}>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Input
                        type="month"
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        className="w-44"
                    />
                    <Button variant="outline" size="icon" onClick={handleNextMonth}>
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="bg-emerald-500/10 border-emerald-500/20">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-emerald-500/20 rounded-lg">
                                <DollarSign className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">ยอดขายรวม</p>
                                <p className="text-2xl font-bold text-foreground">
                                    {formatCurrency(data?.grandTotal?.total_sales || 0)}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-blue-500/10 border-blue-500/20">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-500/20 rounded-lg">
                                <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">ลูกค้าทั้งหมด</p>
                                <p className="text-2xl font-bold text-foreground">
                                    {data?.grandTotal?.total_customers || 0}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-green-500/10 border-green-500/20">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-500/20 rounded-lg">
                                <UserPlus className="h-6 w-6 text-green-600 dark:text-green-400" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">ลูกค้าใหม่เดือนนี้</p>
                                <p className="text-2xl font-bold text-foreground">
                                    {data?.grandTotal?.new_customers || 0}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-amber-500/10 border-amber-500/20">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-amber-500/20 rounded-lg">
                                <TrendingUp className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">รายการทั้งหมด</p>
                                <p className="text-2xl font-bold text-foreground">
                                    {data?.grandTotal?.total_transactions || 0}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Top Performer Highlight */}
            {topPerformer && topPerformer.total_sales > 0 && (
                <Card className="bg-gradient-to-r from-yellow-500/10 via-amber-500/10 to-orange-500/10 border-yellow-500/30">
                    <CardContent className="py-4">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-yellow-500/20 rounded-full">
                                <Award className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm text-yellow-600 dark:text-yellow-400 font-medium">🏆 Top Performer เดือนนี้</p>
                                <p className="text-xl font-bold text-foreground">{topPerformer.full_name}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm text-muted-foreground">ยอดขาย</p>
                                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                                    {formatCurrency(topPerformer.total_sales)}
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm text-muted-foreground">ลูกค้า</p>
                                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                    {topPerformer.customer_count}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Performance Table */}
            <Card>
                <CardHeader>
                    <CardTitle>
                        ผลงานรายบุคคล {formatMonth(selectedMonth)}
                    </CardTitle>
                    <CardDescription>
                        แสดง {data?.consultants?.length || 0} คน
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-400"></div>
                        </div>
                    ) : (!data?.consultants || data.consultants.length === 0) ? (
                        <div className="text-center py-12">
                            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                            <p className="text-muted-foreground">ไม่มีข้อมูลในเดือนนี้</p>
                            <p className="text-sm text-muted-foreground mt-2">
                                กรุณาเพิ่ม Personal Consultant ให้ลูกค้าในหน้าข้อมูลลูกค้า
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/50">
                                        <TableHead className="text-center w-12">#</TableHead>
                                        <TableHead>ชื่อ</TableHead>
                                        <TableHead>ตำแหน่ง</TableHead>
                                        <TableHead className="text-right">ลูกค้าทั้งหมด</TableHead>
                                        <TableHead className="text-right">ลูกค้าใหม่</TableHead>
                                        <TableHead className="text-right">รายการ</TableHead>
                                        <TableHead className="text-right">ยอดขาย</TableHead>
                                        <TableHead className="text-right">เฉลี่ย/ลูกค้า</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {data.consultants.map((consultant, index) => (
                                        <TableRow key={consultant.staff_id}>
                                            <TableCell className="text-center">
                                                {index === 0 ? (
                                                    <span className="text-xl">🥇</span>
                                                ) : index === 1 ? (
                                                    <span className="text-xl">🥈</span>
                                                ) : index === 2 ? (
                                                    <span className="text-xl">🥉</span>
                                                ) : (
                                                    <span className="text-muted-foreground">{index + 1}</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="font-medium">
                                                {consultant.full_name}
                                            </TableCell>
                                            <TableCell>
                                                <Badge className={positionColors[consultant.position] || 'bg-muted text-muted-foreground'}>
                                                    {consultant.position}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right text-blue-600 dark:text-blue-400 font-semibold">
                                                {consultant.customer_count}
                                            </TableCell>
                                            <TableCell className="text-right text-green-600 dark:text-green-400">
                                                {consultant.new_customers_this_month > 0 && '+'}
                                                {consultant.new_customers_this_month}
                                            </TableCell>
                                            <TableCell className="text-right text-muted-foreground">
                                                {consultant.transaction_count}
                                            </TableCell>
                                            <TableCell className="text-right font-bold text-emerald-600 dark:text-emerald-400">
                                                {formatCurrency(consultant.total_sales)}
                                            </TableCell>
                                            <TableCell className="text-right text-muted-foreground">
                                                {formatCurrency(consultant.average_per_customer)}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {/* Total Row */}
                                    <TableRow className="bg-muted/50 font-semibold">
                                        <TableCell colSpan={3} className="text-right">
                                            รวมทั้งหมด
                                        </TableCell>
                                        <TableCell className="text-right text-blue-600 dark:text-blue-400">
                                            {data.grandTotal?.total_customers}
                                        </TableCell>
                                        <TableCell className="text-right text-green-600 dark:text-green-400">
                                            +{data.grandTotal?.new_customers}
                                        </TableCell>
                                        <TableCell className="text-right text-muted-foreground">
                                            {data.grandTotal?.total_transactions}
                                        </TableCell>
                                        <TableCell className="text-right text-emerald-600 dark:text-emerald-400 text-lg">
                                            {formatCurrency(data.grandTotal?.total_sales || 0)}
                                        </TableCell>
                                        <TableCell></TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
