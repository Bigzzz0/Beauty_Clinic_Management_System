'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
    Users, Search, ArrowUpDown, Plus,
    UserCircle, Phone, Edit, History, ShoppingCart,
    AlertTriangle
} from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'
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
        case 'platinum':
            return 'bg-accent/20 text-accent border-accent/30'
        case 'gold':
            return 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300'
        default:
            return 'bg-muted text-muted-foreground border-border'
    }
}

export default function PatientsPage() {
    const router = useRouter()
    const token = useAuthStore((s) => s.token)

    const [search, setSearch] = useState('')
    const [page, setPage] = useState(1)
    const [sortBy, setSortBy] = useState('created_at')
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
    const limit = 15

    const { data, isLoading } = useQuery({
        queryKey: ['patients', { search, page, sortBy, sortOrder }],
        queryFn: async () => {
            const params = new URLSearchParams()
            params.set('page', page.toString())
            params.set('limit', limit.toString())
            if (search) params.set('search', search)
            params.set('sortBy', sortBy)
            params.set('sortOrder', sortOrder)

            const res = await fetch(`/api/customers?${params}`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            })
            if (!res.ok) throw new Error('Failed to fetch')
            return res.json()
        },
    })

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
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Users className="h-6 w-6 text-primary" />
                        ทะเบียนคนไข้
                    </h1>
                    <p className="text-muted-foreground">จัดการข้อมูลผู้ป่วยและประวัติการรักษา</p>
                </div>
                <Button variant="gradient">
                    <Plus className="h-4 w-4 mr-2" />
                    เพิ่มคนไข้ใหม่
                </Button>
            </div>

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
                                className="pl-10"
                                aria-label="Search patients"
                            />
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
                    <CardTitle>รายชื่อคนไข้ ({data?.meta?.total || 0} คน)</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="rounded-lg border overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-50">
                                    <TableHead className="w-16"></TableHead>
                                    <TableHead>
                                        <button
                                            type="button"
                                            onClick={() => handleSort('name')}
                                            className="flex items-center gap-1 font-semibold hover:text-primary transition-colors"
                                            aria-sort={sortBy === 'name' ? (sortOrder === 'asc' ? 'ascending' : 'descending') : undefined}
                                        >
                                            ชื่อ-นามสกุล
                                            <ArrowUpDown className="h-3 w-3" />
                                        </button>
                                    </TableHead>
                                    <TableHead>เบอร์โทร</TableHead>

                                    <TableHead>
                                        <button
                                            type="button"
                                            onClick={() => handleSort('last_visit')}
                                            className="flex items-center gap-1 font-semibold hover:text-primary transition-colors"
                                            aria-sort={sortBy === 'last_visit' ? (sortOrder === 'asc' ? 'ascending' : 'descending') : undefined}
                                        >
                                            มาล่าสุด
                                            <ArrowUpDown className="h-3 w-3" />
                                        </button>
                                    </TableHead>
                                    <TableHead className="text-right">
                                        <button
                                            type="button"
                                            onClick={() => handleSort('debt')}
                                            className="flex items-center justify-end gap-1 font-semibold hover:text-primary transition-colors w-full"
                                            aria-sort={sortBy === 'debt' ? (sortOrder === 'asc' ? 'ascending' : 'descending') : undefined}
                                        >
                                            ยอดค้าง
                                            <ArrowUpDown className="h-3 w-3" />
                                        </button>
                                    </TableHead>
                                    <TableHead className="w-20"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    [...Array(5)].map((_, i) => (
                                        <TableRow key={i}>
                                            <TableCell colSpan={7}>
                                                <div className="h-14 animate-pulse rounded bg-slate-100" />
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
                                            className="hover:bg-muted/50"
                                        >
                                            <TableCell>
                                                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                                                    <UserCircle className="h-6 w-6 text-primary" />
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <Link
                                                            href={`/patients/${customer.customer_id}`}
                                                            className="font-medium hover:underline hover:text-primary transition-colors"
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
                                                    <Badge className="bg-red-100 text-red-700 border-red-200">
                                                        ค้างชำระ ฿{customer.total_debt.toLocaleString()}
                                                    </Badge>
                                                ) : (
                                                    <span className="text-sm text-green-600">-</span>
                                                )}
                                            </TableCell>
                                            <TableCell onClick={(e) => e.stopPropagation()}>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="sm">•••</Button>
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
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between mt-4">
                            <p className="text-sm text-slate-500">
                                หน้า {page} จาก {totalPages}
                            </p>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={page <= 1}
                                    onClick={() => setPage(page - 1)}
                                >
                                    ก่อนหน้า
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={page >= totalPages}
                                    onClick={() => setPage(page + 1)}
                                >
                                    ถัดไป
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
