'use client'

import { Suspense, lazy } from 'react'
import {
    BarChart3, DollarSign, Package, CreditCard,
    Calendar, ShieldCheck
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import Link from 'next/link'
import { Skeleton } from '@/components/ui/skeleton'

// Lazy load report components
const SalesReportTab = lazy(() => import('@/components/reports/sales-report'))
const InventoryReportTab = lazy(() => import('@/components/reports/inventory-report'))
const DebtReportTab = lazy(() => import('@/components/reports/debt-report'))
const PdpaReportTab = lazy(() => import('@/components/reports/pdpa-report'))

function ReportSkeleton() {
    return (
        <div className="space-y-4">
            <Skeleton className="h-[120px] w-full rounded-xl" />
            <div className="grid gap-4 md:grid-cols-4">
                {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="h-[100px] rounded-xl" />
                ))}
            </div>
            <Skeleton className="h-[300px] w-full rounded-xl" />
        </div>
    )
}

export default function ReportsPage() {
    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-sm shadow-blue-200">
                            <BarChart3 className="h-5 w-5 text-white" />
                        </div>
                        รายงาน
                    </h1>
                    <p className="text-muted-foreground text-sm mt-1 ml-0.5">สรุปข้อมูลการดำเนินงาน</p>
                </div>
                <div className="flex gap-2">
                    <Link href="/reports/daily-sales">
                        <Button className="rounded-xl gap-2 shadow-md shadow-blue-100 transition-all hover:-translate-y-0.5" style={{ background: 'linear-gradient(135deg, #2563eb, #4f46e5)', color: 'white', border: 'none' }}>
                            <Calendar className="h-4 w-4" />
                            ยอดขายรายวัน
                        </Button>
                    </Link>
                </div>
            </div>

            <Tabs defaultValue="sales" className="space-y-4">
                <div className="overflow-x-auto pb-1 -mb-1">
                    <TabsList className="shadow-sm w-max min-w-full">
                        <TabsTrigger value="sales" className="gap-1.5 whitespace-nowrap">
                            <DollarSign className="h-4 w-4 shrink-0" />
                            ยอดขาย
                        </TabsTrigger>
                        <TabsTrigger value="inventory" className="gap-1.5 whitespace-nowrap">
                            <Package className="h-4 w-4 shrink-0" />
                            เคลื่อนไหวสินค้า
                        </TabsTrigger>
                        <TabsTrigger value="debt" className="gap-1.5 whitespace-nowrap">
                            <CreditCard className="h-4 w-4 shrink-0" />
                            ลูกหนี้ค้างชำระ
                        </TabsTrigger>
                        <TabsTrigger value="pdpa" className="gap-1.5 whitespace-nowrap">
                            <ShieldCheck className="h-4 w-4 shrink-0" />
                            ความยินยอม PDPA
                        </TabsTrigger>
                    </TabsList>
                </div>

                {/* Sales Report */}
                <TabsContent value="sales">
                    <Suspense fallback={<ReportSkeleton />}>
                        <SalesReportTab />
                    </Suspense>
                </TabsContent>

                {/* Inventory Report */}
                <TabsContent value="inventory">
                    <Suspense fallback={<ReportSkeleton />}>
                        <InventoryReportTab />
                    </Suspense>
                </TabsContent>

                {/* Debt Report */}
                <TabsContent value="debt">
                    <Suspense fallback={<ReportSkeleton />}>
                        <DebtReportTab />
                    </Suspense>
                </TabsContent>

                {/* PDPA Report */}
                <TabsContent value="pdpa">
                    <Suspense fallback={<ReportSkeleton />}>
                        <PdpaReportTab />
                    </Suspense>
                </TabsContent>
            </Tabs>
        </div>
    )
}
