'use client'

import { useAuthStore } from '@/stores/auth-store'
import {
    Users,
    ShoppingCart,
    Package,
    TrendingUp,
    Calendar,
    DollarSign,
    AlertTriangle,
    ArrowUpRight,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const stats = [
    {
        title: 'ลูกค้าทั้งหมด',
        value: '1,234',
        change: '+12%',
        icon: Users,
        color: 'from-blue-500 to-blue-600',
    },
    {
        title: 'ยอดขายวันนี้',
        value: '฿45,600',
        change: '+8%',
        icon: ShoppingCart,
        color: 'from-green-500 to-green-600',
    },
    {
        title: 'สินค้าในคลัง',
        value: '456',
        change: '-3%',
        icon: Package,
        color: 'from-purple-500 to-purple-600',
    },
    {
        title: 'ยอดขายเดือนนี้',
        value: '฿1.2M',
        change: '+15%',
        icon: TrendingUp,
        color: 'from-pink-500 to-pink-600',
    },
]

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

    return (
        <div className="space-y-6">
            {/* Welcome Header */}
            <div className="rounded-xl bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 p-6 text-white shadow-lg">
                <h1 className="text-2xl font-bold">สวัสดี, {user?.full_name || 'ผู้ใช้'} 👋</h1>
                <p className="mt-1 text-white/80">
                    ยินดีต้อนรับเข้าสู่ระบบบริหารจัดการคลินิกความงาม
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat) => (
                    <Card key={stat.title} className="overflow-hidden">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-slate-500">{stat.title}</p>
                                    <p className="mt-1 text-2xl font-bold">{stat.value}</p>
                                    <p className="mt-1 flex items-center text-xs text-green-600">
                                        <ArrowUpRight className="mr-1 h-3 w-3" />
                                        {stat.change} จากเดือนที่แล้ว
                                    </p>
                                </div>
                                <div
                                    className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${stat.color} text-white shadow-lg`}
                                >
                                    <stat.icon className="h-6 w-6" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Main Content Grid */}
            <div className="grid gap-6 lg:grid-cols-2">
                {/* Upcoming Appointments */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                            <Calendar className="h-5 w-5 text-pink-500" />
                            นัดหมายวันนี้
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {upcomingAppointments.map((apt, i) => (
                                <div
                                    key={i}
                                    className="flex items-center justify-between rounded-lg bg-slate-50 p-3"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-pink-500 to-purple-600 text-sm font-medium text-white">
                                            {apt.customer.charAt(3)}
                                        </div>
                                        <div>
                                            <p className="font-medium">{apt.customer}</p>
                                            <p className="text-sm text-slate-500">{apt.service}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-medium text-pink-600">{apt.time}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Low Stock Alert */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-amber-500" />
                            สินค้าใกล้หมด
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {lowStockItems.map((item, i) => (
                                <div
                                    key={i}
                                    className="flex items-center justify-between rounded-lg bg-amber-50 p-3"
                                >
                                    <div>
                                        <p className="font-medium">{item.name}</p>
                                        <p className="text-sm text-slate-500">
                                            ขั้นต่ำ: {item.minQty} ชิ้น
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-lg font-bold text-amber-600">{item.qty}</p>
                                        <p className="text-xs text-slate-500">คงเหลือ</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <DollarSign className="h-5 w-5 text-green-500" />
                            การดำเนินการด่วน
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 md:grid-cols-4">
                            <a
                                href="/pos"
                                className="flex flex-col items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-green-600 p-6 text-white shadow-lg transition-transform hover:scale-105"
                            >
                                <ShoppingCart className="h-8 w-8" />
                                <span className="mt-2 font-medium">ขายสินค้า</span>
                            </a>
                            <a
                                href="/patients"
                                className="flex flex-col items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 p-6 text-white shadow-lg transition-transform hover:scale-105"
                            >
                                <Users className="h-8 w-8" />
                                <span className="mt-2 font-medium">ลูกค้า</span>
                            </a>
                            <a
                                href="/inventory"
                                className="flex flex-col items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 p-6 text-white shadow-lg transition-transform hover:scale-105"
                            >
                                <Package className="h-8 w-8" />
                                <span className="mt-2 font-medium">คลังสินค้า</span>
                            </a>
                            <a
                                href="/reports"
                                className="flex flex-col items-center justify-center rounded-xl bg-gradient-to-br from-pink-500 to-pink-600 p-6 text-white shadow-lg transition-transform hover:scale-105"
                            >
                                <TrendingUp className="h-8 w-8" />
                                <span className="mt-2 font-medium">รายงาน</span>
                            </a>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
