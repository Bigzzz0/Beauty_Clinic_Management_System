'use client'

import { useState } from 'react'
import {
    Settings, Package, GraduationCap, Users, Plus, Search,
    Edit, Trash2, Save, Eye, EyeOff, DollarSign, Wallet, KeyRound, Shield
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth-store'
import { formatCurrency } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog'
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
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface Product {
    product_id: number
    product_code: string
    product_name: string
    category: string
    main_unit: string
    sub_unit: string
    pack_size: number
    is_liquid: boolean
    cost_price: number
    standard_price: number
    staff_price: number
    is_active: boolean
}

interface Course {
    course_id: number
    course_code: string
    course_name: string
    description: string | null
    standard_price: number
    staff_price: number
    session_count: number
    is_active: boolean
    course_item: Array<{ id: number; item_name: string; qty_limit: number }>
}

interface Staff {
    staff_id: number
    full_name: string
    position: string
    username: string
    is_active: boolean
    must_change_password?: boolean
    login_attempts?: number
    locked_until?: string | null
}

// Categories and Units will be fetched dynamically

const getCategoryColor = (cat: string) => {
    const colors: Record<string, string> = {
        Botox: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
        Filler: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300',
        Treatment: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
        Medicine: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
        Equipment: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
        Skin: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300',
    }
    return colors[cat] || 'bg-muted text-muted-foreground'
}

const PREDEFINED_CATEGORIES = [
    'Botox', 'Filler', 'Treatment', 'Medicine', 'Equipment', 'Skin', 'Service', 'Other'
]

const PREDEFINED_MAIN_UNITS = [
    'ลัง', 'กล่อง', 'ขวด', 'หลอด', 'แพ็ค', 'ซอง', 'แผง', 'เซ็ต', 'กระปุก', 'แท่ง', 'ถุง', 'ม้วน'
]

const PREDEFINED_SUB_UNITS = [
    'ชิ้น', 'ซีซี', 'มิลลิลิตร', 'ลิตร', 'กรัม', 'เม็ด', 'แคปซูล', 'ครั้ง', 'โดส', 'หยด', 'เส้น', 'ยูนิต'
]

export default function SettingsPage() {
    const token = useAuthStore((s) => s.token)
    const user = useAuthStore((s) => s.user)
    const queryClient = useQueryClient()
    const isAdmin = user?.position === 'Admin'

    // Product state
    const [productSearch, setProductSearch] = useState('')
    const [productDialog, setProductDialog] = useState(false)
    const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null)
    const [deleteProductId, setDeleteProductId] = useState<number | null>(null)

    // Course state
    const [courseSearch, setCourseSearch] = useState('')
    const [courseDialog, setCourseDialog] = useState(false)
    const [editingCourse, setEditingCourse] = useState<Partial<Course> | null>(null)
    const [deleteCourseId, setDeleteCourseId] = useState<number | null>(null)

    // Staff state
    const [staffSearch, setStaffSearch] = useState('')
    const [staffDialog, setStaffDialog] = useState(false)
    const [editingStaff, setEditingStaff] = useState<Partial<Staff> & { password?: string } | null>(null)
    const [deleteStaffId, setDeleteStaffId] = useState<number | null>(null)
    const [showCreatePassword, setShowCreatePassword] = useState(false)
    const [resetTargetStaff, setResetTargetStaff] = useState<Staff | null>(null)
    const [resetPassword, setResetPassword] = useState('')
    const [showResetPassword, setShowResetPassword] = useState(false)

    // Fetch products
    const { data: products = [] } = useQuery<Product[]>({
        queryKey: ['products-admin', productSearch],
        queryFn: async () => {
            const params = new URLSearchParams()
            if (productSearch) params.set('search', productSearch)
            params.set('includeInactive', 'true')
            const res = await fetch(`/api/products?${params}`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            })
            return res.json()
        },
    })

    // Fetch courses
    const { data: courses = [] } = useQuery<Course[]>({
        queryKey: ['courses-admin'],
        queryFn: async () => {
            const res = await fetch('/api/courses', {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            })
            return res.json()
        },
    })

    // Fetch staff
    const { data: staffList = [] } = useQuery<Staff[]>({
        queryKey: ['staff-admin'],
        queryFn: async () => {
            const res = await fetch('/api/staff?includeInactive=true', {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            })
            if (!res.ok) throw new Error('Failed to fetch staff')
            return res.json()
        },
    })

    // Fetch dynamic categories
    const { data: dynamicCategories = [] } = useQuery<{ id: number, name: string }[]>({
        queryKey: ['categories-product'],
        queryFn: async () => {
            const res = await fetch(`/api/categories?type=PRODUCT`)
            return res.json()
        },
    })

    const { data: dynamicMainUnits = [] } = useQuery<{ id: number, name: string }[]>({
        queryKey: ['categories-main-unit'],
        queryFn: async () => {
            const res = await fetch(`/api/categories?type=MAIN_UNIT`)
            return res.json()
        },
    })

    const { data: dynamicSubUnits = [] } = useQuery<{ id: number, name: string }[]>({
        queryKey: ['categories-sub-unit'],
        queryFn: async () => {
            const res = await fetch(`/api/categories?type=SUB_UNIT`)
            return res.json()
        },
    })

    const allCategories = Array.from(new Set([...PREDEFINED_CATEGORIES, ...dynamicCategories.map(c => c.name)]))
    const allMainUnits = Array.from(new Set([...PREDEFINED_MAIN_UNITS, ...dynamicMainUnits.map(u => u.name)]))
    const allSubUnits = Array.from(new Set([...PREDEFINED_SUB_UNITS, ...dynamicSubUnits.map(u => u.name)]))

    const POSITIONS = ['Admin', 'Doctor', 'Therapist', 'Sale', 'Cashier']

    const parseOptionalInt = (value: string): number | undefined => {
        if (value === '') return undefined
        const parsed = Number.parseInt(value, 10)
        return Number.isNaN(parsed) ? undefined : parsed
    }

    const parseOptionalFloat = (value: string): number | undefined => {
        if (value === '') return undefined
        const parsed = Number.parseFloat(value)
        return Number.isNaN(parsed) ? undefined : parsed
    }

    // Product mutations
    const productMutation = useMutation({
        mutationFn: async (data: Partial<Product>) => {
            const url = data.product_id ? `/api/products/${data.product_id}` : '/api/products'
            const method = data.product_id ? 'PUT' : 'POST'
            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify(data),
            })
            if (!res.ok) throw new Error('Failed')
            return res.json()
        },
        onSuccess: () => {
            toast.success('บันทึกสินค้าสำเร็จ')
            queryClient.invalidateQueries({ queryKey: ['products-admin'] })
            setProductDialog(false)
            setEditingProduct(null)
        },
        onError: () => toast.error('เกิดข้อผิดพลาด'),
    })

    const deleteProductMutation = useMutation({
        mutationFn: async (id: number) => {
            const res = await fetch(`/api/products/${id}`, {
                method: 'DELETE',
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            })
            if (!res.ok) throw new Error('Failed')
            return res.json()
        },
        onSuccess: () => {
            toast.success('ลบสินค้าสำเร็จ')
            queryClient.invalidateQueries({ queryKey: ['products-admin'] })
            setDeleteProductId(null)
        },
        onError: () => toast.error('เกิดข้อผิดพลาด'),
    })

    // Course mutations
    const courseMutation = useMutation({
        mutationFn: async (data: Partial<Course>) => {
            const url = data.course_id ? `/api/courses/${data.course_id}` : '/api/courses'
            const method = data.course_id ? 'PUT' : 'POST'
            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify(data),
            })
            if (!res.ok) throw new Error('Failed')
            return res.json()
        },
        onSuccess: () => {
            toast.success('บันทึกคอร์สสำเร็จ')
            queryClient.invalidateQueries({ queryKey: ['courses-admin'] })
            setCourseDialog(false)
            setEditingCourse(null)
        },
        onError: () => toast.error('เกิดข้อผิดพลาด'),
    })

    const deleteCourseMutation = useMutation({
        mutationFn: async (id: number) => {
            const res = await fetch(`/api/courses/${id}`, {
                method: 'DELETE',
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            })
            if (!res.ok) throw new Error('Failed')
            return res.json()
        },
        onSuccess: () => {
            toast.success('ลบคอร์สสำเร็จ')
            queryClient.invalidateQueries({ queryKey: ['courses-admin'] })
            setDeleteCourseId(null)
        },
        onError: () => toast.error('เกิดข้อผิดพลาด'),
    })

    // Staff mutations
    const staffMutation = useMutation({
        mutationFn: async (data: Partial<Staff> & { password?: string }) => {
            const url = data.staff_id ? `/api/staff/${data.staff_id}` : '/api/staff'
            const method = data.staff_id ? 'PUT' : 'POST'

            const payload = data.staff_id
                ? {
                    full_name: data.full_name,
                    position: data.position,
                    username: data.username,
                    is_active: data.is_active,
                }
                : data

            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify(payload),
            })
            const result = await res.json()
            if (!res.ok) throw new Error(result.error || 'Failed')
            return result
        },
        onSuccess: () => {
            toast.success('บันทึกพนักงานสำเร็จ')
            queryClient.invalidateQueries({ queryKey: ['staff-admin'] })
            setStaffDialog(false)
            setEditingStaff(null)
            setShowCreatePassword(false)
        },
        onError: (error: Error) => toast.error(error.message || 'เกิดข้อผิดพลาด'),
    })

    const deleteStaffMutation = useMutation({
        mutationFn: async (id: number) => {
            const res = await fetch(`/api/staff/${id}`, {
                method: 'DELETE',
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            })
            const result = await res.json()
            if (!res.ok) throw new Error(result.error || 'Failed')
            return result
        },
        onSuccess: () => {
            toast.success('ลบพนักงานสำเร็จ')
            queryClient.invalidateQueries({ queryKey: ['staff-admin'] })
            setDeleteStaffId(null)
        },
        onError: (error: Error) => toast.error(error.message || 'เกิดข้อผิดพลาด'),
    })

    const resetStaffPasswordMutation = useMutation({
        mutationFn: async ({ staffId, newPassword }: { staffId: number; newPassword: string }) => {
            const res = await fetch(`/api/staff/${staffId}/password`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify({
                    resetByAdmin: true,
                    newPassword,
                }),
            })

            const result = await res.json()
            if (!res.ok) throw new Error(result.error || 'Failed')
            return result
        },
        onSuccess: () => {
            toast.success('รีเซ็ตรหัสผ่านสำเร็จ และบังคับเปลี่ยนรหัสครั้งถัดไปแล้ว')
            setResetTargetStaff(null)
            setResetPassword('')
            setShowResetPassword(false)
            queryClient.invalidateQueries({ queryKey: ['staff-admin'] })
        },
        onError: (error: Error) => toast.error(error.message || 'เกิดข้อผิดพลาด'),
    })

    const unlockStaffMutation = useMutation({
        mutationFn: async (id: number) => {
            const res = await fetch(`/api/staff/${id}/unlock`, {
                method: 'POST',
                headers: {
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
            })
            const result = await res.json()
            if (!res.ok) throw new Error(result.error || 'Failed')
            return result
        },
        onSuccess: (data) => {
            toast.success(data.message || 'ปลดล็อกบัญชีพนักงานสำเร็จ')
            queryClient.invalidateQueries({ queryKey: ['staff-admin'] })
        },
        onError: (error: Error) => toast.error(error.message || 'เกิดข้อผิดพลาดในการปลดล็อก'),
    })

    const filteredCourses = courses.filter(c =>
        c.course_name.toLowerCase().includes(courseSearch.toLowerCase()) ||
        c.course_code.toLowerCase().includes(courseSearch.toLowerCase())
    )

    const filteredStaffList = staffList.filter(s =>
        s.full_name.toLowerCase().includes(staffSearch.toLowerCase()) ||
        s.username.toLowerCase().includes(staffSearch.toLowerCase())
    )

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 shadow-sm shadow-amber-200">
                        <Settings className="h-5 w-5 text-white" />
                    </div>
                    ตั้งค่าระบบ
                </h1>
                <p className="text-muted-foreground text-sm mt-1 ml-0.5">จัดการสินค้า, คอร์ส, และพนักงาน</p>
            </div>

            {/* Stat Pills */}
            <div className="flex flex-wrap gap-2">
                <div className="flex items-center gap-1.5 rounded-full border bg-amber-50 border-amber-200 px-3 py-1">
                    <div className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                    <span className="text-xs font-semibold text-amber-700">สินค้า {products.length} รายการ</span>
                </div>
                <div className="flex items-center gap-1.5 rounded-full border bg-blue-50 border-blue-200 px-3 py-1">
                    <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                    <span className="text-xs font-semibold text-blue-700">คอร์ส {courses.length} รายการ</span>
                </div>
                <div className="flex items-center gap-1.5 rounded-full border bg-purple-50 border-purple-200 px-3 py-1">
                    <div className="h-1.5 w-1.5 rounded-full bg-purple-500" />
                    <span className="text-xs font-semibold text-purple-700">พนักงาน {staffList.length} คน</span>
                </div>
            </div>

            <Tabs defaultValue="products" className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    {/* Main content tabs */}
                    <TabsList>
                        <TabsTrigger value="products">
                            <Package className="h-4 w-4 mr-2" />
                            สินค้า
                        </TabsTrigger>
                        <TabsTrigger value="courses">
                            <GraduationCap className="h-4 w-4 mr-2" />
                            คอร์ส
                        </TabsTrigger>
                        <TabsTrigger value="staff">
                            <Users className="h-4 w-4 mr-2" />
                            พนักงาน
                        </TabsTrigger>
                    </TabsList>

                    {/* Sub-page navigation links */}
                    <div className="flex flex-wrap gap-2">
                        {isAdmin && (
                            <Link href="/settings/audit-logs">
                                <Button variant="outline" size="sm" className="gap-2 border-red-300 text-red-700 hover:bg-red-50">
                                    <KeyRound className="h-3.5 w-3.5" />
                                    ประวัติความปลอดภัยระบบ
                                </Button>
                            </Link>
                        )}
                        <Link href="/settings/categories">
                            <Button variant="outline" size="sm" className="gap-2 border-amber-300 text-amber-700 hover:bg-amber-50">
                                <Package className="h-3.5 w-3.5" />
                                หมวดหมู่
                            </Button>
                        </Link>
                        <Link href="/settings/commission-rates">
                            <Button variant="outline" size="sm" className="gap-2 border-amber-300 text-amber-700 hover:bg-amber-50">
                                <DollarSign className="h-3.5 w-3.5" />
                                อัตราค่าคอม
                            </Button>
                        </Link>
                        <Link href="/settings/deposits">
                            <Button variant="outline" size="sm" className="gap-2 border-amber-300 text-amber-700 hover:bg-amber-50">
                                <Wallet className="h-3.5 w-3.5" />
                                จัดการมัดจำ
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Products Tab */}
                <TabsContent value="products">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>รายการสินค้า ({products.length})</CardTitle>
                            <div className="flex gap-2">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        placeholder="ค้นหา..."
                                        value={productSearch}
                                        onChange={(e) => setProductSearch(e.target.value)}
                                        className="pl-10 w-64"
                                        aria-label="Search products"
                                    />
                                </div>
                                <Button
                                    onClick={() => { setEditingProduct({}); setProductDialog(true) }}
                                    className="gap-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-sm shadow-amber-200 transition-all hover:-translate-y-0.5"
                                >
                                    <Plus className="h-4 w-4" />
                                    เพิ่มสินค้า
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-xl border overflow-hidden">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-slate-50 hover:bg-slate-50">
                                            <TableHead className="text-xs font-semibold uppercase tracking-wide text-slate-500">รหัส</TableHead>
                                            <TableHead className="text-xs font-semibold uppercase tracking-wide text-slate-500">ชื่อสินค้า</TableHead>
                                            <TableHead className="text-xs font-semibold uppercase tracking-wide text-slate-500">หมวด</TableHead>
                                            <TableHead className="text-xs font-semibold uppercase tracking-wide text-slate-500">หน่วย</TableHead>
                                            <TableHead className="text-right text-xs font-semibold uppercase tracking-wide text-slate-500">ราคาขาย</TableHead>
                                            <TableHead className="text-xs font-semibold uppercase tracking-wide text-slate-500">สถานะ</TableHead>
                                            <TableHead className="w-24"></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {products.map((p) => (
                                            <TableRow key={p.product_id} className="hover:bg-amber-50/30 transition-colors">
                                                <TableCell className="font-mono text-xs text-slate-500">{p.product_code}</TableCell>
                                                <TableCell className="font-medium">{p.product_name}</TableCell>
                                                <TableCell>
                                                    <Badge className={getCategoryColor(p.category)}>{p.category}</Badge>
                                                </TableCell>
                                                <TableCell className="text-sm">{p.sub_unit}/{p.main_unit}</TableCell>
                                                <TableCell className="text-right">{formatCurrency(Number(p.standard_price))}</TableCell>
                                                <TableCell>
                                                    <Badge variant={p.is_active ? 'default' : 'secondary'}>
                                                        {p.is_active ? 'ใช้งาน' : 'ปิดใช้'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex gap-1">
                                                        <Button variant="ghost" size="icon" onClick={() => { setEditingProduct(p); setProductDialog(true) }} aria-label={`Edit ${p.product_name}`}>
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDeleteProductId(p.product_id)} aria-label={`Delete ${p.product_name}`}>
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Courses Tab */}
                <TabsContent value="courses">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>รายการคอร์ส ({filteredCourses.length})</CardTitle>
                            <div className="flex gap-2">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        placeholder="ค้นหาชื่อ หรือ รหัส..."
                                        value={courseSearch}
                                        onChange={(e) => setCourseSearch(e.target.value)}
                                        className="pl-10 w-64"
                                        aria-label="Search courses"
                                    />
                                </div>
                                <Button
                                    onClick={() => { setEditingCourse({}); setCourseDialog(true) }}
                                    className="gap-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-sm shadow-amber-200 transition-all hover:-translate-y-0.5"
                                >
                                    <Plus className="h-4 w-4" />
                                    เพิ่มคอร์ส
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-xl border overflow-hidden">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-slate-50 hover:bg-slate-50">
                                            <TableHead className="text-xs font-semibold uppercase tracking-wide text-slate-500">รหัส</TableHead>
                                            <TableHead className="text-xs font-semibold uppercase tracking-wide text-slate-500">ชื่อคอร์ส</TableHead>
                                            <TableHead className="text-right text-xs font-semibold uppercase tracking-wide text-slate-500">ราคา</TableHead>
                                            <TableHead className="text-center text-xs font-semibold uppercase tracking-wide text-slate-500">จำนวนครั้ง</TableHead>
                                            <TableHead className="text-xs font-semibold uppercase tracking-wide text-slate-500">สถานะ</TableHead>
                                            <TableHead className="w-24"></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredCourses.map((c) => (
                                            <TableRow key={c.course_id} className="hover:bg-amber-50/30 transition-colors">
                                                <TableCell className="font-mono text-xs text-slate-500">{c.course_code}</TableCell>
                                                <TableCell className="font-medium">{c.course_name}</TableCell>
                                                <TableCell className="text-right">{formatCurrency(Number(c.standard_price))}</TableCell>
                                                <TableCell className="text-center">
                                                    <Badge variant="outline">{c.session_count || 1} ครั้ง</Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={c.is_active ? 'default' : 'secondary'}>
                                                        {c.is_active ? 'ใช้งาน' : 'ปิดใช้'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex gap-1">
                                                        <Button variant="ghost" size="icon" onClick={() => { setEditingCourse(c); setCourseDialog(true) }} aria-label={`Edit ${c.course_name}`}>
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDeleteCourseId(c.course_id)} aria-label={`Delete ${c.course_name}`}>
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Staff Tab */}
                <TabsContent value="staff">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>รายชื่อพนักงาน ({filteredStaffList.length})</CardTitle>
                            <div className="flex gap-2">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        placeholder="ค้นหาชื่อ หรือ username..."
                                        value={staffSearch}
                                        onChange={(e) => setStaffSearch(e.target.value)}
                                        className="pl-10 w-64"
                                        aria-label="Search staff"
                                    />
                                </div>
                                <Button
                                    onClick={() => { setEditingStaff({}); setStaffDialog(true) }}
                                    className="gap-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-sm shadow-amber-200 transition-all hover:-translate-y-0.5"
                                >
                                    <Plus className="h-4 w-4" />
                                    เพิ่มพนักงาน
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-xl border overflow-hidden">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-slate-50 hover:bg-slate-50">
                                            <TableHead className="text-xs font-semibold uppercase tracking-wide text-slate-500">ชื่อ</TableHead>
                                            <TableHead className="text-xs font-semibold uppercase tracking-wide text-slate-500">ตำแหน่ง</TableHead>
                                            <TableHead className="text-xs font-semibold uppercase tracking-wide text-slate-500">Username</TableHead>
                                            <TableHead className="text-xs font-semibold uppercase tracking-wide text-slate-500">สถานะ</TableHead>
                                            <TableHead className="text-xs font-semibold uppercase tracking-wide text-slate-500">รหัสผ่าน</TableHead>
                                            <TableHead className="w-40"></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredStaffList.map((s) => (
                                            <TableRow key={s.staff_id} className="hover:bg-amber-50/30 transition-colors">
                                                <TableCell className="font-medium">{s.full_name}</TableCell>
                                                <TableCell>
                                                    <Badge variant="outline">{s.position}</Badge>
                                                </TableCell>
                                                <TableCell className="font-mono text-sm">{s.username}</TableCell>
                                                <TableCell>
                                                    <Badge variant={s.is_active ? 'default' : 'secondary'}>
                                                        {s.is_active ? 'ใช้งาน' : 'ปิดใช้'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col gap-1">
                                                        <Badge variant={s.must_change_password ? 'destructive' : 'outline'} className="w-fit">
                                                            {s.must_change_password ? 'ต้องเปลี่ยนรหัส' : 'รหัสผ่านปกติ'}
                                                        </Badge>
                                                        {s.login_attempts && s.login_attempts >= 5 ? (
                                                            <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-200 w-fit text-[10px]">
                                                                ระงับชั่วคราว ({s.login_attempts} ครั้ง)
                                                            </Badge>
                                                        ) : s.login_attempts && s.login_attempts > 0 ? (
                                                            <Badge variant="secondary" className="bg-amber-50 text-amber-800 border-amber-200 w-fit text-[10px]">
                                                                เดารหัสผิด ({s.login_attempts} ครั้ง)
                                                            </Badge>
                                                        ) : null}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex gap-1">
                                                        <Button variant="ghost" size="icon" onClick={() => { setEditingStaff(s); setStaffDialog(true) }} aria-label={`Edit ${s.full_name}`}>
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                        {isAdmin && !s.is_active && (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-8 px-2 text-emerald-600"
                                                                onClick={() => staffMutation.mutate({
                                                                    staff_id: s.staff_id,
                                                                    full_name: s.full_name,
                                                                    position: s.position,
                                                                    username: s.username,
                                                                    is_active: true,
                                                                })}
                                                            >
                                                                เปิดใช้
                                                            </Button>
                                                        )}
                                                        {isAdmin && s.login_attempts && s.login_attempts >= 5 && (
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                                                onClick={() => unlockStaffMutation.mutate(s.staff_id)}
                                                                title="ปลดล็อกบัญชีพนักงาน"
                                                                aria-label={`Unlock ${s.full_name}`}
                                                            >
                                                                <Shield className="h-4 w-4" />
                                                            </Button>
                                                        )}
                                                        {isAdmin && (
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="text-blue-600"
                                                                onClick={() => {
                                                                    setResetTargetStaff(s)
                                                                    setResetPassword('')
                                                                    setShowResetPassword(false)
                                                                }}
                                                                aria-label={`Reset password ${s.full_name}`}
                                                            >
                                                                <KeyRound className="h-4 w-4" />
                                                            </Button>
                                                        )}
                                                        {isAdmin && (
                                                            <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDeleteStaffId(s.staff_id)} aria-label={`Delete ${s.full_name}`}>
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Product Dialog */}
            <Dialog open={productDialog} onOpenChange={setProductDialog}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>{editingProduct?.product_id ? 'แก้ไขสินค้า' : 'เพิ่มสินค้า'}</DialogTitle>
                        <DialogDescription className="sr-only">
                            {editingProduct?.product_id ? 'กรอกข้อมูลเพื่อแก้ไขสินค้า' : 'กรอกข้อมูลเพื่อเพิ่มสินค้าใหม่'}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label>ชื่อสินค้า *</Label>
                            <Input value={editingProduct?.product_name || ''} onChange={(e) => setEditingProduct({ ...editingProduct, product_name: e.target.value })} />
                        </div>
                        <div>
                            <Label>หมวดหมู่ *</Label>
                            <Select value={editingProduct?.category || undefined} onValueChange={(v) => setEditingProduct({ ...editingProduct, category: v })}>
                                <SelectTrigger><SelectValue placeholder="เลือกหมวด" /></SelectTrigger>
                                <SelectContent>
                                    {allCategories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <Label>หน่วยใหญ่ *</Label>
                                <Select value={editingProduct?.main_unit || undefined} onValueChange={(v) => setEditingProduct({ ...editingProduct, main_unit: v })}>
                                    <SelectTrigger><SelectValue placeholder="เลือกหน่วยใหญ่" /></SelectTrigger>
                                    <SelectContent>
                                        {allMainUnits
                                            .filter((u) => u !== editingProduct?.sub_unit)
                                            .map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>หน่วยย่อย *</Label>
                                <Select value={editingProduct?.sub_unit || undefined} onValueChange={(v) => setEditingProduct({ ...editingProduct, sub_unit: v })}>
                                    <SelectTrigger><SelectValue placeholder="เลือกหน่วยย่อย" /></SelectTrigger>
                                    <SelectContent>
                                        {allSubUnits
                                            .filter((u) => u !== editingProduct?.main_unit)
                                            .map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <Label>จำนวนต่อหน่วย *</Label>
                                <Input type="number" min={1} inputMode="decimal" value={editingProduct?.pack_size ?? ''} onChange={(e) => setEditingProduct({ ...editingProduct, pack_size: parseOptionalInt(e.target.value) })} />
                            </div>
                            <div className="flex items-center gap-2 pt-6">
                                <Switch id="is-liquid" checked={editingProduct?.is_liquid || false} onCheckedChange={(v) => setEditingProduct({ ...editingProduct, is_liquid: v })} />
                                <Label htmlFor="is-liquid">เป็นของเหลว</Label>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                                <Label>ราคาทุน</Label>
                                <Input type="number" min={0} inputMode="decimal" value={editingProduct?.cost_price ?? ''} onChange={(e) => setEditingProduct({ ...editingProduct, cost_price: parseOptionalFloat(e.target.value) })} />
                            </div>
                            <div>
                                <Label>ราคาขาย *</Label>
                                <Input type="number" min={0} inputMode="decimal" value={editingProduct?.standard_price ?? ''} onChange={(e) => setEditingProduct({ ...editingProduct, standard_price: parseOptionalFloat(e.target.value) })} />
                            </div>
                            <div>
                                <Label>ราคาพนักงาน</Label>
                                <Input type="number" min={0} inputMode="decimal" value={editingProduct?.staff_price ?? ''} onChange={(e) => setEditingProduct({ ...editingProduct, staff_price: parseOptionalFloat(e.target.value) })} />
                            </div>
                        </div>
                        {editingProduct?.product_id && (
                            <div className="flex items-center gap-2">
                                <Switch id="is-active-product" checked={editingProduct?.is_active ?? true} onCheckedChange={(v) => setEditingProduct({ ...editingProduct, is_active: v })} />
                                <Label htmlFor="is-active-product">เปิดใช้งาน</Label>
                            </div>
                        )}
                        <Button
                            className="w-full"
                            onClick={() => {
                                if (!editingProduct) return

                                if (editingProduct.main_unit && editingProduct.sub_unit && editingProduct.main_unit === editingProduct.sub_unit) {
                                    toast.error('หน่วยใหญ่และหน่วยย่อยต้องไม่เหมือนกัน')
                                    return
                                }

                                productMutation.mutate(editingProduct)
                            }}
                            disabled={productMutation.isPending}
                        >
                            <Save className="h-4 w-4 mr-2" />
                            {productMutation.isPending ? 'กำลังบันทึก...' : 'บันทึก'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Course Dialog */}
            <Dialog open={courseDialog} onOpenChange={setCourseDialog}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>{editingCourse?.course_id ? 'แก้ไขคอร์ส' : 'เพิ่มคอร์ส'}</DialogTitle>
                        <DialogDescription className="sr-only">
                            {editingCourse?.course_id ? 'กรอกข้อมูลเพื่อแก้ไขคอร์ส' : 'กรอกข้อมูลเพื่อเพิ่มคอร์สใหม่'}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label>ชื่อคอร์ส *</Label>
                            <Input value={editingCourse?.course_name || ''} onChange={(e) => setEditingCourse({ ...editingCourse, course_name: e.target.value })} />
                        </div>
                        <div>
                            <Label>รายละเอียด</Label>
                            <Textarea value={editingCourse?.description || ''} onChange={(e) => setEditingCourse({ ...editingCourse, description: e.target.value })} />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <Label>ราคาขาย *</Label>
                                <Input type="number" min={0} inputMode="decimal" value={editingCourse?.standard_price ?? ''} onChange={(e) => setEditingCourse({ ...editingCourse, standard_price: parseOptionalFloat(e.target.value) })} />
                            </div>
                            <div>
                                <Label>ราคาพนักงาน</Label>
                                <Input type="number" min={0} inputMode="decimal" value={editingCourse?.staff_price ?? ''} onChange={(e) => setEditingCourse({ ...editingCourse, staff_price: parseOptionalFloat(e.target.value) })} />
                            </div>
                        </div>
                        <div>
                            <Label>จำนวนครั้ง (Sessions) *</Label>
                            <Input type="number" min={1} value={editingCourse?.session_count ?? ''} onChange={(e) => setEditingCourse({ ...editingCourse, session_count: parseOptionalInt(e.target.value) })} />
                            <p className="text-xs text-muted-foreground mt-1">จำนวนครั้งที่ลูกค้าสามารถมาใช้บริการได้</p>
                        </div>
                        {editingCourse?.course_id && (
                            <div className="flex items-center gap-2">
                                <Switch id="is-active-course" checked={editingCourse?.is_active ?? true} onCheckedChange={(v) => setEditingCourse({ ...editingCourse, is_active: v })} />
                                <Label htmlFor="is-active-course">เปิดใช้งาน</Label>
                            </div>
                        )}
                        <Button className="w-full" onClick={() => editingCourse && courseMutation.mutate(editingCourse)} disabled={courseMutation.isPending}>
                            <Save className="h-4 w-4 mr-2" />
                            {courseMutation.isPending ? 'กำลังบันทึก...' : 'บันทึก'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Staff Dialog */}
            <Dialog
                open={staffDialog}
                onOpenChange={(open) => {
                    setStaffDialog(open)
                    if (!open) {
                        setEditingStaff(null)
                        setShowCreatePassword(false)
                    }
                }}
            >
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>{editingStaff?.staff_id ? 'แก้ไขพนักงาน' : 'เพิ่มพนักงาน'}</DialogTitle>
                        <DialogDescription className="sr-only">
                            {editingStaff?.staff_id ? 'กรอกข้อมูลเพื่อแก้ไขพนักงาน' : 'กรอกข้อมูลเพื่อเพิ่มพนักงานใหม่'}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label>ชื่อ-นามสกุล *</Label>
                            <Input maxLength={50} value={editingStaff?.full_name || ''} onChange={(e) => setEditingStaff({ ...editingStaff, full_name: e.target.value })} />
                        </div>
                        <div>
                            <Label>ตำแหน่ง *</Label>
                            <Select value={editingStaff?.position || undefined} onValueChange={(v) => setEditingStaff({ ...editingStaff, position: v })}>
                                <SelectTrigger><SelectValue placeholder="เลือกตำแหน่ง" /></SelectTrigger>
                                <SelectContent>
                                    {POSITIONS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        {(!editingStaff?.staff_id || isAdmin) && (
                            <div>
                                <Label>Username {!editingStaff?.staff_id ? '*' : ''}</Label>
                                <Input value={editingStaff?.username || ''} onChange={(e) => setEditingStaff({ ...editingStaff, username: e.target.value })} />
                            </div>
                        )}
                        {!editingStaff?.staff_id && (
                            <div>
                                <Label>รหัสผ่าน *</Label>
                                <div className="relative">
                                    <Input
                                        type={showCreatePassword ? 'text' : 'password'}
                                        value={editingStaff?.password || ''}
                                        onChange={(e) => setEditingStaff({ ...editingStaff, password: e.target.value })}
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="absolute right-0 top-0"
                                        onClick={() => setShowCreatePassword(!showCreatePassword)}
                                        aria-label={showCreatePassword ? 'Hide password' : 'Show password'}
                                        title={showCreatePassword ? 'Hide password' : 'Show password'}
                                    >
                                        {showCreatePassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </Button>
                                </div>
                            </div>
                        )}
                        {editingStaff?.staff_id && (
                            <p className="text-xs text-muted-foreground">
                                การเปลี่ยนรหัสผ่านของพนักงานให้ใช้ปุ่มรีเซ็ตรหัสผ่าน (ไอคอนกุญแจ) ในตารางพนักงาน
                            </p>
                        )}
                        {editingStaff?.staff_id && (
                            <div className="flex items-center gap-2">
                                <Switch id="is-active-staff" checked={editingStaff?.is_active ?? true} onCheckedChange={(v) => setEditingStaff({ ...editingStaff, is_active: v })} />
                                <Label htmlFor="is-active-staff">เปิดใช้งาน</Label>
                            </div>
                        )}
                        <Button
                            className="w-full"
                            onClick={() => {
                                if (!editingStaff) return

                                if (!editingStaff.full_name?.trim()) {
                                    toast.error('กรุณาระบุชื่อ-นามสกุล')
                                    return
                                }

                                if (!editingStaff.position) {
                                    toast.error('กรุณาเลือกตำแหน่ง')
                                    return
                                }

                                if (!editingStaff.username?.trim()) {
                                    toast.error('กรุณาระบุ Username')
                                    return
                                }

                                if (!editingStaff.staff_id && !editingStaff.password) {
                                    toast.error('กรุณาระบุรหัสผ่าน')
                                    return
                                }

                                staffMutation.mutate(editingStaff)
                            }}
                            disabled={staffMutation.isPending}
                        >
                            <Save className="h-4 w-4 mr-2" />
                            {staffMutation.isPending ? 'กำลังบันทึก...' : 'บันทึก'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Reset Password Dialog */}
            <Dialog
                open={!!resetTargetStaff}
                onOpenChange={(open) => {
                    if (!open) {
                        setResetTargetStaff(null)
                        setResetPassword('')
                        setShowResetPassword(false)
                    }
                }}
            >
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>รีเซ็ตรหัสผ่านพนักงาน</DialogTitle>
                        <DialogDescription>
                            ระบบจะบังคับให้ผู้ใช้เปลี่ยนรหัสผ่านอีกครั้งหลังเข้าสู่ระบบ
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="rounded-md border p-3 text-sm">
                            <p className="font-medium">{resetTargetStaff?.full_name}</p>
                            <p className="text-muted-foreground">{resetTargetStaff?.username}</p>
                        </div>

                        <div>
                            <Label>รหัสผ่านใหม่ชั่วคราว *</Label>
                            <div className="relative">
                                <Input
                                    type={showResetPassword ? 'text' : 'password'}
                                    value={resetPassword}
                                    onChange={(e) => setResetPassword(e.target.value)}
                                    placeholder="อย่างน้อย 8 ตัว และมี A-Z, a-z, 0-9, อักขระพิเศษ"
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="absolute right-0 top-0"
                                    onClick={() => setShowResetPassword(!showResetPassword)}
                                    aria-label={showResetPassword ? 'Hide password' : 'Show password'}
                                    title={showResetPassword ? 'Hide password' : 'Show password'}
                                >
                                    {showResetPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </Button>
                            </div>
                        </div>

                        <Button
                            className="w-full"
                            disabled={resetStaffPasswordMutation.isPending}
                            onClick={() => {
                                if (!resetTargetStaff) return

                                const strongPassword = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,72}$/
                                if (!strongPassword.test(resetPassword)) {
                                    toast.error('รหัสผ่านต้องมี 8-72 ตัว และมีพิมพ์เล็ก/พิมพ์ใหญ่/ตัวเลข/อักขระพิเศษ')
                                    return
                                }

                                resetStaffPasswordMutation.mutate({
                                    staffId: resetTargetStaff.staff_id,
                                    newPassword: resetPassword,
                                })
                            }}
                        >
                            <KeyRound className="h-4 w-4 mr-2" />
                            {resetStaffPasswordMutation.isPending ? 'กำลังรีเซ็ต...' : 'ยืนยันรีเซ็ตรหัสผ่าน'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmations */}
            <AlertDialog open={!!deleteProductId} onOpenChange={(open) => !open && setDeleteProductId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>ยืนยันลบสินค้า</AlertDialogTitle>
                        <AlertDialogDescription>คุณต้องการลบสินค้านี้หรือไม่?</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
                        <AlertDialogAction className="bg-red-600" onClick={() => deleteProductId && deleteProductMutation.mutate(deleteProductId)}>ลบ</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={!!deleteCourseId} onOpenChange={(open) => !open && setDeleteCourseId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>ยืนยันลบคอร์ส</AlertDialogTitle>
                        <AlertDialogDescription>คุณต้องการลบคอร์สนี้หรือไม่?</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
                        <AlertDialogAction className="bg-red-600" onClick={() => deleteCourseId && deleteCourseMutation.mutate(deleteCourseId)}>ลบ</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={!!deleteStaffId} onOpenChange={(open) => !open && setDeleteStaffId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>ยืนยันลบพนักงาน</AlertDialogTitle>
                        <AlertDialogDescription>คุณต้องการลบพนักงานนี้หรือไม่?</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
                        <AlertDialogAction className="bg-red-600" onClick={() => deleteStaffId && deleteStaffMutation.mutate(deleteStaffId)}>ลบ</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
