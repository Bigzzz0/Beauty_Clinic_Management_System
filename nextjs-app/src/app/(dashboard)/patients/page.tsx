'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
    Users, Search, ArrowUpDown, Plus,
    UserCircle, Phone, Edit, History, ShoppingCart,
    AlertTriangle, X, Loader2, Trash2
} from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'

interface Customer {
    customer_id: number
    hn_code: string
    first_name: string
    last_name: string
    full_name: string | null
    nickname: string | null
    phone_number: string
    member_level: string | null

    drug_allergy: string | null
    underlying_disease: string | null
    total_debt: number
    last_visit: string | null
}

const getMemberBadgeColor = (level: string | null) => {
    switch (level?.toLowerCase()) {
        case 'platinum gold':
            return 'bg-purple-600 text-white border-purple-700'
        case 'platinum':
            return 'bg-indigo-100 text-indigo-800 border-indigo-300'
        case 'gold':
            return 'bg-amber-400 text-amber-900 border-amber-500'
        case 'silver':
            return 'bg-slate-200 text-slate-700 border-slate-400'
        default:
            return 'bg-slate-100 text-slate-600 border-slate-300'
    }
}

export default function PatientsPage() {
    const router = useRouter()
    const token = useAuthStore((s) => s.token)

    const [search, setSearch] = useState('')
    const [page, setPage] = useState(1)
    const [tab, setTab] = useState('all')
    const [sortBy, setSortBy] = useState('created_at')
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
    const limit = 15

    const { data, isLoading, isFetching, refetch } = useQuery({
        queryKey: ['patients', { search, page, sortBy, sortOrder, tab }],
        queryFn: async () => {
            const params = new URLSearchParams()
            params.set('page', page.toString())
            params.set('limit', limit.toString())
            if (search) params.set('search', search)
            if (tab === 'overdue') params.set('hasDebt', 'true')
            params.set('sortBy', sortBy)
            params.set('sortOrder', sortOrder)

            const res = await fetch(`/api/customers?${params}`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            })
            if (!res.ok) throw new Error('Failed to fetch')
            return res.json()
        },
    })

    const handleDeleteCustomer = async (id: number, name: string) => {
        if (!window.confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบข้อมูลลูกค้ารายนี้ (${name})?\nการกระทำนี้ไม่สามารถย้อนกลับได้`)) return;
        try {
            const res = await fetch(`/api/customers/${id}`, {
                method: 'DELETE',
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            });
            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || 'Failed to delete customer');
            }
            toast.success('ลบข้อมูลลูกค้าสำเร็จ');
            refetch();
        } catch (error: any) {
            toast.error(error.message);
        }
    }

    const customers: Customer[] = data?.data || []
    const totalPages = data?.meta?.totalPages || 1

    const handleSort = (column: string) => {
        if (sortBy === column) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
        } else {
            setSortBy(column)
            setSortOrder('asc')
        }
    }

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return '-'
        return new Date(dateStr).toLocaleDateString('th-TH', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        })
    }

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <Users className="h-6 w-6 text-amber-500" />
                            ทะเบียนคนไข้
                        </h1>
                        {data?.meta?.total > 0 && (
                            <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-700">
                                {data.meta.total.toLocaleString()} คน
                            </span>
                        )}
                    </div>
                    <p className="text-muted-foreground text-sm mt-0.5">จัดการข้อมูลผู้ป่วยและประวัติการรักษา</p>
                </div>
                <Link href="/patients/new">
                    <Button
                        className="gap-2 rounded-xl shadow-md shadow-amber-200/60 transition-all hover:-translate-y-0.5 hover:shadow-lg"
                        style={{ background: 'linear-gradient(135deg, #d97706, #f59e0b)', color: 'white' }}
                    >
                        <Plus className="h-4 w-4" />
                        เพิ่มคนไข้ใหม่
                    </Button>
                </Link>
            </div>

            {/* Filter Tabs */}
            <Tabs value={tab} onValueChange={(v) => { setTab(v); setPage(1); }} className="w-full">
                <TabsList className="grid w-full grid-cols-2 md:w-[400px]">
                    <TabsTrigger value="all">ลูกค้าทั้งหมด</TabsTrigger>
                    <TabsTrigger value="overdue">ค้างชำระ (Overdue)</TabsTrigger>
                </TabsList>
            </Tabs>

            {/* Search & Filters */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <Input
                                placeholder="ค้นหา HN, ชื่อเล่น, ชื่อ-นามสกุล, เบอร์โทร..."
                                value={search}
                                onChange={(e) => {
                                    setSearch(e.target.value)
                                    setPage(1)
                                }}
                                className="pl-10 pr-8"
                                aria-label="Search patients"
                            />
                            {isFetching && (
                                <Loader2 className="absolute right-10 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground animate-spin" />
                            )}
                            {search && (
                                <button
                                    onClick={() => {
                                        setSearch('')
                                        setPage(1)
                                    }}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
                                    aria-label="ล้างคำค้นหา"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            )}
                        </div>
                        <Select value={sortBy} onValueChange={(v) => { setSortBy(v); setPage(1) }}>
                            <SelectTrigger className="w-full md:w-48">
                                <SelectValue placeholder="เรียงตาม" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="created_at">วันที่ลงทะเบียน</SelectItem>
                                <SelectItem value="name">ชื่อ</SelectItem>
                                <SelectItem value="last_visit">วันที่มาล่าสุด</SelectItem>
                                <SelectItem value="debt">ยอดค้างชำระ</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Patient Table */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        รายชื่อคนไข้
                        {data?.meta?.total > 0 && (
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">{data.meta.total.toLocaleString()} คน</span>
                        )}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {/* Desktop Table View */}
                    <div className="hidden md:block rounded-xl border overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-50 hover:bg-slate-50">
                                    <TableHead className="w-14"></TableHead>
                                    <TableHead className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        <button
                                            type="button"
                                            onClick={() => handleSort('name')}
                                            className="flex items-center gap-1 hover:text-amber-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded px-1 -ml-1"
                                            aria-sort={sortBy === 'name' ? (sortOrder === 'asc' ? 'ascending' : 'descending') : undefined}
                                        >
                                            ชื่อ-นามสกุล
                                            <ArrowUpDown className="h-3 w-3" />
                                        </button>
                                    </TableHead>
                                    <TableHead className="text-xs font-semibold uppercase tracking-wide text-slate-500">เบอร์โทร</TableHead>
                                    <TableHead className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        <button
                                            type="button"
                                            onClick={() => handleSort('last_visit')}
                                            className="flex items-center gap-1 hover:text-amber-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded px-1 -ml-1"
                                            aria-sort={sortBy === 'last_visit' ? (sortOrder === 'asc' ? 'ascending' : 'descending') : undefined}
                                        >
                                            มาล่าสุด
                                            <ArrowUpDown className="h-3 w-3" />
                                        </button>
                                    </TableHead>
                                    <TableHead className="text-xs font-semibold uppercase tracking-wide text-slate-500 text-right">
                                        <button
                                            type="button"
                                            onClick={() => handleSort('debt')}
                                            className="flex items-center justify-end gap-1 hover:text-amber-600 transition-colors w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded px-1 -mr-1"
                                            aria-sort={sortBy === 'debt' ? (sortOrder === 'asc' ? 'ascending' : 'descending') : undefined}
                                        >
                                            ยอดค้าง
                                            <ArrowUpDown className="h-3 w-3" />
                                        </button>
                                    </TableHead>
                                    <TableHead className="w-20"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody className={isFetching && customers.length > 0 ? "opacity-50 transition-opacity duration-200" : ""}>
                                {isLoading || (isFetching && customers.length === 0) ? (
                                    [...Array(5)].map((_, i) => (
                                        <TableRow key={i}>
                                            <TableCell colSpan={7}>
                                                <div className="h-14 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : customers.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="h-64 text-center">
                                            <EmptyState
                                                icon={Users}
                                                title="ไม่พบข้อมูลคนไข้"
                                                description={search ? `ไม่พบคนไข้ที่ตรงกับ "${search}"` : "ยังไม่มีข้อมูลคนไข้ในระบบ เริ่มต้นด้วยการเพิ่มคนไข้ใหม่"}
                                                action={
                                                    <Button variant="outline" onClick={() => router.push('/patients/new')}>
                                                        เพิ่มคนไข้ใหม่
                                                    </Button>
                                                }
                                            />
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    customers.map((customer) => (
                                        <TableRow
                                            key={customer.customer_id}
                                            className={`hover:bg-slate-50/80 transition-colors ${
                                                customer.total_debt > 0 ? 'border-l-2 border-l-red-300' : 'border-l-2 border-l-transparent'
                                            }`}
                                        >
                                            <TableCell>
                                                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-amber-500 text-sm font-bold text-white shadow-sm">
                                                    {(customer.full_name || customer.first_name || '?').charAt(0)}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <Link
                                                            href={`/patients/${customer.customer_id}`}
                                                            className="font-medium hover:underline hover:text-primary transition-colors max-w-[200px] truncate block"
                                                            title={customer.full_name || `${customer.first_name} ${customer.last_name}`}
                                                        >
                                                            {customer.full_name || `${customer.first_name} ${customer.last_name}`}
                                                        </Link>
                                                        <Badge className={getMemberBadgeColor(customer.member_level)}>
                                                            {customer.member_level || 'General'}
                                                        </Badge>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                        <span className="font-mono">{customer.hn_code}</span>
                                                        {customer.nickname && (
                                                            <span>• "{customer.nickname}"</span>
                                                        )}
                                                    </div>
                                                    {(customer.drug_allergy || customer.underlying_disease) && (
                                                        <div className="flex items-center gap-1 text-xs text-red-500">
                                                            <AlertTriangle className="h-3 w-3" />
                                                            มีข้อควรระวัง
                                                        </div>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2 text-sm">
                                                    <Phone className="h-4 w-4 text-muted-foreground" />
                                                    {customer.phone_number}
                                                </div>
                                            </TableCell>

                                            <TableCell>
                                                <span className="text-sm text-slate-600">
                                                    {formatDate(customer.last_visit)}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {customer.total_debt > 0 ? (
                                                    <span className="inline-flex items-center rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-600 ring-1 ring-red-200">
                                                        ค้าง ฿{customer.total_debt.toLocaleString()}
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600">
                                                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
                                                        ชำระแล้ว
                                                    </span>
                                                )}
                                            </TableCell>
                                            <TableCell onClick={(e) => e.stopPropagation()}>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="sm" aria-label={`ตัวเลือกสำหรับ ${customer.full_name || customer.first_name}`}>•••</Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem asChild>
                                                            <Link href={`/patients/${customer.customer_id}`}>
                                                                <Edit className="h-4 w-4 mr-2" />
                                                                แก้ไขข้อมูล
                                                            </Link>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem asChild>
                                                            <Link href={`/patients/${customer.customer_id}?tab=history`}>
                                                                <History className="h-4 w-4 mr-2" />
                                                                ประวัติการรักษา
                                                            </Link>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem asChild>
                                                            <Link href={`/pos?customer=${customer.customer_id}`}>
                                                                <ShoppingCart className="h-4 w-4 mr-2" />
                                                                ออกบิลใหม่
                                                            </Link>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            className="text-red-600 focus:text-red-700 focus:bg-red-50 cursor-pointer"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleDeleteCustomer(customer.customer_id, customer.full_name || customer.first_name);
                                                            }}
                                                        >
                                                            <Trash2 className="h-4 w-4 mr-2" />
                                                            ลบข้อมูล
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Mobile Card View */}
                    <div className="grid grid-cols-1 gap-4 md:hidden">
                        {isLoading || (isFetching && customers.length === 0) ? (
                            [...Array(5)].map((_, i) => (
                                <div key={i} className="flex animate-pulse gap-4 rounded-xl border p-4">
                                    <div className="h-10 w-10 rounded-full bg-slate-100" />
                                    <div className="flex-1 space-y-2 py-1">
                                        <div className="h-4 w-3/4 rounded bg-slate-100" />
                                        <div className="h-3 w-1/2 rounded bg-slate-100" />
                                    </div>
                                </div>
                            ))
                        ) : customers.length === 0 ? (
                            <div className="py-8">
                                <EmptyState
                                    icon={Users}
                                    title="ไม่พบข้อมูลคนไข้"
                                    description={search ? `ไม่พบคนไข้ที่ตรงกับ "${search}"` : "ยังไม่มีข้อมูลคนไข้ในระบบ เริ่มต้นด้วยการเพิ่มคนไข้ใหม่"}
                                    action={
                                        <Button variant="outline" onClick={() => router.push('/patients/new')}>
                                            เพิ่มคนไข้ใหม่
                                        </Button>
                                    }
                                />
                            </div>
                        ) : (
                            customers.map((customer) => (
                                <div key={customer.customer_id} className="flex flex-col gap-0 rounded-xl border bg-card shadow-sm overflow-hidden">
                                    {/* Top row */}
                                    <div className="flex items-start gap-3 p-4">
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-amber-500 text-sm font-bold text-white shadow-sm">
                                            {(customer.full_name || customer.first_name || '?').charAt(0)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex flex-wrap items-center gap-1.5">
                                                <Link
                                                    href={`/patients/${customer.customer_id}`}
                                                    className="font-semibold text-slate-900 hover:text-amber-600 hover:underline truncate"
                                                >
                                                    {customer.full_name || `${customer.first_name} ${customer.last_name}`}
                                                </Link>
                                                <Badge className={`${getMemberBadgeColor(customer.member_level)} text-[10px] px-1.5 py-0 shrink-0`}>
                                                    {customer.member_level || 'General'}
                                                </Badge>
                                            </div>
                                            <div className="mt-0.5 flex items-center gap-2 text-xs text-slate-500">
                                                <span className="font-mono">{customer.hn_code}</span>
                                                {customer.nickname && <span>• "{customer.nickname}"</span>}
                                            </div>
                                            <div className="mt-1 flex items-center gap-1 text-xs text-slate-600">
                                                <Phone className="h-3 w-3 text-slate-400 shrink-0" />
                                                <span>{customer.phone_number}</span>
                                            </div>
                                            {(customer.drug_allergy || customer.underlying_disease) && (
                                                <div className="mt-1 flex items-center gap-1 text-xs text-red-500 font-medium">
                                                    <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                                                    มีข้อควรระวัง
                                                </div>
                                            )}
                                        </div>
                                        {/* Action menu */}
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-slate-400">
                                                    <span className="sr-only">ตัวเลือก</span>
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem asChild>
                                                    <Link href={`/patients/${customer.customer_id}`}>แก้ไขข้อมูล</Link>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem asChild>
                                                    <Link href={`/patients/${customer.customer_id}?tab=history`}>ประวัติการรักษา</Link>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem asChild>
                                                    <Link href={`/pos?customer=${customer.customer_id}`}>ออกบิลใหม่</Link>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    className="text-red-500"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDeleteCustomer(customer.customer_id, customer.full_name || customer.first_name);
                                                    }}
                                                >
                                                    ลบข้อมูล
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                    {/* Bottom row */}
                                    <div className="flex items-center justify-between border-t bg-slate-50/60 px-4 py-2.5">
                                        <div className="text-xs text-slate-500">
                                            มาล่าสุด: <span className="font-medium text-slate-700">{formatDate(customer.last_visit)}</span>
                                        </div>
                                        <div>
                                            {customer.total_debt > 0 ? (
                                                <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-red-200 text-xs">
                                                    ค้าง ฿{customer.total_debt.toLocaleString()}
                                                </Badge>
                                            ) : (
                                                <span className="text-xs text-emerald-600 font-medium">ไม่มีค้าง</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <nav className="flex items-center justify-between mt-4" aria-label="Pagination">
                            <p className="text-sm text-slate-500">
                                หน้า {page} จาก {totalPages}
                            </p>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={page <= 1}
                                    onClick={() => setPage(page - 1)}
                                    aria-label="หน้าก่อนหน้า"
                                >
                                    ก่อนหน้า
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={page >= totalPages}
                                    onClick={() => setPage(page + 1)}
                                    aria-label="หน้าถัดไป"
                                >
                                    ถัดไป
                                </Button>
                            </div>
                        </nav>
                    )}
                </CardContent>
            </Card>
        </div >
    )
}
