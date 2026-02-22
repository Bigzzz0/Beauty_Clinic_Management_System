'use client'

import { Suspense, lazy } from 'react'
import {
    BarChart3, DollarSign, Users, Package, CreditCard,
    Calendar
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import Link from 'next/link'
import { Skeleton } from '@/components/ui/skeleton'

// Lazy load report components
const SalesReportTab = lazy(() => import('@/components/reports/sales-report'))
const CommissionReportTab = lazy(() => import('@/components/reports/commission-report'))
const InventoryReportTab = lazy(() => import('@/components/reports/inventory-report'))
const DebtReportTab = lazy(() => import('@/components/reports/debt-report'))

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
                        <Button className="bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 border-0 shadow-sm">
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
                    <Suspense fallback={<ReportSkeleton />}>
                        <SalesReportTab />
                    </Suspense>
                </TabsContent>

                {/* Commission Report */}
                <TabsContent value="commission">
                    <Suspense fallback={<ReportSkeleton />}>
                        <CommissionReportTab />
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
            </Tabs>
        </div>
    )
}
