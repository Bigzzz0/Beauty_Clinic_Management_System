'use client'

import { useAuthStore } from '@/stores/auth-store'
import Image from 'next/image'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
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
    const searchParams = useSearchParams()
    const router = useRouter()
    const today = new Date().toISOString().split('T')[0]
    const [currentTime, setCurrentTime] = useState('')
    const [currentDate, setCurrentDate] = useState('')

    useEffect(() => {
        const update = () => {
            const now = new Date()
            setCurrentTime(now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Bangkok' }))
            setCurrentDate(now.toLocaleDateString('th-TH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Asia/Bangkok' }))
        }
        update()
        const interval = setInterval(update, 1000)
        return () => clearInterval(interval)
    }, [])

    useEffect(() => {
        if (searchParams?.get('error') === 'unauthorized') {
            toast.error('ไม่มีสิทธิ์เข้าถึงหน้านี้', {
                description: 'บทบาทของคุณไม่ได้รับอนุญาตให้ใช้ฟังก์ชันนี้'
            });
            // Cleanup query param
            router.replace('/dashboard');
        }
    }, [searchParams, router]);

    const canViewFinancials = Boolean(
        user && ['Admin', 'Manager', 'Sale', 'Cashier'].includes(user.position)
    );

    const { data: apiData, isLoading } = useQuery({
        queryKey: ['dashboard-stats'],
        queryFn: async () => {
            const response = await fetch('/api/transactions/sumeryDashboard')
            if (!response.ok) return null // Handle 403 gracefully
            return response.json()
        },
        enabled: canViewFinancials
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
            if (!response.ok) return [] // Handle 403 gracefully
            return response.json()
        },
        enabled: canViewFinancials
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
            if (!response.ok) return null // Handle 403 gracefully
            return response.json()
        },
        enabled: canViewFinancials
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
        <div className="space-y-5">
            {/* Welcome Header */}
            <div
                className="animate-fade-in relative overflow-hidden rounded-2xl p-6 text-white shadow-lg"
                style={{ background: 'linear-gradient(135deg, #78350f 0%, #b45309 40%, #d97706 80%, #f59e0b 100%)' }}
            >
                {/* Background decorative elements */}
                <div className="absolute top-0 right-0 h-40 w-40 -translate-y-8 translate-x-8 rounded-full bg-white/5" />
                <div className="absolute bottom-0 right-16 h-24 w-24 translate-y-8 rounded-full bg-white/10" />

                <div className="relative flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl overflow-hidden bg-white/20 ring-2 ring-white/30 shadow-lg">
                            <Image src="/JinLogo.jpg" alt="Jiin Clinic" width={56} height={56} className="w-full h-full object-contain" />
                        </div>
                        <div>
                            <p className="text-amber-200/80 text-xs font-medium mb-0.5">{currentDate}</p>
                            <h1 className="text-xl font-bold text-white">สวัสดี, {user?.full_name || 'ผู้ใช้'} 👋</h1>
                            <p className="text-amber-100/80 text-sm mt-0.5">ยินดีต้อนรับเข้าสู่ระบบบริหารจัดการคลินิกความงาม</p>
                        </div>
                    </div>
                    <div className="hidden sm:flex flex-col items-end gap-1">
                        <p className="text-3xl font-mono font-bold text-white/90 tabular-nums tracking-wide">{currentTime}</p>
                        <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white">{user?.position}</span>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="animate-fade-in-up">
                <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-400">การดำเนินการด่วน</p>
                <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
                    {[
                        { href: '/pos', bg: 'from-amber-500 to-orange-500', ring: 'ring-amber-300', icon: ShoppingCart, label: 'ขายสินค้า' },
                        { href: '/patients', bg: 'from-sky-500 to-blue-600', ring: 'ring-sky-300', icon: Users, label: 'ลูกค้า' },
                        { href: '/inventory', bg: 'from-slate-600 to-slate-700', ring: 'ring-slate-400', icon: Package, label: 'คลังสินค้า' },
                        { href: '/reports', bg: 'from-emerald-500 to-green-600', ring: 'ring-emerald-300', icon: TrendingUp, label: 'รายงาน' },
                    ].map(({ href, bg, ring, icon: Icon, label }) => (
                        <Link
                            key={href}
                            href={href}
                            className={`group relative flex flex-col items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-br ${bg} p-5 text-white shadow-md hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 active:scale-95 focus-visible:outline-none focus-visible:ring-2 ${ring} focus-visible:ring-offset-2`}
                        >
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 group-hover:bg-white/30 transition-colors">
                                <Icon className="h-5 w-5" aria-hidden="true" />
                            </div>
                            <span className="text-sm font-semibold">{label}</span>
                        </Link>
                    ))}
                </div>
            </div>

            {/* Debtors Alert Banner */}
            {canViewFinancials && debtors.length > 0 && (
                <Link href="/debtors" className="block animate-fade-in">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-0 rounded-2xl bg-red-50 border border-red-200/80 px-5 py-4 hover:bg-red-100/80 transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 animate-pulse-glow">
                                <AlertTriangle className="h-5 w-5 text-red-600" />
                            </div>
                            <div>
                                <p className="font-bold text-red-700">มีลูกหนี้ค้างชำระ {debtors.length} ราย</p>
                                <p className="text-sm text-red-500">ยอดรวมค้างชำระ {formatCurrency(totalDebt)}</p>
                            </div>
                        </div>
                        <span className="text-sm font-semibold text-red-600 flex items-center gap-1.5 bg-red-100 rounded-full px-4 py-1.5">
                            ดูรายละเอียด <ArrowUpRight className="h-4 w-4" />
                        </span>
                    </div>
                </Link>
            )}

            {/* Stats Grid */}
            {canViewFinancials && stats.length > 0 && (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {stats.map((stat, i) => (
                        <Card key={stat.title} className={`overflow-hidden border-0 shadow-sm animate-fade-in-up-delay-${i + 1}`}>
                            <CardContent className="p-5">
                                <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{stat.title}</p>
                                        <p className="mt-1.5 text-2xl font-bold text-slate-800">{stat.value}</p>
                                        <p className="mt-1 flex items-center text-xs text-emerald-600 font-medium">
                                            <ArrowUpRight className="mr-1 h-3 w-3" />
                                            {stat.change} {stat.title === 'ยอดขายวันนี้' ? 'จากเมื่อวาน' : 'จากเดือนที่แล้ว'}
                                        </p>
                                    </div>
                                    <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${stat.color} text-white shadow-lg`}>
                                        <stat.icon className="h-6 w-6" aria-hidden="true" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Payment Breakdown (NEW) */}
            {canViewFinancials && grandTotal > 0 && (
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
                        <ScrollArea className="h-[300px] px-4 pb-4">
                            <div className="space-y-2">
                                {appointments.map((apt: any, i: number) => {
                                    const statusColor = apt.status === 'COMPLETED'
                                        ? 'border-emerald-400 bg-emerald-50/50'
                                        : apt.status === 'CANCELLED'
                                            ? 'border-red-300 bg-red-50/50'
                                            : 'border-blue-400 bg-blue-50/50'
                                    const statusText = apt.status === 'COMPLETED' ? 'เสร็จแล้ว' : apt.status === 'CANCELLED' ? 'ยกเลิก' : 'รอดำเนินการ'
                                    const statusTextColor = apt.status === 'COMPLETED' ? 'text-emerald-600' : apt.status === 'CANCELLED' ? 'text-red-500' : 'text-blue-600'
                                    const initial = (apt.customer?.first_name || apt.customer || '?').charAt(0)

                                    return (
                                        <div
                                            key={apt.appointment_id || i}
                                            className={`flex items-center justify-between rounded-xl border-l-4 bg-white px-3 py-3 shadow-xs hover:shadow-sm transition-shadow ${statusColor}`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-amber-500 text-sm font-bold text-white shadow-sm">
                                                    {initial}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-slate-800 text-sm">
                                                        {apt.customer?.first_name
                                                            ? `${apt.customer.first_name} ${apt.customer.last_name}`
                                                            : apt.customer}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {apt.customer_course?.course?.course_name || apt.service || 'นัดหมาย'}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-amber-600 text-sm">
                                                    {apt.appointment_date
                                                        ? new Date(apt.appointment_date).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
                                                        : apt.time}
                                                </p>
                                                {apt.status && (
                                                    <span className={`text-xs font-medium ${statusTextColor}`}>{statusText}</span>
                                                )}
                                            </div>
                                        </div>
                                    )
                                })}
                                {appointments.length === 0 && !isLoadingAppoint && (
                                    <div className="flex h-full flex-col items-center justify-center space-y-2 py-10 text-center text-muted-foreground">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                                            <Calendar className="h-6 w-6 opacity-50" />
                                        </div>
                                        <p className="text-sm">ไม่มีนัดหมายวันนี้</p>
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
