'use client'

import { useState, useEffect } from 'react'
import {
    ClipboardCheck, Search, User, Package, Plus, Check,
    Calendar, Clock, UserCog, Stethoscope, ArrowLeft
} from 'lucide-react'
import { toast } from 'sonner'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { formatCurrency } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
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

interface Customer {
    customer_id: number
    hn_code: string
    full_name: string
}

interface CustomerCourse {
    id: number
    course_id: number
    total_sessions: number
    remaining_sessions: number
    status: string
    purchase_date: string
    expiry_date: string
    course: {
        course_id: number
        course_name: string
        session_count: number
    }
}

interface Staff {
    staff_id: number
    full_name: string
    position: string
}

interface ServiceUsage {
    usage_id: number
    service_date: string
    service_name: string
    customer: {
        full_name: string
        hn_code: string
    }
    customer_course?: {
        course: {
            course_name: string
        }
    }
    fee_log: Array<{
        amount: number
        fee_type: string
        staff: {
            full_name: string
            position: string
        }
    }>
}

interface CommissionRate {
    id: number
    category: string
    item_name: string
    rate_amount: number
    position_type: string | null
}

interface CustomerWithCourses {
    customer_id: number
    hn_code: string
    full_name: string
    phone_number: string
    courses: Array<{
        id: number
        course_name: string
        remaining_sessions: number
        total_sessions: number
    }>
}

