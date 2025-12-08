'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
    Package,
    PackagePlus,
    Truck,
    ClipboardEdit,
    Syringe,
    Search,
    ArrowUpDown,
    CheckCircle,
    AlertTriangle,
    XCircle,
    TrendingDown,
    Calendar,
    FileSpreadsheet
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth-store'
import { formatDateTime } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'

interface InventoryItem {
    product_id: number
    product_code: string | null
    product_name: string
    category: string
    main_unit: string
    sub_unit: string
    pack_size: number
    full_qty: number
    opened_qty: number
    total_sub_units: number
}

interface DailyUsageData {
    date: string
    summary: {
        products_used: number
        total_times: number
        total_units: number
    }
    by_category: Record<string, number>
    by_product: Array<{
        product_id: number
        product_code: string | null
        product_name: string
        category: string
        sub_unit: string
        times: number
        total_used: number
    }>
    detail_log: Array<{
        time: string
        product_name: string
        qty_used: number
        sub_unit: string
        customer_name: string | null
        note: string | null
    }>
}

interface StockCardData {
    month: number
    year: number
    summary: {
        total_products: number
        total_in: number
        total_out: number
        total_adjustment: number
    }
    stock_card: Array<{
        product_id: number
        product_code: string | null
        product_name: string
        category: string
        sub_unit: string
        begin_balance: number
        stock_in: number
        stock_out: number
        adjustment: number
        end_balance: number
        opened_qty: number
    }>
}

const categories = ['Botox', 'Filler', 'Treatment', 'Medicine', 'Equipment', 'Skin']
const months = [
    { value: 1, label: 'มกราคม' },
    { value: 2, label: 'กุมภาพันธ์' },
    { value: 3, label: 'มีนาคม' },
    { value: 4, label: 'เมษายน' },
    { value: 5, label: 'พฤษภาคม' },
    { value: 6, label: 'มิถุนายน' },
    { value: 7, label: 'กรกฎาคม' },
    { value: 8, label: 'สิงหาคม' },
    { value: 9, label: 'กันยายน' },
    { value: 10, label: 'ตุลาคม' },
    { value: 11, label: 'พฤศจิกายน' },
    { value: 12, label: 'ธันวาคม' },
]

const quickActions = [
    { href: '/inventory/stock-in', icon: PackagePlus, label: 'รับสินค้าเข้า', color: 'from-green-500 to-green-600' },
    { href: '/inventory/transfer', icon: Truck, label: 'โอนย้าย', color: 'from-blue-500 to-blue-600' },
    { href: '/inventory/adjustment', icon: ClipboardEdit, label: 'ปรับยอด', color: 'from-amber-500 to-amber-600' },
    { href: '/inventory/usage', icon: Syringe, label: 'บันทึกการใช้', color: 'from-purple-500 to-purple-600' },
]

