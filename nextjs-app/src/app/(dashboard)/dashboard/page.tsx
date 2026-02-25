'use client'

import { useAuthStore } from '@/stores/auth-store'
import Link from 'next/link'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import {
    Users,
    ShoppingCart,
    Package,
    TrendingUp,
    Calendar,
    DollarSign,
    AlertTriangle,
    ArrowUpRight,
    CheckCircle2,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useQuery } from '@tanstack/react-query'

const upcomingAppointments = [
    { time: '09:00', customer: 'คุณสมหญิง', service: 'Botox 50 Units' },
    { time: '10:30', customer: 'คุณประภา', service: 'Filler ปาก' },
    { time: '13:00', customer: 'คุณสุดา', service: 'Laser หน้าใส' },
    { time: '14:30', customer: 'คุณมณี', service: 'Meso Vitamin C' },
]

const lowStockItems = [
    { name: 'Botox Aestox 100u', qty: 5, minQty: 10 },
    { name: 'Filler Juvederm', qty: 3, minQty: 8 },
    { name: 'Vitamin C Serum', qty: 8, minQty: 15 },
]

export default function DashboardPage() {
    const { user } = useAuthStore()

    // ดึงข้อมูลจาก API
    const { data: apiData, isLoading } = useQuery({
        queryKey: ['dashboard-stats'],
        queryFn: async () => {
            const response = await fetch('/api/transactions/sumeryDashboard') // ปรับ Path ให้ตรงกับ route.ts ของคุณ
            if (!response.ok) throw new Error('Network error')
            return response.json()
        }
    })

    // แมพข้อมูลเข้ากับรูปแบบที่ HTML เดิมต้องการ
    const stats = apiData ? [
        { ...apiData[0], icon: Users, color: 'from-sky-500 to-sky-600' },
        { ...apiData[1], icon: ShoppingCart, color: 'from-amber-500 to-amber-600' },
        { ...apiData[2], icon: Package, color: 'from-slate-600 to-slate-700' },
        { ...apiData[3], icon: TrendingUp, color: 'from-emerald-500 to-emerald-600' },
    ] : []

    const { data: lowStockItems = [], isLoading: isLoadingStock } = useQuery({
        queryKey: ['low-stock-inventory'],
        queryFn: async () => {
            const response = await fetch('/api/inventory/low-stock')
            if (!response.ok) throw new Error('Network error')
            return response.json()
        }
    })

    const { data: upcomingAppointments = [], isLoading: isLoadingAppoint } = useQuery({
        queryKey: ['upcoming-appointments'],
        queryFn: async () => {
            const response = await fetch('/api/courses/upcoming')
            if (!response.ok) throw new Error('Failed to fetch')
            return response.json()
        }
    })

    if (isLoading) {
        return (
            <div className="space-y-6" aria-busy="true" aria-live="polite">
                <Skeleton className="h-[120px] w-full rounded-xl" />
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {[...Array(4)].map((_, i) => (
                        <Skeleton key={i} className="h-[140px] rounded-xl" />
                    ))}
                </div>
                <div className="grid gap-6 lg:grid-cols-2">
                    <Skeleton className="h-[300px] rounded-xl" />
                    <Skeleton className="h-[300px] rounded-xl" />
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Welcome Header */}
            <div className="rounded-xl bg-white border border-amber-200 p-6 shadow-[0_2px_12px_rgba(0,0,0,0.04)] flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-400 flex-shrink-0">
                    <span className="text-xl font-bold text-slate-900">BC</span>
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">สวัสดี, {user?.full_name || 'ผู้ใช้'} 👋</h1>
                    <p className="mt-0.5 text-slate-500">
                        ยินดีต้อนรับเข้าสู่ระบบบริหารจัดการคลินิกความงาม
                    </p>
                </div>
            </div>

            {/* Quick Actions */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <DollarSign className="h-5 w-5 text-emerald-500" aria-hidden="true" />
                        การดำเนินการด่วน
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-4">
                        <Link
                            href="/pos"
                            className="flex flex-col items-center justify-center rounded-xl bg-amber-500 p-4 text-white shadow-sm transition-transform hover:scale-[1.02] hover:bg-amber-600 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2"
                            aria-label="ไปที่หน้าขายสินค้า (POS)"
                        >
                            <ShoppingCart className="h-6 w-6" aria-hidden="true" />
                            <span className="mt-2 font-medium">ขายสินค้า</span>
                        </Link>
                        <Link
                            href="/patients"
                            className="flex flex-col items-center justify-center rounded-xl bg-sky-500 p-4 text-white shadow-sm transition-transform hover:scale-[1.02] hover:bg-sky-600 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2"
                            aria-label="ไปที่หน้าจัดการลูกค้า"
                        >
                            <Users className="h-6 w-6" aria-hidden="true" />
                            <span className="mt-2 font-medium">ลูกค้า</span>
                        </Link>
                        <Link
                            href="/inventory"
                            className="flex flex-col items-center justify-center rounded-xl bg-slate-600 p-4 text-white shadow-sm transition-transform hover:scale-[1.02] hover:bg-slate-700 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2"
                            aria-label="ไปที่หน้าคลังสินค้า"
                        >
                            <Package className="h-6 w-6" aria-hidden="true" />
                            <span className="mt-2 font-medium">คลังสินค้า</span>
                        </Link>
                        <Link
                            href="/reports"
                            className="flex flex-col items-center justify-center rounded-xl bg-amber-600 p-4 text-white shadow-sm transition-transform hover:scale-[1.02] hover:bg-amber-700 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2"
                            aria-label="ไปที่หน้ารายงาน"
                        >
                            <TrendingUp className="h-6 w-6" aria-hidden="true" />
                            <span className="mt-2 font-medium">รายงาน</span>
                        </Link>
                    </div>
                </CardContent>
            </Card>

            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat) => (
                    <Card key={stat.title} className="overflow-hidden">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                                    <p className="mt-1 text-2xl font-bold">{stat.value}</p>
                                    {stat.title === 'ยอดขายวันนี้' && (
                                        <p className="mt-1 flex items-center text-xs text-emerald-600">
                                            <ArrowUpRight className="mr-1 h-3 w-3" />
                                            {stat.change} จากเมื่อวาน
                                        </p>
                                    )}
                                    {stat.title !== 'ยอดขายวันนี้' && (
                                        <p className="mt-1 flex items-center text-xs text-emerald-600">
                                            <ArrowUpRight className="mr-1 h-3 w-3" />
                                            {stat.change} จากเดือนที่แล้ว
                                        </p>
                                    )}
                                </div>
                                <div
                                    className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${stat.color} text-white shadow-lg`}
                                >
                                    <stat.icon className="h-6 w-6" aria-hidden="true" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Main Content Grid */}
            <div className="grid gap-6 lg:grid-cols-2">
                {/* Upcoming Appointments */}
                <Card className="flex flex-col">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                            <Calendar className="h-5 w-5 text-primary" aria-hidden="true" />
                            นัดหมายวันนี้
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 p-0">
                        <ScrollArea className="h-[300px] px-6 pb-6">
                            <div className="space-y-4">
                                {upcomingAppointments.map((apt: any, i: number) => (
                                    <div
                                        key={i}
                                        className="flex items-center justify-between rounded-lg bg-muted/50 p-3"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-400 text-sm font-semibold text-slate-900">
                                                {apt.customer.charAt(3)}
                                            </div>
                                            <div>
                                                <p className="font-medium">{apt.customer}</p>
                                                <p className="text-sm text-muted-foreground">{apt.service}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-medium text-amber-600">{apt.time}</p>
                                        </div>
                                    </div>
                                ))}
                                {upcomingAppointments.length === 0 && (
                                    <div className="flex h-full flex-col items-center justify-center space-y-2 py-8 text-center text-muted-foreground">
                                        <Calendar className="h-8 w-8 opacity-50" />
                                        <p>ไม่มีนัดหมายวันนี้</p>
                                    </div>
                                )}
                            </div>
                        </ScrollArea>
                    </CardContent>
                </Card>

                {/* Low Stock Alert */}
                <Card className="flex flex-col">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-amber-500" aria-hidden="true" />
                            สินค้าใกล้หมด
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 p-0">
                        <ScrollArea className="h-[300px] px-6 pb-6">
                            <div className="space-y-4">
                                {lowStockItems.length > 0 ? (
                                    lowStockItems.map((item: any, i: number) => (
                                        <div
                                            key={i}
                                            className="flex items-center justify-between rounded-lg bg-amber-50 dark:bg-amber-950/20 p-3"
                                        >
                                            <div>
                                                <p className="font-medium">{item.name}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    ขั้นต่ำ: {item.minQty} ชิ้น
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-lg font-bold text-amber-600">{item.qty}</p>
                                                <p className="text-xs text-muted-foreground">คงเหลือ</p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="flex flex-col items-center justify-center space-y-2 py-8 text-center text-emerald-600">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                                            <CheckCircle2 className="h-6 w-6" />
                                        </div>
                                        <p className="font-medium">สต็อกสินค้าปกติ</p>
                                        <p className="text-xs text-muted-foreground">ไม่มีสินค้าที่ต่ำกว่าเกณฑ์</p>
                                    </div>
                                )}
                            </div>
                        </ScrollArea>
                    </CardContent>
                </Card>

            </div>
        </div>
    )
}