export default function ServicePage() {
    const queryClient = useQueryClient()
    const [customerSearch, setCustomerSearch] = useState('')
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
    const [selectedCourse, setSelectedCourse] = useState<CustomerCourse | null>(null)
    const [showServiceDialog, setShowServiceDialog] = useState(false)

    // Form state
    const [formData, setFormData] = useState({
        doctor_id: '',
        therapist_id: '',
        doctor_fee: 0,
        therapist_fee: 0,
        note: '',
    })

    // Search customers
    const { data: customers = [] } = useQuery<Customer[]>({
        queryKey: ['customers-search', customerSearch],
        queryFn: async () => {
            if (!customerSearch || customerSearch.length < 2) return []
            const res = await fetch(`/api/customers?search=${encodeURIComponent(customerSearch)}`)
            const json = await res.json()
            // API returns { data: [...], meta: {...} }
            return Array.isArray(json) ? json : (json.data || [])
        },
        enabled: customerSearch.length >= 2,
    })

    // Get customer courses
    const { data: customerCourses = [] } = useQuery<CustomerCourse[]>({
        queryKey: ['customer-courses', selectedCustomer?.customer_id],
        queryFn: async () => {
            if (!selectedCustomer) return []
            const res = await fetch(`/api/customers/${selectedCustomer.customer_id}/courses?status=ACTIVE`)
            const data = await res.json()
            return Array.isArray(data) ? data : []
        },
        enabled: !!selectedCustomer,
    })

    // Get staff list
    const { data: staffList = [] } = useQuery<Staff[]>({
        queryKey: ['staff-list'],
        queryFn: async () => {
            const res = await fetch('/api/staff')
            return res.json()
        },
    })

    // Get commission rates
    const { data: commissionData } = useQuery<{ rates: CommissionRate[] }>({
        queryKey: ['commission-rates'],
        queryFn: async () => {
            const res = await fetch('/api/commission-rates')
            return res.json()
        },
    })

    // Get recent service usages
    const { data: recentUsages = [] } = useQuery<ServiceUsage[]>({
        queryKey: ['recent-service-usage'],
        queryFn: async () => {
            const res = await fetch('/api/service-usage?limit=20')
            const data = await res.json()
            return Array.isArray(data) ? data : []
        },
    })

    // Get customers with active courses (show on load)
    const { data: customersWithCourses = [] } = useQuery<CustomerWithCourses[]>({
        queryKey: ['customers-with-courses'],
        queryFn: async () => {
            const res = await fetch('/api/customers/with-courses')
            const data = await res.json()
            return Array.isArray(data) ? data : []
        },
    })

    // Create service usage
    const createUsage = useMutation({
        mutationFn: async (data: {
            customer_id: number
            customer_course_id: number
            service_name: string
            doctor_id?: number
            therapist_id?: number
            doctor_fee?: number
            therapist_fee?: number
            note?: string
        }) => {
            const res = await fetch('/api/service-usage', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            })
            if (!res.ok) {
                const err = await res.json()
                throw new Error(err.error || 'Failed to create')
            }
            return res.json()
        },
        onSuccess: (data: { session_number?: number; total_sessions?: number; service_name?: string }) => {
            queryClient.invalidateQueries({ queryKey: ['customer-courses'] })
            queryClient.invalidateQueries({ queryKey: ['recent-service-usage'] })
            queryClient.invalidateQueries({ queryKey: ['customers-with-courses'] })
            queryClient.invalidateQueries({ queryKey: ['pending-services'] }) // For /inventory/usage page

            // Show session number in success message
            if (data.session_number && data.total_sessions) {
                toast.success(
                    `บันทึกการรับบริการสำเร็จ - ครั้งที่ ${data.session_number}/${data.total_sessions}`,
                    { description: data.service_name || '' }
                )
            } else {
                toast.success('บันทึกการรับบริการสำเร็จ')
            }
            handleCloseDialog()
        },
        onError: (err: Error) => {
            toast.error(err.message || 'เกิดข้อผิดพลาด')
        },
    })

    const handleSelectCustomer = (customer: Customer) => {
        setSelectedCustomer(customer)
        setCustomerSearch('')
    }

    // Auto-lookup commission rates when selecting a course
    const handleSelectCourse = (course: CustomerCourse) => {
        setSelectedCourse(course)

        // Find matching commission rates for this course
        const rates = commissionData?.rates || []
        const courseName = course.course.course_name.toLowerCase()

        // Find DF rate for doctor (TREATMENT_COVER category)
        const dfRate = rates.find(r =>
            courseName.includes(r.item_name.toLowerCase()) ||
            r.item_name.toLowerCase().includes(courseName.split(' ')[0])
        )

        // Find HAND_FEE rate for therapist
        const handFeeRate = rates.find(r =>
            r.category === 'STAFF_ASSIST' &&
            (courseName.includes(r.item_name.toLowerCase()) ||
                r.item_name.toLowerCase().includes(courseName.split(' ')[0]))
        )

        setFormData({
            doctor_id: '',
            therapist_id: '',
            doctor_fee: dfRate ? Number(dfRate.rate_amount) : 0,
            therapist_fee: handFeeRate ? Number(handFeeRate.rate_amount) : 0,
            note: '',
        })

        setShowServiceDialog(true)
    }

    const handleCloseDialog = () => {
        setShowServiceDialog(false)
        setSelectedCourse(null)
        setFormData({
            doctor_id: '',
            therapist_id: '',
            doctor_fee: 0,
            therapist_fee: 0,
            note: '',
        })
    }

    const handleSubmitService = () => {
        if (!selectedCustomer || !selectedCourse) return

        createUsage.mutate({
            customer_id: selectedCustomer.customer_id,
            customer_course_id: selectedCourse.id,
            service_name: selectedCourse.course.course_name,
            doctor_id: formData.doctor_id ? parseInt(formData.doctor_id) : undefined,
            therapist_id: formData.therapist_id ? parseInt(formData.therapist_id) : undefined,
            doctor_fee: formData.doctor_fee || undefined,
            therapist_fee: formData.therapist_fee || undefined,
            note: formData.note || undefined,
        })
    }

    const doctors = staffList.filter(s => s.position === 'Doctor')
    const therapists = staffList.filter(s => s.position === 'Therapist' || s.position === 'Admin')

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => window.history.back()}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <ClipboardCheck className="h-6 w-6 text-primary" />
                        บันทึกการรับบริการ
                    </h1>
                    <p className="text-muted-foreground">บันทึกเมื่อลูกค้ามาใช้คอร์สที่ซื้อไว้</p>
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                {/* Left: Customer & Course Selection */}
                <div className="space-y-4">
                    {/* Customer Search */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <User className="h-5 w-5" />
                                ค้นหาลูกค้า
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="ค้นหาชื่อ, HN, เบอร์โทร..."
                                    value={customerSearch}
                                    onChange={(e) => setCustomerSearch(e.target.value)}
                                    className="pl-10"
                                />
                            </div>

                            {customers.length > 0 && (
                                <div className="mt-2 border rounded-lg divide-y">
                                    {customers.slice(0, 5).map((c) => (
                                        <div
                                            key={c.customer_id}
                                            className="p-3 hover:bg-muted cursor-pointer"
                                            onClick={() => handleSelectCustomer(c)}
                                        >
                                            <p className="font-medium">{c.full_name}</p>
                                            <p className="text-sm text-slate-500">HN: {c.hn_code}</p>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {selectedCustomer && (
                                <div className="mt-4 p-4 bg-primary/10 rounded-lg">
                                    <p className="text-sm text-primary">ลูกค้าที่เลือก:</p>
                                    <p className="font-bold text-lg">{selectedCustomer.full_name}</p>
                                    <p className="text-sm text-muted-foreground">HN: {selectedCustomer.hn_code}</p>
                                </div>
                            )}

                            {/* Quick select: Customers with active courses */}
                            {!selectedCustomer && customersWithCourses.length > 0 && (
                                <div className="mt-4">
                                    <p className="text-sm font-medium text-slate-700 mb-2">ลูกค้าที่มีคอร์สคงเหลือ:</p>
                                    <div className="border rounded-lg divide-y max-h-60 overflow-y-auto">
                                        {customersWithCourses.slice(0, 10).map((cwc) => (
                                            <div
                                                key={cwc.customer_id}
                                                className="p-3 hover:bg-primary/5 cursor-pointer"
                                                onClick={() => handleSelectCustomer({
                                                    customer_id: cwc.customer_id,
                                                    hn_code: cwc.hn_code,
                                                    full_name: cwc.full_name,
                                                })}
                                            >
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <p className="font-medium">{cwc.full_name}</p>
                                                        <p className="text-sm text-slate-500">HN: {cwc.hn_code}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        {cwc.courses.slice(0, 2).map((c) => (
                                                            <Badge key={c.id} variant="outline" className="text-xs ml-1">
                                                                {c.course_name} ({c.remaining_sessions})
                                                            </Badge>
                                                        ))}
                                                        {cwc.courses.length > 2 && (
                                                            <span className="text-xs text-slate-400 ml-1">+{cwc.courses.length - 2}</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Customer Courses */}
                    {selectedCustomer && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Package className="h-5 w-5" />
                                    คอร์สที่มี ({customerCourses.length})
                                </CardTitle>
                                <CardDescription>
                                    เลือกคอร์สที่ต้องการใช้บริการ
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {customerCourses.length === 0 ? (
                                    <p className="text-muted-foreground text-center py-4">
                                        ไม่มีคอร์สที่ใช้ได้
                                    </p>
                                ) : (
                                    <div className="space-y-3">
                                        {customerCourses.map((cc) => (
                                            <div
                                                key={cc.id}
                                                className="p-4 border rounded-lg hover:border-accent hover:bg-accent/5 cursor-pointer transition-all"
                                                onClick={() => handleSelectCourse(cc)}
                                            >
                                                <div className="flex items-start justify-between">
                                                    <div>
                                                        <h4 className="font-semibold">{cc.course.course_name}</h4>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <Badge variant={cc.remaining_sessions > 0 ? 'default' : 'secondary'}>
                                                                เหลือ {cc.remaining_sessions}/{cc.total_sessions} ครั้ง
                                                            </Badge>
                                                            <span className="text-xs text-muted-foreground">
                                                                ซื้อ: {new Date(cc.purchase_date).toLocaleDateString('th-TH')}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <Button size="sm" disabled={cc.remaining_sessions <= 0} variant="outline" className="border-primary text-primary hover:bg-primary hover:text-white">
                                                        <Plus className="h-4 w-4 mr-1" />
                                                        ใช้บริการ
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Right: Recent Usage History */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Clock className="h-5 w-5" />
                            รายการล่าสุด
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>วันที่</TableHead>
                                    <TableHead>ลูกค้า</TableHead>
                                    <TableHead>บริการ</TableHead>
                                    <TableHead className="text-right">ค่ามือ</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {recentUsages.map((usage) => (
                                    <TableRow key={usage.usage_id}>
                                        <TableCell className="text-sm">
                                            {new Date(usage.service_date).toLocaleDateString('th-TH')}
                                        </TableCell>
                                        <TableCell>
                                            <p className="font-medium">{usage.customer?.full_name}</p>
                                            <p className="text-xs text-slate-500">{usage.customer?.hn_code}</p>
                                        </TableCell>
                                        <TableCell>{usage.service_name}</TableCell>
                                        <TableCell className="text-right">
                                            {usage.fee_log?.reduce((sum, f) => sum + Number(f.amount), 0).toLocaleString() || 0}
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {recentUsages.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center text-slate-500">
                                            ยังไม่มีข้อมูล
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>

            {/* Service Dialog */}
            <Dialog open={showServiceDialog} onOpenChange={setShowServiceDialog}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>บันทึกการรับบริการ</DialogTitle>
                        <DialogDescription>
                            {selectedCourse?.course.course_name} - {selectedCustomer?.full_name}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        {/* Session info */}
                        <div className="p-3 bg-primary/10 rounded-lg">
                            <p className="text-sm text-primary">
                                ครั้งที่ใช้: {selectedCourse ? selectedCourse.total_sessions - selectedCourse.remaining_sessions + 1 : 0} / {selectedCourse?.total_sessions}
                            </p>
                            <p className="text-sm text-muted-foreground">
                                หลังบันทึกจะเหลือ: {selectedCourse ? selectedCourse.remaining_sessions - 1 : 0} ครั้ง
                            </p>
                        </div>

                        {/* Doctor */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="flex items-center gap-1">
                                    <Stethoscope className="h-4 w-4" />
                                    หมอ
                                </Label>
                                <Select
                                    value={formData.doctor_id}
                                    onValueChange={(v) => setFormData({ ...formData, doctor_id: v })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="เลือกหมอ" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {doctors.map((d) => (
                                            <SelectItem key={d.staff_id} value={d.staff_id.toString()}>
                                                {d.full_name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>ค่า DF (บาท)</Label>
                                <Input
                                    type="number"
                                    value={formData.doctor_fee || ''}
                                    onChange={(e) => setFormData({ ...formData, doctor_fee: Number(e.target.value) })}
                                    placeholder="0"
                                />
                            </div>
                        </div>

                        {/* Therapist */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="flex items-center gap-1">
                                    <UserCog className="h-4 w-4" />
                                    ผู้ช่วย
                                </Label>
                                <Select
                                    value={formData.therapist_id}
                                    onValueChange={(v) => setFormData({ ...formData, therapist_id: v })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="เลือกผู้ช่วย" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {therapists.map((t) => (
                                            <SelectItem key={t.staff_id} value={t.staff_id.toString()}>
                                                {t.full_name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>ค่ามือ (บาท)</Label>
                                <Input
                                    type="number"
                                    value={formData.therapist_fee || ''}
                                    onChange={(e) => setFormData({ ...formData, therapist_fee: Number(e.target.value) })}
                                    placeholder="0"
                                />
                            </div>
                        </div>

                        {/* Note */}
                        <div className="space-y-2">
                            <Label>หมายเหตุ</Label>
                            <Textarea
                                value={formData.note}
                                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                                placeholder="เช่น ตำแหน่งที่ทำ, สภาพผิว..."
                                rows={2}
                            />
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 justify-end pt-4">
                            <Button variant="outline" onClick={handleCloseDialog}>
                                ยกเลิก
                            </Button>
                            <Button
                                onClick={handleSubmitService}
                                disabled={createUsage.isPending}
                                className="bg-green-600 hover:bg-green-700 text-white"
                            >
                                <Check className="h-4 w-4 mr-2" />
                                {createUsage.isPending ? 'กำลังบันทึก...' : 'บันทึกการรับบริการ'}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