export default function InventoryPage() {
    const [search, setSearch] = useState('')
    const [category, setCategory] = useState<string>('')
    const [sortBy, setSortBy] = useState<string>('product_name')
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())

    const token = useAuthStore((s) => s.token)

    // Fetch inventory data
    const { data: inventory = [], isLoading } = useQuery<InventoryItem[]>({
        queryKey: ['inventory', { search, category, sortBy, sortOrder }],
        queryFn: async () => {
            const params = new URLSearchParams()
            if (search) params.set('search', search)
            if (category && category !== 'all') params.set('category', category)
            params.set('sortBy', sortBy)
            params.set('sortOrder', sortOrder)

            const res = await fetch(`/api/inventory?${params}`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            })
            if (!res.ok) throw new Error('Failed to fetch inventory')
            return res.json()
        },
    })

    // Fetch daily usage
    const { data: dailyUsage } = useQuery<DailyUsageData>({
        queryKey: ['daily-usage', selectedDate],
        queryFn: async () => {
            const res = await fetch(`/api/inventory/daily-usage?date=${selectedDate}`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            })
            if (!res.ok) throw new Error('Failed to fetch daily usage')
            return res.json()
        },
    })

    // Fetch stock card
    const { data: stockCard } = useQuery<StockCardData>({
        queryKey: ['stock-card', selectedMonth, selectedYear],
        queryFn: async () => {
            const res = await fetch(`/api/inventory/stock-card?month=${selectedMonth}&year=${selectedYear}`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            })
            if (!res.ok) throw new Error('Failed to fetch stock card')
            return res.json()
        },
    })

    const handleSort = (column: string) => {
        if (sortBy === column) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
        } else {
            setSortBy(column)
            setSortOrder('asc')
        }
    }

    // Calculate stats
    const normalStock = inventory.filter(i => i.total_sub_units > 10).length
    const lowStock = inventory.filter(i => i.total_sub_units > 0 && i.total_sub_units <= 10).length
    const outOfStock = inventory.filter(i => i.total_sub_units === 0).length

    const getStockStatus = (item: InventoryItem) => {
        if (item.total_sub_units === 0) return 'out'
        if (item.total_sub_units <= 10) return 'low'
        return 'normal'
    }

    const getCategoryColor = (cat: string) => {
        const colors: Record<string, string> = {
            Botox: 'text-pink-400',
            Filler: 'text-purple-400',
            Treatment: 'text-blue-400',
            Medicine: 'text-green-400',
            Equipment: 'text-slate-400',
            Skin: 'text-amber-400',
        }
        return colors[cat] || 'text-slate-400'
    }

    return (
        <div className="space-y-6 bg-slate-900 min-h-screen -m-6 p-6 text-white">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Package className="h-6 w-6 text-purple-400" />
                        รายงานคลังสินค้า
                    </h1>
                    <p className="text-slate-400">ติดตามสต๊อกและการเคลื่อนไหวของสินค้า</p>
                </div>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="stock" className="space-y-6">
                <TabsList className="bg-slate-800 border border-slate-700 p-1">
                    <TabsTrigger
                        value="stock"
                        className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white text-slate-400"
                    >
                        <Package className="h-4 w-4 mr-2" />
                        สต๊อกคงเหลือ
                    </TabsTrigger>
                    <TabsTrigger
                        value="usage"
                        className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white text-slate-400"
                    >
                        <Calendar className="h-4 w-4 mr-2" />
                        การใช้ประจำวัน
                    </TabsTrigger>
                    <TabsTrigger
                        value="card"
                        className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white text-slate-400"
                    >
                        <FileSpreadsheet className="h-4 w-4 mr-2" />
                        Stock Card
                    </TabsTrigger>
                </TabsList>

                {/* Stock Overview Tab */}
                <TabsContent value="stock" className="space-y-6">
                    {/* Summary Stats */}
                    <div className="grid gap-4 sm:grid-cols-4">
                        <Card className="bg-slate-800 border-slate-700">
                            <CardContent className="p-4">
                                <p className="text-sm text-slate-400">สินค้าทั้งหมด</p>
                                <p className="text-3xl font-bold text-white">{inventory.length}</p>
                            </CardContent>
                        </Card>
                        <Card className="bg-slate-800 border-slate-700">
                            <CardContent className="p-4">
                                <div className="flex items-center gap-2">
                                    <CheckCircle className="h-4 w-4 text-green-400" />
                                    <p className="text-sm text-slate-400">สต๊อกปกติ</p>
                                </div>
                                <p className="text-3xl font-bold text-green-400">{normalStock}</p>
                            </CardContent>
                        </Card>
                        <Card className="bg-slate-800 border-slate-700">
                            <CardContent className="p-4">
                                <div className="flex items-center gap-2">
                                    <AlertTriangle className="h-4 w-4 text-yellow-400" />
                                    <p className="text-sm text-slate-400">สต๊อกต่ำ</p>
                                </div>
                                <p className="text-3xl font-bold text-yellow-400">{lowStock}</p>
                            </CardContent>
                        </Card>
                        <Card className="bg-slate-800 border-slate-700">
                            <CardContent className="p-4">
                                <div className="flex items-center gap-2">
                                    <XCircle className="h-4 w-4 text-red-400" />
                                    <p className="text-sm text-slate-400">หมด</p>
                                </div>
                                <p className="text-3xl font-bold text-red-400">{outOfStock}</p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Today's Movement */}
                    <Card className="bg-slate-800 border-slate-700">
                        <CardContent className="p-4">
                            <p className="text-sm text-slate-400 mb-1">ความเคลื่อนไหววันนี้</p>
                            <div className="flex items-center gap-2 text-purple-400">
                                <TrendingDown className="h-5 w-5" />
                                <span>เบิกออก</span>
                                <span className="font-bold">{dailyUsage?.summary.total_times || 0} รายการ</span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Quick Actions */}
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        {quickActions.map((action) => (
                            <Link key={action.href} href={action.href}>
                                <Card className={`cursor-pointer bg-gradient-to-br ${action.color} text-white transition-transform hover:scale-105 border-0`}>
                                    <CardContent className="flex items-center gap-3 p-4">
                                        <action.icon className="h-6 w-6" />
                                        <span className="font-medium">{action.label}</span>
                                    </CardContent>
                                </Card>
                            </Link>
                        ))}
                    </div>

                    {/* Search and Filter */}
                    <div className="flex flex-col gap-4 md:flex-row">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                            <Input
                                placeholder="ค้นหาสินค้า..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                            />
                        </div>
                        <Select value={category} onValueChange={setCategory}>
                            <SelectTrigger className="w-full md:w-48 bg-slate-800 border-slate-700 text-white">
                                <SelectValue placeholder="หมวดหมู่ทั้งหมด" />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-800 border-slate-700">
                                <SelectItem value="all" className="text-white hover:bg-slate-700">ทั้งหมด</SelectItem>
                                {categories.map((cat) => (
                                    <SelectItem key={cat} value={cat} className="text-white hover:bg-slate-700">{cat}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Inventory Table */}
                    <Card className="bg-slate-800 border-slate-700">
                        <CardHeader>
                            <CardTitle className="text-white">รายการสต๊อกคงเหลือ</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-lg border border-slate-700 overflow-hidden">
                                <Table>
                                    <TableHeader className="bg-slate-900">
                                        <TableRow className="border-slate-700 hover:bg-slate-800">
                                            <TableHead className="text-slate-400 w-16">สถานะ</TableHead>
                                            <TableHead className="text-slate-400">รหัส</TableHead>
                                            <TableHead
                                                className="text-slate-400 cursor-pointer"
                                                onClick={() => handleSort('product_name')}
                                            >
                                                <div className="flex items-center gap-1">
                                                    สินค้า
                                                    <ArrowUpDown className="h-3 w-3" />
                                                </div>
                                            </TableHead>
                                            <TableHead className="text-slate-400">หมวด</TableHead>
                                            <TableHead className="text-slate-400 text-right">สต๊อกคงเหลือ</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {isLoading ? (
                                            [...Array(5)].map((_, i) => (
                                                <TableRow key={i} className="border-slate-700">
                                                    <TableCell colSpan={5}>
                                                        <div className="h-12 animate-pulse rounded bg-slate-700" />
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        ) : inventory.length === 0 ? (
                                            <TableRow className="border-slate-700">
                                                <TableCell colSpan={5} className="text-center py-8 text-slate-400">
                                                    ไม่พบข้อมูลสินค้า
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            inventory.map((item) => {
                                                const status = getStockStatus(item)
                                                return (
                                                    <TableRow key={item.product_id} className="border-slate-700 hover:bg-slate-700/50">
                                                        <TableCell>
                                                            {status === 'normal' && <CheckCircle className="h-5 w-5 text-green-400" />}
                                                            {status === 'low' && <AlertTriangle className="h-5 w-5 text-yellow-400" />}
                                                            {status === 'out' && <XCircle className="h-5 w-5 text-red-400" />}
                                                        </TableCell>
                                                        <TableCell className="text-purple-400 font-mono text-sm">
                                                            {item.product_code}
                                                        </TableCell>
                                                        <TableCell className="text-white font-medium">
                                                            {item.product_name}
                                                        </TableCell>
                                                        <TableCell className={getCategoryColor(item.category)}>
                                                            {item.category}
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            <span className="text-white font-medium">{item.full_qty}</span>
                                                            <span className="text-slate-400 ml-1">{item.main_unit}</span>
                                                            {item.opened_qty > 0 && (
                                                                <span className="text-pink-400 ml-1">(+{item.opened_qty} {item.sub_unit})</span>
                                                            )}
                                                        </TableCell>
                                                    </TableRow>
                                                )
                                            })
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Daily Usage Tab */}
                <TabsContent value="usage" className="space-y-6">
                    {/* Date Picker */}
                    <Card className="bg-slate-800 border-slate-700">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <Calendar className="h-5 w-5 text-slate-400" />
                                <Input
                                    type="date"
                                    value={selectedDate}
                                    onChange={(e) => setSelectedDate(e.target.value)}
                                    className="w-48 bg-slate-900 border-slate-700 text-white"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Summary Stats */}
                    <div className="grid gap-4 sm:grid-cols-3">
                        <Card className="bg-slate-800 border-slate-700">
                            <CardContent className="p-4">
                                <p className="text-sm text-slate-400">สินค้าที่ใช้</p>
                                <p className="text-3xl font-bold text-white">
                                    {dailyUsage?.summary.products_used || 0} <span className="text-lg text-slate-400">รายการ</span>
                                </p>
                            </CardContent>
                        </Card>
                        <Card className="bg-slate-800 border-slate-700">
                            <CardContent className="p-4">
                                <p className="text-sm text-slate-400">จำนวนครั้ง</p>
                                <p className="text-3xl font-bold text-white">
                                    {dailyUsage?.summary.total_times || 0} <span className="text-lg text-slate-400">ครั้ง</span>
                                </p>
                            </CardContent>
                        </Card>
                        <Card className="bg-slate-800 border-slate-700">
                            <CardContent className="p-4">
                                <p className="text-sm text-slate-400">หน่วยที่ใช้ไป</p>
                                <p className="text-3xl font-bold text-pink-400">
                                    {dailyUsage?.summary.total_units || 0} <span className="text-lg text-slate-400">Units</span>
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Category Breakdown */}
                    {dailyUsage?.by_category && Object.keys(dailyUsage.by_category).length > 0 && (
                        <Card className="bg-slate-800 border-slate-700">
                            <CardHeader>
                                <CardTitle className="text-white text-lg">แยกตามหมวดหมู่</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
                                    {Object.entries(dailyUsage.by_category).map(([cat, units]) => (
                                        <div key={cat} className="p-3 rounded-lg bg-slate-900">
                                            <p className={`text-sm ${getCategoryColor(cat)}`}>{cat}</p>
                                            <p className="text-xl font-bold text-white">{units} <span className="text-sm text-slate-400">units</span></p>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Product Usage Table */}
                    <Card className="bg-slate-800 border-slate-700">
                        <CardHeader>
                            <CardTitle className="text-white">การใช้แยกตามสินค้า</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-lg border border-slate-700 overflow-hidden">
                                <Table>
                                    <TableHeader className="bg-slate-900">
                                        <TableRow className="border-slate-700">
                                            <TableHead className="text-slate-400">รหัส</TableHead>
                                            <TableHead className="text-slate-400">สินค้า</TableHead>
                                            <TableHead className="text-slate-400">หมวด</TableHead>
                                            <TableHead className="text-slate-400 text-center">จำนวนครั้ง</TableHead>
                                            <TableHead className="text-slate-400 text-right">รวมใช้ไป</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {!dailyUsage?.by_product?.length ? (
                                            <TableRow className="border-slate-700">
                                                <TableCell colSpan={5} className="text-center py-8 text-slate-400">
                                                    ไม่มีข้อมูลการใช้
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            dailyUsage.by_product.map((item) => (
                                                <TableRow key={item.product_id} className="border-slate-700 hover:bg-slate-700/50">
                                                    <TableCell className="text-purple-400 font-mono text-sm">
                                                        {item.product_code}
                                                    </TableCell>
                                                    <TableCell className="text-white">{item.product_name}</TableCell>
                                                    <TableCell className={getCategoryColor(item.category)}>{item.category}</TableCell>
                                                    <TableCell className="text-center text-white">{item.times}</TableCell>
                                                    <TableCell className="text-right">
                                                        <span className="text-pink-400 font-bold">{item.total_used}</span>
                                                        <span className="text-slate-400 ml-1">{item.sub_unit}</span>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Detail Log */}
                    {dailyUsage?.detail_log && dailyUsage.detail_log.length > 0 && (
                        <Card className="bg-slate-800 border-slate-700">
                            <CardHeader>
                                <CardTitle className="text-white">รายละเอียดการใช้</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="rounded-lg border border-slate-700 overflow-hidden">
                                    <Table>
                                        <TableHeader className="bg-slate-900">
                                            <TableRow className="border-slate-700">
                                                <TableHead className="text-slate-400">เวลา</TableHead>
                                                <TableHead className="text-slate-400">สินค้า</TableHead>
                                                <TableHead className="text-slate-400 text-center">จำนวน</TableHead>
                                                <TableHead className="text-slate-400">ลูกค้า</TableHead>
                                                <TableHead className="text-slate-400">หมายเหตุ</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {dailyUsage.detail_log.map((log, i) => (
                                                <TableRow key={i} className="border-slate-700 hover:bg-slate-700/50">
                                                    <TableCell className="text-slate-400 text-sm">
                                                        {log.time ? new Date(log.time).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) : '-'}
                                                    </TableCell>
                                                    <TableCell className="text-white">{log.product_name}</TableCell>
                                                    <TableCell className="text-center">
                                                        <span className="text-pink-400 font-bold">{log.qty_used}</span>
                                                        <span className="text-slate-400 ml-1">{log.sub_unit}</span>
                                                    </TableCell>
                                                    <TableCell className="text-white">{log.customer_name || '-'}</TableCell>
                                                    <TableCell className="text-slate-400 text-sm">{log.note || '-'}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                {/* Stock Card Tab */}
                <TabsContent value="card" className="space-y-6">
                    {/* Month/Year Filter */}
                    <Card className="bg-slate-800 border-slate-700">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-4">
                                <Select value={selectedMonth.toString()} onValueChange={(v) => setSelectedMonth(parseInt(v))}>
                                    <SelectTrigger className="w-48 bg-slate-900 border-slate-700 text-white">
                                        <SelectValue placeholder="เลือกเดือน" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-slate-800 border-slate-700">
                                        {months.map((m) => (
                                            <SelectItem key={m.value} value={m.value.toString()} className="text-white hover:bg-slate-700">
                                                {m.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
                                    <SelectTrigger className="w-32 bg-slate-900 border-slate-700 text-white">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-slate-800 border-slate-700">
                                        {[2024, 2025, 2026].map((y) => (
                                            <SelectItem key={y} value={y.toString()} className="text-white hover:bg-slate-700">
                                                {y}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Summary Stats */}
                    <div className="grid gap-4 sm:grid-cols-4">
                        <Card className="bg-slate-800 border-slate-700">
                            <CardContent className="p-4">
                                <p className="text-sm text-slate-400">สินค้าทั้งหมด</p>
                                <p className="text-3xl font-bold text-white">{stockCard?.summary.total_products || 0}</p>
                            </CardContent>
                        </Card>
                        <Card className="bg-slate-800 border-slate-700">
                            <CardContent className="p-4">
                                <p className="text-sm text-slate-400">รับเข้ารวม</p>
                                <p className="text-3xl font-bold text-green-400">+{stockCard?.summary.total_in || 0}</p>
                            </CardContent>
                        </Card>
                        <Card className="bg-slate-800 border-slate-700">
                            <CardContent className="p-4">
                                <p className="text-sm text-slate-400">เบิกออกรวม</p>
                                <p className="text-3xl font-bold text-pink-400">-{stockCard?.summary.total_out || 0}</p>
                            </CardContent>
                        </Card>
                        <Card className="bg-slate-800 border-slate-700">
                            <CardContent className="p-4">
                                <p className="text-sm text-slate-400">ปรับยอดรวม</p>
                                <p className="text-3xl font-bold text-amber-400">{stockCard?.summary.total_adjustment || 0}</p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Stock Card Table */}
                    <Card className="bg-slate-800 border-slate-700">
                        <CardHeader>
                            <CardTitle className="text-white">
                                Stock Card - {months.find(m => m.value === selectedMonth)?.label} {selectedYear + 543}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-lg border border-slate-700 overflow-x-auto">
                                <Table>
                                    <TableHeader className="bg-slate-900">
                                        <TableRow className="border-slate-700">
                                            <TableHead className="text-slate-400">รหัส</TableHead>
                                            <TableHead className="text-slate-400">สินค้า</TableHead>
                                            <TableHead className="text-slate-400">หมวด</TableHead>
                                            <TableHead className="text-slate-400 text-right">ยกมา</TableHead>
                                            <TableHead className="text-slate-400 text-right">รับเข้า</TableHead>
                                            <TableHead className="text-slate-400 text-right">เบิกออก</TableHead>
                                            <TableHead className="text-slate-400 text-right">ปรับยอด</TableHead>
                                            <TableHead className="text-slate-400 text-right">คงเหลือ</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {!stockCard?.stock_card?.length ? (
                                            <TableRow className="border-slate-700">
                                                <TableCell colSpan={8} className="text-center py-8 text-slate-400">
                                                    ไม่มีข้อมูล
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            stockCard.stock_card.map((item) => (
                                                <TableRow key={item.product_id} className="border-slate-700 hover:bg-slate-700/50">
                                                    <TableCell className="text-purple-400 font-mono text-sm">
                                                        {item.product_code}
                                                    </TableCell>
                                                    <TableCell className="text-white">{item.product_name}</TableCell>
                                                    <TableCell className={getCategoryColor(item.category)}>{item.category}</TableCell>
                                                    <TableCell className="text-right text-white">{item.begin_balance}</TableCell>
                                                    <TableCell className="text-right">
                                                        {item.stock_in > 0 ? (
                                                            <span className="text-green-400">+{item.stock_in}</span>
                                                        ) : (
                                                            <span className="text-slate-500">-</span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        {item.stock_out > 0 ? (
                                                            <span className="text-pink-400">-{item.stock_out}</span>
                                                        ) : (
                                                            <span className="text-slate-500">-</span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        {item.adjustment > 0 ? (
                                                            <span className="text-amber-400">{item.adjustment}</span>
                                                        ) : (
                                                            <span className="text-slate-500">-</span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-right font-bold">
                                                        <span className="text-white">{item.end_balance}</span>
                                                        {item.opened_qty > 0 && (
                                                            <span className="text-pink-400 text-sm">(+{item.opened_qty})</span>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
