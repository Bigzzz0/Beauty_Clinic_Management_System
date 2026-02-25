'use client'

import { useAuthStore } from '@/stores/auth-store'
import Link from 'next/link'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
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
    Bell,
    CreditCard,
    Banknote,
    QrCode,
    Clock,
    XCircle,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useQuery } from '@tanstack/react-query'
import { formatCurrency } from '@/lib/utils'

export default function DashboardPage() {
    const { user } = useAuthStore()
    const today = new Date().toISOString().split('T')[0]

    // Stat cards
    const { data: apiData, isLoading } = useQuery({
        queryKey: ['dashboard-stats'],
        queryFn: async () => {
            const response = await fetch('/api/transactions/sumeryDashboard')
            if (!response.ok) throw new Error('Network error')
            return response.json()
        }
    })

    // Low stock
    const { data: lowStockItems = [], isLoading: isLoadingStock } = useQuery({
        queryKey: ['low-stock-inventory'],
        queryFn: async () => {
            const response = await fetch('/api/inventory/low-stock')
            if (!response.ok) throw new Error('Network error')
            return response.json()
        }
    })

    // Today's appointments
    const { data: appointmentData, isLoading: isLoadingAppoint } = useQuery({
        queryKey: ['appointments-today'],
        queryFn: async () => {
            const response = await fetch(`/api/appointments?date=${today}&view=day`)
            if (!response.ok) throw new Error('Failed to fetch')
            return response.json()
        }
    })

    // Debtors (NEW)
    const { data: debtors = [] } = useQuery({
        queryKey: ['dashboard-debtors'],
        queryFn: async () => {
            const response = await fetch('/api/debtors')
            if (!response.ok) throw new Error('Failed')
            return response.json()
        }
    })

    // Notifications (NEW)
    const { data: notifData } = useQuery({
        queryKey: ['dashboard-notifications'],
        queryFn: async () => {
            const response = await fetch('/api/notifications')
            if (!response.ok) throw new Error('Failed')
            return response.json()
        }
    })

    // Sales report for payment breakdown (NEW)
    const { data: salesData } = useQuery({
        queryKey: ['dashboard-sales-today'],
        queryFn: async () => {
            const response = await fetch(`/api/reports/sales?startDate=${today}&endDate=${today}`)
            if (!response.ok) throw new Error('Failed')
            return response.json()
        }
    })

    const stats = apiData ? [
        { ...apiData[0], icon: Users, color: 'from-sky-500 to-sky-600' },
        { ...apiData[1], icon: ShoppingCart, color: 'from-amber-500 to-amber-600' },
        { ...apiData[2], icon: Package, color: 'from-slate-600 to-slate-700' },
        { ...apiData[3], icon: TrendingUp, color: 'from-emerald-500 to-emerald-600' },
    ] : []

    const appointments: any[] = appointmentData?.appointments || []
    const notifications: any[] = notifData?.notifications || []
    const paymentMethods: any[] = salesData?.byPaymentMethod || []

    // Appointment status counts
    const apptScheduled = appointments.filter((a: any) => a.status === 'SCHEDULED').length
    const apptCompleted = appointments.filter((a: any) => a.status === 'COMPLETED').length
    const apptCancelled = appointments.filter((a: any) => a.status === 'CANCELLED').length

    // Debtors summary
    const totalDebt = debtors.reduce((sum: number, d: any) => sum + d.total_debt, 0)

    // Payment method totals
    const cashTotal = paymentMethods.find((p: any) => p.method === 'CASH')?.amount || 0
    const transferTotal = paymentMethods.find((p: any) => p.method === 'TRANSFER')?.amount || 0
    const creditTotal = paymentMethods.find((p: any) => p.method === 'CREDIT')?.amount || 0
    const grandTotal = cashTotal + transferTotal + creditTotal

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
                    <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
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

            {/* Debtors Alert Banner */}
            {debtors.length > 0 && (
                <Link href="/debtors" className="block mt-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-0 rounded-xl bg-red-50 border border-red-200 px-5 py-3.5 hover:bg-red-100 transition-colors cursor-pointer">
                        <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-red-100">
                                <AlertTriangle className="h-4 w-4 text-red-600" />
                            </div>
                            <div>
                                <p className="font-semibold text-red-700">มีลูกหนี้ค้างชำระ {debtors.length} ราย</p>
                                <p className="text-sm text-red-500">ยอดรวมค้างชำระ {formatCurrency(totalDebt)}</p>
                            </div>
                        </div>
                        <span className="text-sm font-medium text-red-600 flex items-center gap-1">
                            ดูรายละเอียด <ArrowUpRight className="h-4 w-4" />
                        </span>
                    </div>
                </Link>
            )}

            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat) => (
                    <Card key={stat.title} className="overflow-hidden">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div className="flex-1">
                                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                                    <p className="mt-1 text-2xl font-bold">{stat.value}</p>
                                    <p className="mt-1 flex items-center text-xs text-emerald-600">
                                        <ArrowUpRight className="mr-1 h-3 w-3" />
                                        {stat.change} {stat.title === 'ยอดขายวันนี้' ? 'จากเมื่อวาน' : 'จากเดือนที่แล้ว'}
                                    </p>
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

            {/* Payment Breakdown (NEW) */}
            {grandTotal > 0 && (
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <CreditCard className="h-4 w-4 text-slate-500" />
                            ยอดขายวันนี้แยกตามช่องทางชำระ
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {[
                                { label: 'เงินสด', amount: cashTotal, icon: Banknote, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                                { label: 'โอนเงิน', amount: transferTotal, icon: QrCode, color: 'text-blue-600', bg: 'bg-blue-50' },
                                { label: 'บัตรเครดิต', amount: creditTotal, icon: CreditCard, color: 'text-purple-600', bg: 'bg-purple-50' },
                            ].map(({ label, amount, icon: Icon, color, bg }) => (
                                <div key={label} className={`rounded-xl ${bg} p-4`}>
                                    <div className="flex items-center gap-2 mb-2">
                                        <Icon className={`h-4 w-4 ${color}`} />
                                        <span className={`text-xs font-medium ${color}`}>{label}</span>
                                    </div>
                                    <p className={`text-lg font-bold ${color}`}>{formatCurrency(amount)}</p>
                                    <div className="mt-2 h-1.5 rounded-full bg-white/70">
                                        <div
                                            className={`h-full rounded-full ${color.replace('text-', 'bg-')}`}
                                            style={{ width: grandTotal > 0 ? `${(amount / grandTotal) * 100}%` : '0%' }}
                                        />
                                    </div>
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        {grandTotal > 0 ? Math.round((amount / grandTotal) * 100) : 0}%
                                    </p>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Main Content Grid */}
            <div className="grid gap-6 lg:grid-cols-2">
                {/* Upcoming Appointments */}
                <Card className="flex flex-col">
                    <CardHeader className="flex flex-col items-start sm:flex-row sm:items-center justify-between pb-2">
                        <CardTitle className="flex items-center gap-2">
                            <Calendar className="h-5 w-5 text-primary" aria-hidden="true" />
                            นัดหมายวันนี้
                        </CardTitle>
                        {/* Appointment Status Badges */}
                        {appointments.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-2 sm:mt-0">
                                {apptScheduled > 0 && (
                                    <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 gap-1 text-xs">
                                        <Clock className="h-3 w-3" /> {apptScheduled} รอ
                                    </Badge>
                                )}
                                {apptCompleted > 0 && (
                                    <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 gap-1 text-xs">
                                        <CheckCircle2 className="h-3 w-3" /> {apptCompleted} เสร็จ
                                    </Badge>
                                )}
                                {apptCancelled > 0 && (
                                    <Badge className="bg-red-100 text-red-700 hover:bg-red-100 gap-1 text-xs">
                                        <XCircle className="h-3 w-3" /> {apptCancelled} ยกเลิก
                                    </Badge>
                                )}
                            </div>
                        )}
                    </CardHeader>
                    <CardContent className="flex-1 p-0">
                        <ScrollArea className="h-[300px] px-6 pb-6">
                            <div className="space-y-3">
                                {appointments.map((apt: any, i: number) => (
                                    <div
                                        key={apt.appointment_id || i}
                                        className="flex items-center justify-between rounded-lg bg-muted/50 p-3"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-400 text-sm font-semibold text-slate-900">
                                                {(apt.customer?.first_name || apt.customer || '?').charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-medium">
                                                    {apt.customer?.first_name
                                                        ? `${apt.customer.first_name} ${apt.customer.last_name}`
                                                        : apt.customer}
                                                </p>
                                                <p className="text-sm text-muted-foreground">
                                                    {apt.customer_course?.course?.course_name || apt.service || 'นัดหมาย'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-medium text-amber-600">
                                                {apt.appointment_date
                                                    ? new Date(apt.appointment_date).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
                                                    : apt.time}
                                            </p>
                                            {apt.status && (
                                                <span className={`text-xs ${apt.status === 'COMPLETED' ? 'text-emerald-600' : apt.status === 'CANCELLED' ? 'text-red-500' : 'text-blue-500'}`}>
                                                    {apt.status === 'COMPLETED' ? 'เสร็จแล้ว' : apt.status === 'CANCELLED' ? 'ยกเลิก' : 'รอดำเนินการ'}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                {appointments.length === 0 && !isLoadingAppoint && (
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
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <AlertTriangle className="h-5 w-5 text-amber-500" aria-hidden="true" />
                            สินค้าใกล้หมด
                        </CardTitle>
                        {lowStockItems.length > 0 && (
                            <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">{lowStockItems.length} รายการ</Badge>
                        )}
                    </CardHeader>
                    <CardContent className="p-0">
                        <ScrollArea className="h-[300px] px-5 pb-4">
                            <div className="space-y-2.5">
                                {lowStockItems.length > 0 ? (
                                    lowStockItems.map((item: any, i: number) => (
                                        <div
                                            key={i}
                                            className="flex items-center justify-between rounded-lg bg-amber-50 dark:bg-amber-950/20 px-3 py-2"
                                        >
                                            <div>
                                                <p className="font-medium text-sm">{item.name}</p>
                                                <p className="text-xs text-muted-foreground">ขั้นต่ำ: {item.minQty}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-base font-bold text-amber-600">{item.qty}</p>
                                                <p className="text-xs text-muted-foreground">คงเหลือ</p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="flex flex-col items-center justify-center space-y-2 py-8 text-center text-emerald-600">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100">
                                            <CheckCircle2 className="h-5 w-5" />
                                        </div>
                                        <p className="text-sm font-medium">สต็อกสินค้าปกติ</p>
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
