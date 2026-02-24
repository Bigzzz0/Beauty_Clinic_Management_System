'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
    Search, Filter, Plus, Package, ArrowUpDown, MoreHorizontal,
    History, AlertTriangle, CheckCircle, XCircle, TrendingDown,
    Calendar, FileSpreadsheet, PackagePlus, Truck, ClipboardEdit, Syringe, X
} from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'
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

// categories will be fetched dynamically
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

    useEffect(() => {
        const params = new URLSearchParams(window.location.search)
        const searchQuery = params.get('search')
        if (searchQuery) setSearch(searchQuery)
    }, [])


    // Fetch dynamic categories
    const { data: dynamicCategories = [] } = useQuery<{ id: number, code: string, name: string }[]>({
        queryKey: ['categories-product'],
        queryFn: async () => {
            const res = await fetch(`/api/categories?type=PRODUCT`)
            return res.json()
        },
    })

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
            Botox: 'text-primary',
            Filler: 'text-accent',
            Treatment: 'text-blue-500',
            Medicine: 'text-success',
            Equipment: 'text-muted-foreground',
            Skin: 'text-amber-500',
        }
        return colors[cat] || 'text-muted-foreground'
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Package className="h-6 w-6 text-primary" />
                        รายงานคลังสินค้า
                    </h1>
                    <p className="text-muted-foreground">ติดตามสต๊อกและการเคลื่อนไหวของสินค้า</p>
                </div>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="stock" className="space-y-6">
                <TabsList>
                    <TabsTrigger
                        value="stock"
                    >
                        <Package className="h-4 w-4 mr-2" />
                        สต๊อกคงเหลือ
                    </TabsTrigger>
                    <TabsTrigger
                        value="usage"
                    >
                        <Calendar className="h-4 w-4 mr-2" />
                        การใช้ประจำวัน
                    </TabsTrigger>
                    <TabsTrigger
                        value="card"
                    >
                        <FileSpreadsheet className="h-4 w-4 mr-2" />
                        Stock Card
                    </TabsTrigger>
                </TabsList>

                {/* Stock Overview Tab */}
                <TabsContent value="stock" className="space-y-6">
                    {/* Summary Stats */}
                    <div className="grid gap-4 sm:grid-cols-4">
                        <Card>
                            <CardContent className="p-4">
                                <p className="text-sm text-muted-foreground">สินค้าทั้งหมด</p>
                                <p className="text-3xl font-bold">{inventory.length}</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-center gap-2">
                                    <CheckCircle className="h-4 w-4 text-success" />
                                    <p className="text-sm text-muted-foreground">สต๊อกปกติ</p>
                                </div>
                                <p className="text-3xl font-bold text-success">{normalStock}</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-center gap-2">
                                    <AlertTriangle className="h-4 w-4 text-warning" />
                                    <p className="text-sm text-muted-foreground">สต๊อกต่ำ</p>
                                </div>
                                <p className="text-3xl font-bold text-warning">{lowStock}</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-center gap-2">
                                    <XCircle className="h-4 w-4 text-destructive" />
                                    <p className="text-sm text-muted-foreground">หมด</p>
                                </div>
                                <p className="text-3xl font-bold text-destructive">{outOfStock}</p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Today's Movement */}
                    <Card>
                        <CardContent className="p-4">
                            <p className="text-sm text-muted-foreground mb-1">ความเคลื่อนไหววันนี้</p>
                            <div className="flex items-center gap-2 text-primary">
                                <TrendingDown className="h-5 w-5" />
                                <span>เบิกออก</span>
                                <span className="font-bold">{dailyUsage?.summary.total_times || 0} รายการ</span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Quick Actions */}
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        {quickActions.map((action) => (
                            <Link
                                key={action.href}
                                href={action.href}
                                className="block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                            >
                                <Card className="hover:border-primary/50 hover:bg-muted/50 transition-all cursor-pointer">
                                    <CardContent className="flex items-center gap-3 p-4">
                                        <div className={`p-2 rounded-lg bg-gradient-to-br ${action.color} text-white`}>
                                            <action.icon className="h-5 w-5" />
                                        </div>
                                        <span className="font-medium text-foreground">{action.label}</span>
                                    </CardContent>
                                </Card>
                            </Link>
                        ))}
                    </div>

                    {/* Search and Filter */}
                    <div className="flex flex-col gap-4 md:flex-row">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="ค้นหาสินค้า..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-10 pr-8"
                                aria-label="Search inventory"
                                autoFocus
                            />
                            {search && (
                                <button
                                    type="button"
                                    onClick={() => setSearch('')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
                                    aria-label="ล้างคำค้นหา"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            )}
                        </div>
                        <Select value={category} onValueChange={setCategory}>
                            <SelectTrigger className="w-full md:w-48">
                                <SelectValue placeholder="หมวดหมู่ทั้งหมด" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">ทั้งหมด</SelectItem>
                                {dynamicCategories.map((cat) => (
                                    <SelectItem key={cat.code} value={cat.name}>{cat.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Inventory Table */}
                    <Card>
                        <CardHeader>
                            <CardTitle>รายการสต๊อกคงเหลือ</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-lg border overflow-hidden">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-muted/50">
                                            <TableHead className="w-16">สถานะ</TableHead>
                                            <TableHead>รหัส</TableHead>
                                            <TableHead>
                                                <button
                                                    type="button"
                                                    onClick={() => handleSort('product_name')}
                                                    className="flex items-center gap-1 font-semibold hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded px-1 -ml-1"
                                                    aria-sort={sortBy === 'product_name' ? (sortOrder === 'asc' ? 'ascending' : 'descending') : undefined}
                                                >
                                                    สินค้า
                                                    <ArrowUpDown className="h-3 w-3" />
                                                </button>
                                            </TableHead>
                                            <TableHead>หมวด</TableHead>
                                            <TableHead className="text-right">สต๊อกคงเหลือ</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {isLoading ? (
                                            [...Array(5)].map((_, i) => (
                                                <TableRow key={i}>
                                                    <TableCell colSpan={5}>
                                                        <div className="h-12 animate-pulse rounded bg-muted" />
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        ) : inventory.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={5} className="h-64 text-center">
                                                    <EmptyState
                                                        icon={Package}
                                                        title="ไม่พบข้อมูลสินค้า"
                                                        description={search ? `ไม่พบสินค้าที่ตรงกับ "${search}"` : "ยังไม่มีสินค้าในคลัง เริ่มต้นด้วยการเพิ่มสินค้าใหม่"}
                                                        action={
                                                            <Link href="/inventory/stock-in">
                                                                <Button variant="outline" className="mt-4">
                                                                    รับสินค้าเข้า
                                                                </Button>
                                                            </Link>
                                                        }
                                                    />
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            inventory.map((item) => {
                                                const status = getStockStatus(item)
                                                return (
                                                    <TableRow key={item.product_id} className="hover:bg-muted/50">
                                                        <TableCell>
                                                            {status === 'normal' && <CheckCircle className="h-5 w-5 text-success" />}
                                                            {status === 'low' && <AlertTriangle className="h-5 w-5 text-warning" />}
                                                            {status === 'out' && <XCircle className="h-5 w-5 text-destructive" />}
                                                        </TableCell>
                                                        <TableCell className="font-mono text-sm text-muted-foreground">
                                                            {item.product_code}
                                                        </TableCell>
                                                        <TableCell className="font-medium">
                                                            {item.product_name}
                                                        </TableCell>
                                                        <TableCell className={getCategoryColor(item.category)}>
                                                            {item.category}
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            <span className="font-medium">{item.full_qty}</span>
                                                            <span className="text-muted-foreground ml-1">{item.main_unit}</span>
                                                            {item.opened_qty > 0 && (
                                                                <span className="text-primary ml-1">(+{item.opened_qty} {item.sub_unit})</span>
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
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <Calendar className="h-5 w-5 text-muted-foreground" />
                                <Input
                                    type="date"
                                    value={selectedDate}
                                    onChange={(e) => setSelectedDate(e.target.value)}
                                    className="w-48"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Summary Stats */}
                    <div className="grid gap-4 sm:grid-cols-3">
                        <Card>
                            <CardContent className="p-4">
                                <p className="text-sm text-muted-foreground">สินค้าที่ใช้</p>
                                <p className="text-3xl font-bold">
                                    {dailyUsage?.summary.products_used || 0} <span className="text-lg text-muted-foreground">รายการ</span>
                                </p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-4">
                                <p className="text-sm text-muted-foreground">จำนวนครั้ง</p>
                                <p className="text-3xl font-bold">
                                    {dailyUsage?.summary.total_times || 0} <span className="text-lg text-muted-foreground">ครั้ง</span>
                                </p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-4">
                                <p className="text-sm text-muted-foreground">หน่วยที่ใช้ไป</p>
                                <p className="text-3xl font-bold text-primary">
                                    {dailyUsage?.summary.total_units || 0} <span className="text-lg text-muted-foreground">Units</span>
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Category Breakdown */}
                    {dailyUsage?.by_category && Object.keys(dailyUsage.by_category).length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">แยกตามหมวดหมู่</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
                                    {Object.entries(dailyUsage.by_category).map(([cat, units]) => (
                                        <div key={cat} className="p-3 rounded-lg bg-muted/50">
                                            <p className={`text-sm ${getCategoryColor(cat)}`}>{cat}</p>
                                            <p className="text-xl font-bold">{units} <span className="text-sm text-muted-foreground">units</span></p>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Product Usage Table */}
                    <Card>
                        <CardHeader>
                            <CardTitle>การใช้แยกตามสินค้า</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-lg border overflow-hidden">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-muted/50">
                                            <TableHead>รหัส</TableHead>
                                            <TableHead>สินค้า</TableHead>
                                            <TableHead>หมวด</TableHead>
                                            <TableHead className="text-center">จำนวนครั้ง</TableHead>
                                            <TableHead className="text-right">รวมใช้ไป</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {!dailyUsage?.by_product?.length ? (
                                            <TableRow>
                                                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                                    ไม่มีข้อมูลการใช้
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            dailyUsage.by_product.map((item) => (
                                                <TableRow key={item.product_id} className="hover:bg-muted/50">
                                                    <TableCell className="text-muted-foreground font-mono text-sm">
                                                        {item.product_code}
                                                    </TableCell>
                                                    <TableCell>{item.product_name}</TableCell>
                                                    <TableCell className={getCategoryColor(item.category)}>{item.category}</TableCell>
                                                    <TableCell className="text-center">{item.times}</TableCell>
                                                    <TableCell className="text-right">
                                                        <span className="text-primary font-bold">{item.total_used}</span>
                                                        <span className="text-muted-foreground ml-1">{item.sub_unit}</span>
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
                        <Card>
                            <CardHeader>
                                <CardTitle>รายละเอียดการใช้</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="rounded-lg border overflow-hidden">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="bg-muted/50">
                                                <TableHead>เวลา</TableHead>
                                                <TableHead>สินค้า</TableHead>
                                                <TableHead className="text-center">จำนวน</TableHead>
                                                <TableHead>ลูกค้า</TableHead>
                                                <TableHead>หมายเหตุ</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {dailyUsage.detail_log.map((log, i) => (
                                                <TableRow key={i} className="hover:bg-muted/50">
                                                    <TableCell className="text-muted-foreground text-sm">
                                                        {log.time ? new Date(log.time).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) : '-'}
                                                    </TableCell>
                                                    <TableCell>{log.product_name}</TableCell>
                                                    <TableCell className="text-center">
                                                        <span className="text-primary font-bold">{log.qty_used}</span>
                                                        <span className="text-muted-foreground ml-1">{log.sub_unit}</span>
                                                    </TableCell>
                                                    <TableCell>{log.customer_name || '-'}</TableCell>
                                                    <TableCell className="text-muted-foreground text-sm">{log.note || '-'}</TableCell>
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
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-4">
                                <Select value={selectedMonth.toString()} onValueChange={(v) => setSelectedMonth(parseInt(v))}>
                                    <SelectTrigger className="w-48" aria-label="เลือกเดือน">
                                        <SelectValue placeholder="เลือกเดือน" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {months.map((m) => (
                                            <SelectItem key={m.value} value={m.value.toString()}>
                                                {m.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
                                    <SelectTrigger className="w-32" aria-label="เลือกปี">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {[2024, 2025, 2026].map((y) => (
                                            <SelectItem key={y} value={y.toString()}>
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
                        <Card>
                            <CardContent className="p-4">
                                <p className="text-sm text-muted-foreground">สินค้าทั้งหมด</p>
                                <p className="text-3xl font-bold">{stockCard?.summary.total_products || 0}</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-4">
                                <p className="text-sm text-muted-foreground">รับเข้ารวม</p>
                                <p className="text-3xl font-bold text-success">+{stockCard?.summary.total_in || 0}</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-4">
                                <p className="text-sm text-muted-foreground">เบิกออกรวม</p>
                                <p className="text-3xl font-bold text-primary">-{stockCard?.summary.total_out || 0}</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-4">
                                <p className="text-sm text-muted-foreground">ปรับยอดรวม</p>
                                <p className="text-3xl font-bold text-amber-500">{stockCard?.summary.total_adjustment || 0}</p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Stock Card Table */}
                    <Card>
                        <CardHeader>
                            <CardTitle>
                                Stock Card - {months.find(m => m.value === selectedMonth)?.label} {selectedYear + 543}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-lg border overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-muted/50">
                                            <TableHead>รหัส</TableHead>
                                            <TableHead>สินค้า</TableHead>
                                            <TableHead>หมวด</TableHead>
                                            <TableHead className="text-right">ยกมา</TableHead>
                                            <TableHead className="text-right">รับเข้า</TableHead>
                                            <TableHead className="text-right">เบิกออก</TableHead>
                                            <TableHead className="text-right">ปรับยอด</TableHead>
                                            <TableHead className="text-right">คงเหลือ</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {!stockCard?.stock_card?.length ? (
                                            <TableRow>
                                                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                                                    ไม่มีข้อมูล
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            stockCard.stock_card.map((item) => (
                                                <TableRow key={item.product_id} className="hover:bg-muted/50">
                                                    <TableCell className="text-muted-foreground font-mono text-sm">
                                                        {item.product_code}
                                                    </TableCell>
                                                    <TableCell>{item.product_name}</TableCell>
                                                    <TableCell className={getCategoryColor(item.category)}>{item.category}</TableCell>
                                                    <TableCell className="text-right">{item.begin_balance}</TableCell>
                                                    <TableCell className="text-right">
                                                        {item.stock_in > 0 ? (
                                                            <span className="text-success">+{item.stock_in}</span>
                                                        ) : (
                                                            <span className="text-muted-foreground">-</span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        {item.stock_out > 0 ? (
                                                            <span className="text-destructive">-{item.stock_out}</span>
                                                        ) : (
                                                            <span className="text-muted-foreground">-</span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        {item.adjustment > 0 ? (
                                                            <span className="text-amber-500">{item.adjustment}</span>
                                                        ) : (
                                                            <span className="text-muted-foreground">-</span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-right font-bold">
                                                        <span>{item.end_balance}</span>
                                                        {item.opened_qty > 0 && (
                                                            <span className="text-primary text-sm">(+{item.opened_qty})</span>
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
