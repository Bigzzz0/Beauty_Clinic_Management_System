'use client'

import { useState } from 'react'
import {
    Calendar, FileSpreadsheet, Printer,
    DollarSign, CreditCard, Banknote, ArrowLeft,
    ChevronLeft, ChevronRight, Search, Users
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
import { formatCurrency, formatDate } from '@/lib/utils'

interface SaleDetail {
    rowNumber: number
    transactionId: number
    hnCode: string
    customerName: string
    items: string
    deposit: number
    transfer: number
    credit: number
    cash: number
    totalAmount: number
    personalConsult: string
    paymentChannel: string
    note: string
    operationFee: number
    assistantFee: number
    staffFee: number
    treatmentFee: number
    handFee: number
}

interface DailySalesData {
    summary: {
        date: string
        transactionCount: number
        totalSales: number
        totalPaid: number
        totalOutstanding: number
        byPaymentMethod: {
            cash: number
            transfer: number
            credit: number
            deposit: number
        }
        commissionSummary: {
            operationFee: number
            assistantFee: number
            staffFee: number
            treatmentFee: number
            handFee: number
        }
    }
    details: SaleDetail[]
}

function formatDateInput(date: Date) {
    return date.toISOString().split('T')[0]
}

export default function DailySalesPage() {
    const [selectedDate, setSelectedDate] = useState(formatDateInput(new Date()))
    const [search, setSearch] = useState('')

    const { data, isLoading } = useQuery<DailySalesData>({
        queryKey: ['daily-sales', selectedDate],
        queryFn: async () => {
            const res = await fetch(`/api/reports/daily-sales?date=${selectedDate}`)
            if (!res.ok) throw new Error('Failed to fetch')
            return res.json()
        },
    })

    const handlePrevDay = () => {
        const date = new Date(selectedDate)
        date.setDate(date.getDate() - 1)
        setSelectedDate(formatDateInput(date))
    }

    const handleNextDay = () => {
        const date = new Date(selectedDate)
        date.setDate(date.getDate() + 1)
        setSelectedDate(formatDateInput(date))
    }

    const handleExportCSV = () => {
        if (!data?.details) return

        const headers = [
            'ลำดับ', 'HN', 'ชื่อลูกค้า', 'รายการสินค้า/บริการ',
            'มัดจำ', 'โอน', 'บัตรเครดิต', 'เงินสด', 'ยอดรวม',
            'Personal Consult', 'ช่องทาง', 'หมายเหตุ'
        ]

        const rows = data.details.map(d => [
            d.rowNumber,
            d.hnCode,
            d.customerName,
            `"${d.items}"`,
            d.deposit,
            d.transfer,
            d.credit,
            d.cash,
            d.totalAmount,
            d.personalConsult,
            d.paymentChannel,
            d.note
        ])

        const csvContent = [
            `ยอดขายรายวัน ${formatDate(selectedDate)}`,
            '',
            headers.join(','),
            ...rows.map(r => r.join(','))
        ].join('\n')

        const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `daily-sales-${selectedDate}.csv`
        a.click()
    }

    // Filter by search
    const filteredDetails = data?.details?.filter(d =>
        d.customerName.toLowerCase().includes(search.toLowerCase()) ||
        d.hnCode.toLowerCase().includes(search.toLowerCase()) ||
        d.items.toLowerCase().includes(search.toLowerCase())
    ) || []

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Link href="/reports">
                        <Button variant="ghost" size="icon" aria-label="ย้อนกลับ">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                            <Calendar className="h-8 w-8 text-primary" />
                            ยอดขายรายวัน
                        </h1>
                        <p className="text-muted-foreground mt-1">รายละเอียดยอดขายแบบละเอียดตามวันที่</p>
                    </div>
                </div>

                {/* Date Navigation */}
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={handlePrevDay} aria-label="วันก่อนหน้า">
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="w-40"
                        aria-label="เลือกวันที่"
                    />
                    <Button variant="outline" size="icon" onClick={handleNextDay} aria-label="วันถัดไป">
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="bg-blue-500/10 border-blue-500/20">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-500/20 rounded-lg">
                                <DollarSign className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">ยอดขายรวม</p>
                                <p className="text-2xl font-bold text-foreground">
                                    {formatCurrency(data?.summary?.totalSales || 0)}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-green-500/10 border-green-500/20">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-500/20 rounded-lg">
                                <Banknote className="h-6 w-6 text-green-600 dark:text-green-400" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">เงินสด</p>
                                <p className="text-2xl font-bold text-foreground">
                                    {formatCurrency(data?.summary?.byPaymentMethod?.cash || 0)}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-purple-500/10 border-purple-500/20">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-purple-500/20 rounded-lg">
                                <CreditCard className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">บัตรเครดิต</p>
                                <p className="text-2xl font-bold text-foreground">
                                    {formatCurrency(data?.summary?.byPaymentMethod?.credit || 0)}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-amber-500/10 border-amber-500/20">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-amber-500/20 rounded-lg">
                                <Users className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">จำนวนรายการ</p>
                                <p className="text-2xl font-bold text-foreground">
                                    {data?.summary?.transactionCount || 0}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Toolbar */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                        <div className="relative w-full md:w-80">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="ค้นหา HN, ชื่อลูกค้า, รายการ..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                onClick={handleExportCSV}
                            >
                                <FileSpreadsheet className="h-4 w-4 mr-2" />
                                Export CSV
                            </Button>
                            <Button
                                variant="outline"
                                className="border-gray-600"
                                onClick={() => window.print()}
                            >
                                <Printer className="h-4 w-4 mr-2" />
                                พิมพ์
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Sales Table */}
            <Card>
                <CardHeader>
                    <CardTitle>
                        ยอดขายรายวัน {formatDate(selectedDate)}
                    </CardTitle>
                    <CardDescription>
                        แสดง {filteredDetails.length} รายการ
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
                        </div>
                    ) : filteredDetails.length === 0 ? (
                        <div className="text-center py-12">
                            <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                            <p className="text-muted-foreground">ไม่มีข้อมูลยอดขายในวันนี้</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/50">
                                        <TableHead className="text-center w-12">#</TableHead>
                                        <TableHead>HN</TableHead>
                                        <TableHead>ชื่อลูกค้า</TableHead>
                                        <TableHead className="min-w-[300px]">รายการสินค้า/บริการ</TableHead>
                                        <TableHead className="text-right">มัดจำ</TableHead>
                                        <TableHead className="text-right">โอน</TableHead>
                                        <TableHead className="text-right">บัตร</TableHead>
                                        <TableHead className="text-right">ยอดรวม</TableHead>
                                        <TableHead>Personal</TableHead>
                                        <TableHead>ช่องทาง</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredDetails.map((sale) => (
                                        <TableRow key={sale.transactionId}>
                                            <TableCell className="text-center text-muted-foreground">
                                                {sale.rowNumber}
                                            </TableCell>
                                            <TableCell className="font-mono text-sm text-primary">
                                                {sale.hnCode}
                                            </TableCell>
                                            <TableCell className="font-medium">
                                                {sale.customerName}
                                            </TableCell>
                                            <TableCell className="text-sm max-w-[300px] truncate text-muted-foreground">
                                                {sale.items}
                                            </TableCell>
                                            <TableCell className="text-right text-yellow-600 dark:text-yellow-400">
                                                {sale.deposit > 0 ? formatCurrency(sale.deposit) : '-'}
                                            </TableCell>
                                            <TableCell className="text-right text-green-600 dark:text-green-400">
                                                {sale.transfer > 0 ? formatCurrency(sale.transfer) : '-'}
                                            </TableCell>
                                            <TableCell className="text-right text-purple-600 dark:text-purple-400">
                                                {sale.credit > 0 ? formatCurrency(sale.credit) : '-'}
                                            </TableCell>
                                            <TableCell className="text-right font-semibold">
                                                {formatCurrency(sale.totalAmount)}
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                {sale.personalConsult || '-'}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="text-xs">
                                                    {sale.paymentChannel === 'WALK_IN' ? 'Walk-in' :
                                                        sale.paymentChannel === 'BOOKING' ? 'จอง' :
                                                            sale.paymentChannel === 'ONLINE' ? 'Online' : sale.paymentChannel}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {/* Summary Row */}
                                    <TableRow className="bg-muted/50 font-semibold">
                                        <TableCell colSpan={4} className="text-right">
                                            รวมทั้งหมด
                                        </TableCell>
                                        <TableCell className="text-right text-yellow-600 dark:text-yellow-400">
                                            {formatCurrency(data?.summary?.byPaymentMethod?.deposit || 0)}
                                        </TableCell>
                                        <TableCell className="text-right text-green-600 dark:text-green-400">
                                            {formatCurrency(data?.summary?.byPaymentMethod?.transfer || 0)}
                                        </TableCell>
                                        <TableCell className="text-right text-purple-600 dark:text-purple-400">
                                            {formatCurrency(data?.summary?.byPaymentMethod?.credit || 0)}
                                        </TableCell>
                                        <TableCell className="text-right text-lg">
                                            {formatCurrency(data?.summary?.totalSales || 0)}
                                        </TableCell>
                                        <TableCell colSpan={2}></TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Commission Summary (if applicable) */}
            {data?.summary?.commissionSummary && (
                <Card>
                    <CardHeader>
                        <CardTitle>
                            สรุปค่าดำเนินการ
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                            <div className="text-center p-4 bg-muted/50 rounded-lg">
                                <p className="text-sm text-muted-foreground">ค่าดำเนินการ</p>
                                <p className="text-xl font-bold text-green-600 dark:text-green-400">
                                    {formatCurrency(data.summary.commissionSummary.operationFee)}
                                </p>
                            </div>
                            <div className="text-center p-4 bg-muted/50 rounded-lg">
                                <p className="text-sm text-muted-foreground">ค่าผู้ช่วยแพทย์</p>
                                <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                                    {formatCurrency(data.summary.commissionSummary.assistantFee)}
                                </p>
                            </div>
                            <div className="text-center p-4 bg-muted/50 rounded-lg">
                                <p className="text-sm text-muted-foreground">ค่าพนักงาน</p>
                                <p className="text-xl font-bold text-purple-600 dark:text-purple-400">
                                    {formatCurrency(data.summary.commissionSummary.staffFee)}
                                </p>
                            </div>
                            <div className="text-center p-4 bg-muted/50 rounded-lg">
                                <p className="text-sm text-muted-foreground">พตร.ทรีทเมนต์</p>
                                <p className="text-xl font-bold text-amber-600 dark:text-amber-400">
                                    {formatCurrency(data.summary.commissionSummary.treatmentFee)}
                                </p>
                            </div>
                            <div className="text-center p-4 bg-muted/50 rounded-lg">
                                <p className="text-sm text-muted-foreground">ค่าหัดการทำ</p>
                                <p className="text-xl font-bold text-pink-600 dark:text-pink-400">
                                    {formatCurrency(data.summary.commissionSummary.handFee)}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
