'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth-store'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog'
import {
    Shield, Search, Calendar, ArrowLeft, ChevronLeft, ChevronRight,
    Info, User, Filter, Database, AlertCircle, Terminal, Eye
} from 'lucide-react'
import Link from 'next/link'
import { formatDateTime } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'

interface AuditLog {
    id: number
    user_id: number | null
    action: string
    target_resource: string | null
    target_id: string | null
    details: string | null
    ip_address: string | null
    user_agent: string | null
    timestamp: string
    staff: {
        staff_id: number
        full_name: string
        position: string
        username: string
    } | null
}

interface PaginationInfo {
    total: number
    page: number
    limit: number
    totalPages: number
}

interface ApiResponse {
    logs: AuditLog[]
    pagination: PaginationInfo
}

interface StaffListItem {
    staff_id: number
    full_name: string
    position: string
}

export default function AuditLogsPage() {
    const token = useAuthStore((s) => s.token)
    const user = useAuthStore((s) => s.user)
    const isAdmin = user?.position === 'Admin'

    // Filters
    const [page, setPage] = useState(1)
    const [actionFilter, setActionFilter] = useState<string>('all')
    const [resourceFilter, setResourceFilter] = useState<string>('all')
    const [staffFilter, setStaffFilter] = useState<string>('all')
    const [searchQuery, setSearchQuery] = useState('')
    const [startDate, setStartDate] = useState('')
    const [endDate, setEndDate] = useState('')

    // Detail modal
    const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)

    // Fetch staff list for dropdown filter
    const { data: staffList = [] } = useQuery<StaffListItem[]>({
        queryKey: ['staff-list-audit-filter'],
        queryFn: async () => {
            const res = await fetch('/api/staff', {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            })
            if (!res.ok) throw new Error('Failed to fetch staff')
            return res.json()
        },
    })

    // Fetch audit logs
    const { data, isLoading, error } = useQuery<ApiResponse>({
        queryKey: ['audit-logs', page, actionFilter, resourceFilter, staffFilter, searchQuery, startDate, endDate],
        queryFn: async () => {
            const params = new URLSearchParams()
            params.set('page', page.toString())
            params.set('limit', '25')

            if (actionFilter !== 'all') params.set('action', actionFilter)
            if (resourceFilter !== 'all') params.set('resource', resourceFilter)
            if (staffFilter !== 'all') params.set('staffId', staffFilter)
            if (searchQuery) params.set('search', searchQuery)
            if (startDate) params.set('startDate', startDate)
            if (endDate) params.set('endDate', endDate)

            const res = await fetch(`/api/audit-logs?${params}`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            })
            if (!res.ok) {
                const errData = await res.json()
                throw new Error(errData.error || 'Failed to fetch logs')
            }
            return res.json()
        },
        enabled: isAdmin,
    })

    // Get color badge based on action type
    const getActionBadgeColor = (action: string) => {
        if (action.includes('DELETE')) {
            return 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900/30'
        }
        if (action.includes('CREATE')) {
            return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/30'
        }
        if (action.includes('UPDATE')) {
            return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900/30'
        }
        if (action.includes('LOGIN') || action.includes('LOGOUT')) {
            return 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/30 dark:text-purple-400 dark:border-purple-900/30'
        }
        return 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900 dark:text-slate-400'
    }

    // Format details JSON
    const renderJsonDetails = (detailsStr: string | null) => {
        if (!detailsStr) return <span className="text-muted-foreground italic text-xs">ไม่มีข้อมูลรายละเอียด</span>
        try {
            const obj = JSON.parse(detailsStr)
            
            // Format password out for security
            if (obj && typeof obj === 'object') {
                if ('password' in obj) obj.password = '********'
                if ('password_hash' in obj) obj.password_hash = '********'
            }

            return (
                <pre className="text-xs font-mono bg-slate-950 text-slate-200 p-4 rounded-lg overflow-x-auto max-h-[300px] border border-slate-800">
                    <code>{JSON.stringify(obj, null, 2)}</code>
                </pre>
            )
        } catch {
            return <pre className="text-xs font-mono bg-slate-950 text-slate-200 p-4 rounded-lg overflow-x-auto">{detailsStr}</pre>
        }
    }

    // Interactive JSON Diff render helper
    const renderDetailsDiff = (detailsStr: string | null) => {
        if (!detailsStr) return null
        try {
            const obj = JSON.parse(detailsStr)
            if (typeof obj !== 'object' || obj === null) return null

            // Clean sensitive data
            const entries = Object.entries(obj).filter(([k]) => k !== 'password' && k !== 'password_hash')

            if (entries.length === 0) return null

            return (
                <div className="border rounded-lg overflow-hidden mt-4">
                    <Table>
                        <TableHeader className="bg-slate-50">
                            <TableRow>
                                <TableHead className="w-1/3">ชื่อฟิลด์ (Field Name)</TableHead>
                                <TableHead>ค่าข้อมูล (Value)</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {entries.map(([key, val]) => {
                                let displayedVal = ''
                                if (typeof val === 'object' && val !== null) {
                                    displayedVal = JSON.stringify(val)
                                } else {
                                    displayedVal = String(val)
                                }

                                return (
                                    <TableRow key={key} className="hover:bg-transparent">
                                        <TableCell className="font-mono text-xs font-semibold text-slate-600">{key}</TableCell>
                                        <TableCell className="font-mono text-xs text-slate-800 break-all">{displayedVal}</TableCell>
                                    </TableRow>
                                )
                            })}
                        </TableBody>
                    </Table>
                </div>
            )
        } catch {
            return null
        }
    }

    if (!isAdmin) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
                <AlertCircle className="h-16 w-16 text-red-500 animate-bounce" />
                <h2 className="text-xl font-bold text-slate-800">ไม่มีสิทธิ์เข้าถึงหน้าจอนี้</h2>
                <p className="text-slate-500 text-sm">ขออภัย หน้าจอนี้สำหรับผู้ใช้งานสิทธิ์แอดมินหรือผู้ดูแลระบบเท่านั้น</p>
                <Link href="/dashboard">
                    <Button className="mt-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white">กลับไปยังหน้าหลัก</Button>
                </Link>
            </div>
        )
    }

    return (
        <div className="space-y-6 animate-fade-in pb-12">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <Link href="/settings">
                        <Button variant="ghost" size="icon" className="rounded-xl border hover:bg-slate-100" aria-label="กลับไปยังหน้าตั้งค่า">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2.5">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-red-600 shadow-sm shadow-red-200">
                                <Shield className="h-5 w-5 text-white" />
                            </div>
                            ประวัติความมั่นคงปลอดภัยระบบ (System Audit Trails)
                        </h1>
                        <p className="text-muted-foreground text-sm mt-1 ml-0.5">ตรวจสอบการทำงานของพนักงาน สัญญาณเตือนล็อกอิน หรือความโปร่งใสในข้อมูล</p>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card className="bg-gradient-to-br from-red-50 to-red-100/30 border-red-100">
                    <CardContent className="p-5 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-red-600">ประวัติความปลอดภัยรวม</p>
                            <h3 className="text-2xl font-bold text-red-800 mt-1">{data?.pagination?.total || 0} รายการ</h3>
                        </div>
                        <div className="h-10 w-10 rounded-xl bg-red-500 flex items-center justify-center text-white shadow-sm">
                            <Database className="h-5 w-5" />
                        </div>
                    </CardContent>
                </Card>
                
                <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100/30 border-emerald-100">
                    <CardContent className="p-5 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600">การสร้างข้อมูลใหม่</p>
                            <h3 className="text-2xl font-bold text-emerald-800 mt-1">
                                {isLoading ? '-' : (data?.logs?.filter(l => l.action.startsWith('CREATE')).length || 0)} รายการ
                            </h3>
                        </div>
                        <div className="h-10 w-10 rounded-xl bg-emerald-500 flex items-center justify-center text-white shadow-sm">
                            <Terminal className="h-5 w-5" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-blue-50 to-blue-100/30 border-blue-100">
                    <CardContent className="p-5 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">การแก้ไขปรับปรุงข้อมูล</p>
                            <h3 className="text-2xl font-bold text-blue-800 mt-1">
                                {isLoading ? '-' : (data?.logs?.filter(l => l.action.startsWith('UPDATE')).length || 0)} รายการ
                            </h3>
                        </div>
                        <div className="h-10 w-10 rounded-xl bg-blue-500 flex items-center justify-center text-white shadow-sm">
                            <Info className="h-5 w-5" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-50 to-purple-100/30 border-purple-100">
                    <CardContent className="p-5 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-purple-600">บันทึกการเข้าใช้ (Login)</p>
                            <h3 className="text-2xl font-bold text-purple-800 mt-1">
                                {isLoading ? '-' : (data?.logs?.filter(l => l.action === 'LOGIN').length || 0)} ครั้ง
                            </h3>
                        </div>
                        <div className="h-10 w-10 rounded-xl bg-purple-500 flex items-center justify-center text-white shadow-sm">
                            <User className="h-5 w-5" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filter Panel */}
            <Card>
                <CardHeader className="py-4">
                    <CardTitle className="text-base flex items-center gap-2">
                        <Filter className="h-4 w-4 text-slate-500" />
                        แผงตัวกรองค้นหาประวัติ
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-4">
                        {/* Search Input */}
                        <div className="space-y-1.5">
                            <Label htmlFor="searchQuery">ค้นหาเนื้อหา / IP</Label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    id="searchQuery"
                                    placeholder="ระบุข้อมูลสินค้า, ไอดี หรือ IP..."
                                    value={searchQuery}
                                    onChange={(e) => { setSearchQuery(e.target.value); setPage(1) }}
                                    className="pl-10"
                                />
                            </div>
                        </div>

                        {/* Action Filter */}
                        <div className="space-y-1.5">
                            <Label htmlFor="actionFilter">ประเภทการทำรายการ</Label>
                            <Select value={actionFilter} onValueChange={(val) => { setActionFilter(val); setPage(1) }}>
                                <SelectTrigger id="actionFilter">
                                    <SelectValue placeholder="เลือกกิจกรรม" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">ทั้งหมด (All Actions)</SelectItem>
                                    <SelectItem value="CREATE">สร้างข้อมูลใหม่ (CREATE)</SelectItem>
                                    <SelectItem value="UPDATE">แก้ไขข้อมูลเดิม (UPDATE)</SelectItem>
                                    <SelectItem value="DELETE">ลบข้อมูลเดิม (DELETE)</SelectItem>
                                    <SelectItem value="LOGIN">เข้าสู่ระบบ (LOGIN)</SelectItem>
                                    <SelectItem value="LOGOUT">ออกจากระบบ (LOGOUT)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Resource Filter */}
                        <div className="space-y-1.5">
                            <Label htmlFor="resourceFilter">ประเภทข้อมูลระบบ (Resource)</Label>
                            <Select value={resourceFilter} onValueChange={(val) => { setResourceFilter(val); setPage(1) }}>
                                <SelectTrigger id="resourceFilter">
                                    <SelectValue placeholder="เลือกชนิดข้อมูล" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">ทั้งหมด (All Resources)</SelectItem>
                                    <SelectItem value="customer">ข้อมูลลูกค้า (Patient)</SelectItem>
                                    <SelectItem value="customer_deposit">เงินมัดจำ (Deposit)</SelectItem>
                                    <SelectItem value="customer_consent">ใบยินยอม PDPA (Consent)</SelectItem>
                                    <SelectItem value="appointment">คิวนัดหมาย (Appointment)</SelectItem>
                                    <SelectItem value="product">สินค้าคลังย่อย (Product)</SelectItem>
                                    <SelectItem value="inventory">คลังสินค้า (Inventory)</SelectItem>
                                    <SelectItem value="stock_movement">การเคลื่อนไหวสต๊อก (Stock Movement)</SelectItem>
                                    <SelectItem value="transaction_header">ใบเสร็จ/บิลชำระ (Transaction)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Staff Filter */}
                        <div className="space-y-1.5">
                            <Label htmlFor="staffFilter">เจ้าหน้าที่ผู้ทำรายการ</Label>
                            <Select value={staffFilter} onValueChange={(val) => { setStaffFilter(val); setPage(1) }}>
                                <SelectTrigger id="staffFilter">
                                    <SelectValue placeholder="เลือกพนักงาน" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">พนักงานทุกคน (All Staff)</SelectItem>
                                    {staffList.map((s) => (
                                        <SelectItem key={s.staff_id} value={s.staff_id.toString()}>
                                            {s.full_name} ({s.position})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-4 pt-1">
                        {/* Start Date */}
                        <div className="space-y-1.5">
                            <Label htmlFor="startDate">ตั้งแต่วันที่</Label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    id="startDate"
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => { setStartDate(e.target.value); setPage(1) }}
                                    className="pl-10"
                                />
                            </div>
                        </div>

                        {/* End Date */}
                        <div className="space-y-1.5">
                            <Label htmlFor="endDate">ถึงวันที่</Label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    id="endDate"
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => { setEndDate(e.target.value); setPage(1) }}
                                    className="pl-10"
                                />
                            </div>
                        </div>

                        {/* Reset Filters */}
                        <div className="flex items-end md:col-span-2">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setActionFilter('all')
                                    setResourceFilter('all')
                                    setStaffFilter('all')
                                    setSearchQuery('')
                                    setStartDate('')
                                    setEndDate('')
                                    setPage(1)
                                }}
                                className="w-full md:w-auto"
                            >
                                ล้างตัวกรองทั้งหมด
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Table Card */}
            <Card>
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="p-6 space-y-4">
                            {[...Array(6)].map((_, i) => (
                                <Skeleton key={i} className="h-10 w-full rounded-md" />
                            ))}
                        </div>
                    ) : error ? (
                        <div className="p-8 text-center text-red-500 space-y-2">
                            <AlertCircle className="h-12 w-12 mx-auto" />
                            <p className="font-bold">เกิดข้อผิดพลาดในการโหลดข้อมูล</p>
                            <p className="text-sm text-slate-500">{(error as Error).message}</p>
                        </div>
                    ) : !data?.logs?.length ? (
                        <div className="py-16 text-center text-slate-500">
                            <Terminal className="h-12 w-12 mx-auto mb-4 opacity-40 text-slate-400" />
                            <p className="font-medium text-base">ไม่พบข้อมูลประวัติระบบตามเงื่อนไขที่กำหนด</p>
                            <p className="text-xs text-slate-400 mt-1">ทดลองล้างตัวกรองหรือระบุคำค้นหาที่กว้างขึ้น</p>
                        </div>
                    ) : (
                        <div>
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-slate-50">
                                            <TableHead className="w-[180px] text-xs font-bold uppercase text-slate-500">ประเภทหัตถการ (Action)</TableHead>
                                            <TableHead className="w-[140px] text-xs font-bold uppercase text-slate-500">ชนิดข้อมูล (Resource)</TableHead>
                                            <TableHead className="w-[100px] text-xs font-bold uppercase text-slate-500">เป้าหมาย (ID)</TableHead>
                                            <TableHead className="text-xs font-bold uppercase text-slate-500">ผู้ดำเนินการ (Operator)</TableHead>
                                            <TableHead className="text-xs font-bold uppercase text-slate-500">วันเวลาทำรายการ</TableHead>
                                            <TableHead className="text-xs font-bold uppercase text-slate-500">เครือข่าย IP</TableHead>
                                            <TableHead className="w-[110px] text-center"></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {data.logs.map((log) => (
                                            <TableRow key={log.id} className="hover:bg-slate-50/50 transition-colors">
                                                <TableCell>
                                                    <Badge variant="outline" className={getActionBadgeColor(log.action)}>
                                                        {log.action}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="font-medium font-mono text-xs text-slate-600">{log.target_resource || '-'}</TableCell>
                                                <TableCell className="font-mono text-xs font-semibold text-slate-500">{log.target_id || '-'}</TableCell>
                                                <TableCell>
                                                    {log.staff ? (
                                                        <div className="flex flex-col">
                                                            <span className="font-semibold text-sm text-slate-800">{log.staff.full_name}</span>
                                                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{log.staff.position}</span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-muted-foreground italic text-xs">ระบบอัตโนมัติ (System)</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-xs text-slate-600 font-medium">
                                                    {log.timestamp ? formatDateTime(log.timestamp) : '-'}
                                                </TableCell>
                                                <TableCell className="font-mono text-xs text-slate-500 font-semibold">{log.ip_address || 'unknown'}</TableCell>
                                                <TableCell className="text-center">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => setSelectedLog(log)}
                                                        className="h-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50 gap-1 rounded-lg"
                                                    >
                                                        <Eye className="h-3.5 w-3.5" />
                                                        เปิดดู
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>

                            {/* Pagination Controls */}
                            {data.pagination.totalPages > 1 && (
                                <div className="flex items-center justify-between border-t p-4">
                                    <div className="text-xs text-slate-500">
                                        แสดงหน้า {data.pagination.page} จาก {data.pagination.totalPages} (รวมประวัติ {data.pagination.total} รายการ)
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setPage(p => Math.max(1, p - 1))}
                                            disabled={page === 1}
                                            className="h-8 gap-1.5"
                                        >
                                            <ChevronLeft className="h-4 w-4" />
                                            ก่อนหน้า
                                        </Button>
                                        
                                        {[...Array(data.pagination.totalPages)].map((_, i) => {
                                            const pageNum = i + 1
                                            // Only show a window of pages around current page
                                            if (
                                                pageNum === 1 ||
                                                pageNum === data.pagination.totalPages ||
                                                Math.abs(pageNum - page) <= 2
                                            ) {
                                                return (
                                                    <Button
                                                        key={pageNum}
                                                        variant={page === pageNum ? 'default' : 'outline'}
                                                        size="sm"
                                                        onClick={() => setPage(pageNum)}
                                                        className="h-8 w-8 p-0"
                                                    >
                                                        {pageNum}
                                                    </Button>
                                                )
                                            }
                                            if (
                                                pageNum === 2 ||
                                                pageNum === data.pagination.totalPages - 1
                                            ) {
                                                return <span key={pageNum} className="px-1 text-slate-400 text-xs">...</span>
                                            }
                                            return null
                                        })}

                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setPage(p => Math.min(data.pagination.totalPages, p + 1))}
                                            disabled={page === data.pagination.totalPages}
                                            className="h-8 gap-1.5"
                                        >
                                            ถัดไป
                                            <ChevronRight className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Audit Log Detail Dialog */}
            <Dialog open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-lg">
                            <Shield className="h-5 w-5 text-red-500" />
                            รายละเอียดการดำเนินการความโปร่งใสข้อมูล
                        </DialogTitle>
                        <DialogDescription className="sr-only">
                            หน้าจอแสดงข้อมูลดิบและเนื้อหาที่มีการเปลี่ยนแปลงในระบบอย่างละเอียด
                        </DialogDescription>
                    </DialogHeader>
                    {selectedLog && (
                        <div className="space-y-4">
                            {/* Summary Cards */}
                            <div className="grid grid-cols-2 gap-3 text-sm border-b pb-4">
                                <div className="space-y-1">
                                    <span className="text-slate-400 text-xs font-semibold block">ประเภทกิจกรรม</span>
                                    <Badge variant="outline" className={getActionBadgeColor(selectedLog.action)}>
                                        {selectedLog.action}
                                    </Badge>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-slate-400 text-xs font-semibold block">วันเวลาทำรายการ</span>
                                    <span className="font-semibold text-slate-700">{formatDateTime(selectedLog.timestamp)}</span>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-slate-400 text-xs font-semibold block">ผู้ดำเนินการ (Operator)</span>
                                    <span className="font-semibold text-slate-700">
                                        {selectedLog.staff ? `${selectedLog.staff.full_name} (${selectedLog.staff.position})` : 'ระบบอัตโนมัติ'}
                                    </span>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-slate-400 text-xs font-semibold block">ที่อยู่เครือข่าย IP / เบราว์เซอร์</span>
                                    <span className="font-mono text-xs font-semibold text-slate-700">{selectedLog.ip_address || 'unknown'}</span>
                                </div>
                            </div>

                            {/* Details JSON */}
                            <div className="space-y-2">
                                <span className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
                                    <Terminal className="h-4 w-4 text-slate-500" />
                                    ข้อมูลที่มีการเปลี่ยนแปลง (Data Arguments Diff)
                                </span>
                                
                                {renderDetailsDiff(selectedLog.details)}

                                <div className="pt-2">
                                    <span className="text-xs font-semibold text-slate-500 block mb-1">ข้อมูลในรูปแบบดิบ (Raw JSON Payload):</span>
                                    {renderJsonDetails(selectedLog.details)}
                                </div>
                            </div>

                            {/* System Context */}
                            {selectedLog.user_agent && (
                                <div className="p-3 bg-slate-50 border rounded-lg text-xs space-y-1">
                                    <span className="font-bold text-slate-500 block">ซอฟต์แวร์/เบราว์เซอร์ต้นทาง (User Agent):</span>
                                    <span className="font-mono text-slate-600 break-all">{selectedLog.user_agent}</span>
                                </div>
                            )}

                            {/* Alert Context */}
                            {selectedLog.action.includes('DELETE') && (
                                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-start gap-2">
                                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                                    <div>
                                        <strong>คำเตือน:</strong> การกระทำนี้เป็นการลบข้อมูล (`DELETE`) รายการที่มีรหัส ID <strong>#{selectedLog.target_id}</strong> ออกจากฐานข้อมูล ประวัตินี้จะจัดเก็บอย่างถาวรและไม่สามารถแก้ไขได้เพื่อเหตุผลความมั่นคงปลอดภัยระบบ
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
