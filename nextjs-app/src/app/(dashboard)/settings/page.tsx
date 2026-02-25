'use client'

import { useState } from 'react'
import {
    Settings, Package, GraduationCap, Users, Plus, Search,
    Edit, Trash2, Save, X, Eye, EyeOff, DollarSign, Wallet
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

const PREDEFINED_UNITS = [
    'ขวด', 'กล่อง', 'หลอด', 'ชิ้น', 'ซีซี', 'ครั้ง', 'เซ็ต', 'แผง', 'เม็ด', 'แคปซูล', 'กรัม', 'มิลลิลิตร', 'ลิตร',
    'Unit', 'ML', 'CC', 'Amp', 'ซอง', 'เส้น'
]

export default function SettingsPage() {
    const token = useAuthStore((s) => s.token)
    const queryClient = useQueryClient()

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
    const [showPassword, setShowPassword] = useState(false)

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
            const res = await fetch('/api/staff', {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            })
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
    const allMainUnits = Array.from(new Set([...PREDEFINED_UNITS, ...dynamicMainUnits.map(u => u.name)]))
    const allSubUnits = Array.from(new Set([...PREDEFINED_UNITS, ...dynamicSubUnits.map(u => u.name)]))

    const POSITIONS = ['Admin', 'Doctor', 'Therapist', 'Sale', 'Cashier']

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
            toast.success('บันทึกพนักงานสำเร็จ')
            queryClient.invalidateQueries({ queryKey: ['staff-admin'] })
            setStaffDialog(false)
            setEditingStaff(null)
        },
        onError: () => toast.error('เกิดข้อผิดพลาด'),
    })

    const deleteStaffMutation = useMutation({
        mutationFn: async (id: number) => {
            const res = await fetch(`/api/staff/${id}`, {
                method: 'DELETE',
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            })
            if (!res.ok) throw new Error('Failed')
            return res.json()
        },
        onSuccess: () => {
            toast.success('ลบพนักงานสำเร็จ')
            queryClient.invalidateQueries({ queryKey: ['staff-admin'] })
            setDeleteStaffId(null)
        },
        onError: () => toast.error('เกิดข้อผิดพลาด'),
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
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <Settings className="h-6 w-6 text-primary" />
                    ตั้งค่าระบบ
                </h1>
                <p className="text-muted-foreground">จัดการสินค้า, คอร์ส, และพนักงาน</p>
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
                                <Button onClick={() => { setEditingProduct({}); setProductDialog(true) }}>
                                    <Plus className="h-4 w-4 mr-2" />
                                    เพิ่มสินค้า
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-lg border overflow-hidden">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-muted/50">
                                            <TableHead>รหัส</TableHead>
                                            <TableHead>ชื่อสินค้า</TableHead>
                                            <TableHead>หมวด</TableHead>
                                            <TableHead>หน่วย</TableHead>
                                            <TableHead className="text-right">ราคาขาย</TableHead>
                                            <TableHead>สถานะ</TableHead>
                                            <TableHead className="w-24"></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {products.map((p) => (
                                            <TableRow key={p.product_id}>
                                                <TableCell className="font-mono text-sm">{p.product_code}</TableCell>
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
                                <Button onClick={() => { setEditingCourse({}); setCourseDialog(true) }}>
                                    <Plus className="h-4 w-4 mr-2" />
                                    เพิ่มคอร์ส
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-lg border overflow-hidden">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-slate-50">
                                            <TableHead>รหัส</TableHead>
                                            <TableHead>ชื่อคอร์ส</TableHead>
                                            <TableHead className="text-right">ราคา</TableHead>
                                            <TableHead className="text-center">จำนวนครั้ง</TableHead>
                                            <TableHead>สถานะ</TableHead>
                                            <TableHead className="w-24"></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredCourses.map((c) => (
                                            <TableRow key={c.course_id}>
                                                <TableCell className="font-mono text-sm">{c.course_code}</TableCell>
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
                                <Button onClick={() => { setEditingStaff({}); setStaffDialog(true) }}>
                                    <Plus className="h-4 w-4 mr-2" />
                                    เพิ่มพนักงาน
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-lg border overflow-hidden">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-slate-50">
                                            <TableHead>ชื่อ</TableHead>
                                            <TableHead>ตำแหน่ง</TableHead>
                                            <TableHead>Username</TableHead>
                                            <TableHead>สถานะ</TableHead>
                                            <TableHead className="w-24"></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredStaffList.map((s) => (
                                            <TableRow key={s.staff_id}>
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
                                                    <div className="flex gap-1">
                                                        <Button variant="ghost" size="icon" onClick={() => { setEditingStaff(s); setStaffDialog(true) }} aria-label={`Edit ${s.full_name}`}>
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDeleteStaffId(s.staff_id)} aria-label={`Delete ${s.full_name}`}>
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
                                        {allMainUnits.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>หน่วยย่อย *</Label>
                                <Select value={editingProduct?.sub_unit || undefined} onValueChange={(v) => setEditingProduct({ ...editingProduct, sub_unit: v })}>
                                    <SelectTrigger><SelectValue placeholder="เลือกหน่วยย่อย" /></SelectTrigger>
                                    <SelectContent>
                                        {allSubUnits.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <Label>จำนวนต่อหน่วย *</Label>
                                <Input type="number" min={1} inputMode="decimal" value={editingProduct?.pack_size ?? ''} onChange={(e) => setEditingProduct({ ...editingProduct, pack_size: e.target.value === '' ? ('' as any) : parseInt(e.target.value) })} />
                            </div>
                            <div className="flex items-center gap-2 pt-6">
                                <Switch id="is-liquid" checked={editingProduct?.is_liquid || false} onCheckedChange={(v) => setEditingProduct({ ...editingProduct, is_liquid: v })} />
                                <Label htmlFor="is-liquid">เป็นของเหลว</Label>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                                <Label>ราคาทุน</Label>
                                <Input type="number" min={0} inputMode="decimal" value={editingProduct?.cost_price ?? ''} onChange={(e) => setEditingProduct({ ...editingProduct, cost_price: e.target.value === '' ? ('' as any) : parseFloat(e.target.value) })} />
                            </div>
                            <div>
                                <Label>ราคาขาย *</Label>
                                <Input type="number" min={0} inputMode="decimal" value={editingProduct?.standard_price ?? ''} onChange={(e) => setEditingProduct({ ...editingProduct, standard_price: e.target.value === '' ? ('' as any) : parseFloat(e.target.value) })} />
                            </div>
                            <div>
                                <Label>ราคาพนักงาน</Label>
                                <Input type="number" min={0} inputMode="decimal" value={editingProduct?.staff_price ?? ''} onChange={(e) => setEditingProduct({ ...editingProduct, staff_price: e.target.value === '' ? ('' as any) : parseFloat(e.target.value) })} />
                            </div>
                        </div>
                        {editingProduct?.product_id && (
                            <div className="flex items-center gap-2">
                                <Switch id="is-active-product" checked={editingProduct?.is_active ?? true} onCheckedChange={(v) => setEditingProduct({ ...editingProduct, is_active: v })} />
                                <Label htmlFor="is-active-product">เปิดใช้งาน</Label>
                            </div>
                        )}
                        <Button className="w-full" onClick={() => editingProduct && productMutation.mutate(editingProduct)} disabled={productMutation.isPending}>
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
                                <Input type="number" min={0} inputMode="decimal" value={editingCourse?.standard_price ?? ''} onChange={(e) => setEditingCourse({ ...editingCourse, standard_price: e.target.value === '' ? ('' as any) : parseFloat(e.target.value) })} />
                            </div>
                            <div>
                                <Label>ราคาพนักงาน</Label>
                                <Input type="number" min={0} inputMode="decimal" value={editingCourse?.staff_price ?? ''} onChange={(e) => setEditingCourse({ ...editingCourse, staff_price: e.target.value === '' ? ('' as any) : parseFloat(e.target.value) })} />
                            </div>
                        </div>
                        <div>
                            <Label>จำนวนครั้ง (Sessions) *</Label>
                            <Input type="number" min={1} value={editingCourse?.session_count ?? ''} onChange={(e) => setEditingCourse({ ...editingCourse, session_count: e.target.value === '' ? ('' as any) : parseInt(e.target.value) })} />
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
            <Dialog open={staffDialog} onOpenChange={setStaffDialog}>
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
                        {!editingStaff?.staff_id && (
                            <div>
                                <Label>Username *</Label>
                                <Input value={editingStaff?.username || ''} onChange={(e) => setEditingStaff({ ...editingStaff, username: e.target.value })} />
                            </div>
                        )}
                        <div>
                            <Label>{editingStaff?.staff_id ? 'รหัสผ่านใหม่ (ว่างไว้ถ้าไม่ต้องการเปลี่ยน)' : 'รหัสผ่าน *'}</Label>
                            <div className="relative">
                                <Input
                                    type={showPassword ? 'text' : 'password'}
                                    value={editingStaff?.password || ''}
                                    onChange={(e) => setEditingStaff({ ...editingStaff, password: e.target.value })}
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="absolute right-0 top-0"
                                    onClick={() => setShowPassword(!showPassword)}
                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                    title={showPassword ? "Hide password" : "Show password"}
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </Button>
                            </div>
                        </div>
                        {editingStaff?.staff_id && (
                            <div className="flex items-center gap-2">
                                <Switch id="is-active-staff" checked={editingStaff?.is_active ?? true} onCheckedChange={(v) => setEditingStaff({ ...editingStaff, is_active: v })} />
                                <Label htmlFor="is-active-staff">เปิดใช้งาน</Label>
                            </div>
                        )}
                        <Button className="w-full" onClick={() => editingStaff && staffMutation.mutate(editingStaff)} disabled={staffMutation.isPending}>
                            <Save className="h-4 w-4 mr-2" />
                            {staffMutation.isPending ? 'กำลังบันทึก...' : 'บันทึก'}
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
