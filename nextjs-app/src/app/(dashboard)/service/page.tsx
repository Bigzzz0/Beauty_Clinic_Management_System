'use client'

import { useState } from 'react'
import {
    ClipboardCheck, Search, User, Package, Plus, Check,
    Calendar, Clock, UserCog, Stethoscope, ArrowLeft, ExternalLink, ChevronDown
} from 'lucide-react'
import { toast } from 'sonner'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { cn, formatCurrency } from '@/lib/utils'
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
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'

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
    fee_type?: 'DF' | 'HAND_FEE' | null
    course_id?: number | null
    is_active?: boolean
    course?: {
        course_id: number
        course_name: string
        course_code?: string | null
    } | null
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
    const [showRatesDialog, setShowRatesDialog] = useState(false)
    const [doctorSearchText, setDoctorSearchText] = useState('')
    const [therapistSearchText, setTherapistSearchText] = useState('')

    // Form state
    const [formData, setFormData] = useState({
        doctor_ids: [] as string[],
        therapist_ids: [] as string[],
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
            doctor_ids?: number[]
            therapist_ids?: number[]
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

        // Prefer explicit course-linked rates (course_id + fee_type) for reliable auto fee
        const rates = (commissionData?.rates || []).filter((rate) => rate.is_active !== false)
        const courseId = course.course.course_id
        const courseLinkedRates = rates.filter((rate) => rate.course_id === courseId)

        const resolveLinkedFee = (
            feeType: 'DF' | 'HAND_FEE',
            preferredPosition: 'Doctor' | 'Therapist'
        ) => {
            const candidates = courseLinkedRates.filter((rate) => rate.fee_type === feeType)
            const exactByPosition = candidates.find((rate) => rate.position_type === preferredPosition)
            if (exactByPosition) return Number(exactByPosition.rate_amount)

            const allPositions = candidates.find((rate) => !rate.position_type)
            if (allPositions) return Number(allPositions.rate_amount)

            return candidates.length > 0 ? Number(candidates[0].rate_amount) : null
        }

        const linkedDoctorFee = resolveLinkedFee('DF', 'Doctor')
        const linkedTherapistFee = resolveLinkedFee('HAND_FEE', 'Therapist')

        // Backward compatibility for older rate records that are still text-matched
        const courseName = course.course.course_name.toLowerCase()
        const legacyDfRate = rates.find((rate) =>
            !rate.course_id && (
                courseName.includes(rate.item_name.toLowerCase()) ||
                rate.item_name.toLowerCase().includes(courseName.split(' ')[0])
            )
        )

        const legacyHandFeeRate = rates.find((rate) =>
            !rate.course_id &&
            rate.category === 'STAFF_ASSIST' &&
            (courseName.includes(rate.item_name.toLowerCase()) ||
                rate.item_name.toLowerCase().includes(courseName.split(' ')[0]))
        )

        setDoctorSearchText('')
        setTherapistSearchText('')
        setFormData({
            doctor_ids: [],
            therapist_ids: [],
            doctor_fee: linkedDoctorFee ?? (legacyDfRate ? Number(legacyDfRate.rate_amount) : 0),
            therapist_fee: linkedTherapistFee ?? (legacyHandFeeRate ? Number(legacyHandFeeRate.rate_amount) : 0),
            note: '',
        })

        setShowServiceDialog(true)
    }

    const handleCloseDialog = () => {
        setShowServiceDialog(false)
        setSelectedCourse(null)
        setDoctorSearchText('')
        setTherapistSearchText('')
        setFormData({
            doctor_ids: [],
            therapist_ids: [],
            doctor_fee: 0,
            therapist_fee: 0,
            note: '',
        })
    }

    const handleSubmitService = () => {
        if (!selectedCustomer || !selectedCourse) return

        const doctorIds = formData.doctor_ids
            .map((id) => parseInt(id, 10))
            .filter((id) => Number.isInteger(id) && id > 0)

        const therapistIds = formData.therapist_ids
            .map((id) => parseInt(id, 10))
            .filter((id) => Number.isInteger(id) && id > 0)

        createUsage.mutate({
            customer_id: selectedCustomer.customer_id,
            customer_course_id: selectedCourse.id,
            service_name: selectedCourse.course.course_name,
            doctor_ids: doctorIds.length > 0 ? doctorIds : undefined,
            therapist_ids: therapistIds.length > 0 ? therapistIds : undefined,
            doctor_fee: formData.doctor_fee || undefined,
            therapist_fee: formData.therapist_fee || undefined,
            note: formData.note || undefined,
        })
    }

    const toggleStaffSelection = (field: 'doctor_ids' | 'therapist_ids', staffId: string) => {
        setFormData((prev) => {
            const currentIds = prev[field]
            const exists = currentIds.includes(staffId)
            return {
                ...prev,
                [field]: exists
                    ? currentIds.filter((id) => id !== staffId)
                    : [...currentIds, staffId],
            }
        })
    }

    const removeStaffSelection = (field: 'doctor_ids' | 'therapist_ids', staffId: string) => {
        setFormData((prev) => ({
            ...prev,
            [field]: prev[field].filter((id) => id !== staffId),
        }))
    }

    const doctors = staffList.filter(s => s.position === 'Doctor')
    const therapists = staffList.filter(s => s.position === 'Therapist' || s.position === 'Admin')
    const selectedDoctors = doctors.filter((d) => formData.doctor_ids.includes(d.staff_id.toString()))
    const selectedTherapists = therapists.filter((t) => formData.therapist_ids.includes(t.staff_id.toString()))

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
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
                                    aria-label="ค้นหาลูกค้า"
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
                                                <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-2 w-full min-w-0">
                                                    <div className="min-w-0 flex-1">
                                                        <p className="font-medium truncate">{cwc.full_name}</p>
                                                        <p className="text-sm text-slate-500">HN: {cwc.hn_code}</p>
                                                    </div>
                                                    <div className="text-left md:text-right flex flex-wrap gap-1 shrink-0">
                                                        {cwc.courses.slice(0, 2).map((c) => (
                                                            <Badge key={c.id} variant="outline" className="text-xs truncate max-w-[150px] md:max-w-[200px]">
                                                                {c.course_name} ({c.remaining_sessions})
                                                            </Badge>
                                                        ))}
                                                        {cwc.courses.length > 2 && (
                                                            <span className="text-xs text-slate-400 self-center">+{cwc.courses.length - 2}</span>
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

                    {/* Customer Courses Card */}
                    {selectedCustomer && (
                        <Card className="mt-6 border-primary/20 shadow-md animate-in fade-in slide-in-from-top-2 duration-300">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Package className="h-5 w-5 text-primary" />
                                    ข้อมูลลูกค้าและคอร์สที่เลือก
                                </CardTitle>
                                <CardDescription>
                                    HN: {selectedCustomer.hn_code} | คุณ {selectedCustomer.full_name}
                                </CardDescription>
                            </CardHeader>

                            <CardContent className="space-y-6">
                                <div>
                                    <p className="text-sm font-medium text-slate-700 mb-2">สลับเลือกลูกค้าคนอื่นที่มีคอร์สคงเหลือ:</p>
                                    <div className="border rounded-lg divide-y max-h-48 overflow-y-auto bg-slate-50/50">
                                        {customersWithCourses.slice(0, 10).map((cwc) => (
                                            <div
                                                key={cwc.customer_id}
                                                className={cn(
                                                    "p-3 hover:bg-primary/5 cursor-pointer flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 transition-colors",
                                                    selectedCustomer.customer_id === cwc.customer_id ? "bg-white border-l-4 border-primary" : "bg-white"
                                                )}
                                                onClick={() => handleSelectCustomer({
                                                    customer_id: cwc.customer_id,
                                                    hn_code: cwc.hn_code,
                                                    full_name: cwc.full_name,
                                                })}
                                            >
                                                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2 w-full min-w-0">
                                                    <div className="min-w-0 flex-1">
                                                        <p className="font-medium text-sm truncate">{cwc.full_name}</p>
                                                        <p className="text-xs text-slate-500">HN: {cwc.hn_code}</p>
                                                    </div>
                                                    <div className="text-left md:text-right flex flex-wrap md:justify-end gap-1 shrink-0">
                                                        {cwc.courses.slice(0, 2).map((c) => (
                                                            <Badge key={c.id} variant="outline" className="text-[10px] truncate max-w-[150px] md:max-w-[200px]">
                                                                {c.course_name} ({c.remaining_sessions})
                                                            </Badge>
                                                        ))}
                                                        {cwc.courses.length > 2 && (
                                                            <span className="text-[10px] text-slate-400 self-center">+{cwc.courses.length - 2}</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <hr className="border-slate-100" />

                                <div>
                                    <p className="text-sm font-medium text-slate-700 mb-3">คอร์สที่พร้อมใช้งาน ({customerCourses.length}):</p>
                                    {customerCourses.length === 0 ? (
                                        <p className="text-muted-foreground text-center py-4 border border-dashed rounded-lg text-sm">
                                            ไม่มีคอร์สที่ใช้ได้
                                        </p>
                                    ) : (
                                        <div className="space-y-3">
                                            {customerCourses.map((cc) => (
                                                <div
                                                    key={cc.id}
                                                    className="p-4 border rounded-lg hover:border-primary hover:bg-primary/5 cursor-pointer transition-all group"
                                                    onClick={() => handleSelectCourse(cc)}
                                                >
                                                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                                                        <div className="min-w-0">
                                                            <h4 className="font-semibold group-hover:text-primary transition-colors text-sm sm:text-base">
                                                                {cc.course.course_name}
                                                            </h4>
                                                            <div className="flex flex-wrap items-center gap-2 mt-1">
                                                                <Badge variant={cc.remaining_sessions > 0 ? 'default' : 'secondary'} className="text-xs">
                                                                    เหลือ {cc.remaining_sessions}/{cc.total_sessions} ครั้ง
                                                                </Badge>
                                                                <span className="text-xs text-muted-foreground whitespace-nowrap">
                                                                    ซื้อ: {new Date(cc.purchase_date).toLocaleDateString('th-TH')}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <Button
                                                            size="sm"
                                                            disabled={cc.remaining_sessions <= 0}
                                                            variant="outline"
                                                            className="border-primary text-primary hover:bg-primary hover:text-white shadow-sm w-full sm:w-auto"
                                                        >
                                                            <Plus className="h-4 w-4 mr-1" />
                                                            ใช้บริการ
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
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
                    <CardContent className="p-0 sm:p-6 overflow-hidden">
                        <div className="overflow-x-auto">
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
                                            <TableCell>
                                                <p className="font-medium">{usage.service_name}</p>
                                                <div className="flex flex-col gap-0.5 mt-1 text-[11px] text-muted-foreground">
                                                    {usage.fee_log?.filter((f) => f.fee_type === 'DF').map((f) => f.staff?.full_name).filter(Boolean).length > 0 && (
                                                        <span className="flex items-center gap-1"><Stethoscope className="h-3 w-3 shrink-0 text-slate-400" /> แพทย์: {usage.fee_log.filter((f) => f.fee_type === 'DF').map((f) => f.staff?.full_name).filter(Boolean).join(', ')}</span>
                                                    )}
                                                    {usage.fee_log?.filter((f) => f.fee_type === 'HAND_FEE').map((f) => f.staff?.full_name).filter(Boolean).length > 0 && (
                                                        <span className="flex items-center gap-1"><UserCog className="h-3 w-3 shrink-0 text-slate-400" /> ผู้ช่วย: {usage.fee_log.filter((f) => f.fee_type === 'HAND_FEE').map((f) => f.staff?.full_name).filter(Boolean).join(', ')}</span>
                                                    )}
                                                </div>
                                            </TableCell>
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
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Service Dialog */}
            <Dialog open={showServiceDialog} onOpenChange={setShowServiceDialog}>
                <DialogContent className="w-[95vw] sm:max-w-lg rounded-xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
                    <DialogHeader>
                        <DialogTitle>บันทึกการรับบริการ</DialogTitle>
                        <DialogDescription>
                            {selectedCourse?.course.course_name} - {selectedCustomer?.full_name}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="p-3 bg-primary/10 rounded-lg">
                            <p className="text-sm text-primary">
                                ครั้งที่ใช้: {selectedCourse ? selectedCourse.total_sessions - selectedCourse.remaining_sessions + 1 : 0} / {selectedCourse?.total_sessions}
                            </p>
                            <p className="text-sm text-muted-foreground">
                                หลังบันทึกจะเหลือ: {selectedCourse ? selectedCourse.remaining_sessions - 1 : 0} ครั้ง
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2 flex flex-col">
                                <Label className="flex items-center gap-1 mb-1">
                                    <Stethoscope className="h-4 w-4" />
                                    หมอ (เลือกได้หลายคน)
                                </Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            className="w-full justify-between font-normal text-left text-sm"
                                        >
                                            <span className="truncate">
                                                {selectedDoctors.length > 0
                                                    ? `เลือกแล้ว ${selectedDoctors.length} คน`
                                                    : "เลือกหมอ..."}
                                            </span>
                                            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-64 p-2" align="start">
                                        <div className="space-y-2">
                                            <Input
                                                placeholder="ค้นหาหมอ..."
                                                value={doctorSearchText}
                                                onChange={(e) => setDoctorSearchText(e.target.value)}
                                                className="h-8 text-xs"
                                            />
                                            <div className="max-h-48 overflow-y-auto space-y-1">
                                                {doctors
                                                    .filter((d) =>
                                                        d.full_name.toLowerCase().includes(doctorSearchText.toLowerCase())
                                                    )
                                                    .map((d) => {
                                                        const isSelected = formData.doctor_ids.includes(d.staff_id.toString())
                                                        return (
                                                            <button
                                                                key={d.staff_id}
                                                                type="button"
                                                                onClick={() => toggleStaffSelection('doctor_ids', d.staff_id.toString())}
                                                                className={cn(
                                                                    "flex items-center justify-between w-full px-2 py-1.5 text-xs rounded-sm transition-colors text-left hover:bg-slate-100",
                                                                    isSelected && "bg-slate-50 font-medium text-primary"
                                                                )}
                                                            >
                                                                <span>{d.full_name}</span>
                                                                {isSelected && <Check className="h-3 w-3 text-primary" />}
                                                            </button>
                                                        )
                                                    })}
                                                {doctors.filter((d) =>
                                                    d.full_name.toLowerCase().includes(doctorSearchText.toLowerCase())
                                                ).length === 0 && (
                                                    <p className="text-center py-2 text-xs text-muted-foreground">ไม่พบข้อมูลหมอ</p>
                                                )}
                                            </div>
                                        </div>
                                    </PopoverContent>
                                </Popover>
                                <div className="flex flex-wrap gap-1 mt-1.5">
                                    {selectedDoctors.length > 0 ? (
                                        selectedDoctors.map((doctor) => (
                                            <Badge key={doctor.staff_id} variant="secondary" className="pr-1 text-xs">
                                                {doctor.full_name}
                                                <button
                                                    type="button"
                                                    className="ml-1 text-[10px] leading-none text-muted-foreground hover:text-foreground"
                                                    onClick={() => removeStaffSelection('doctor_ids', doctor.staff_id.toString())}
                                                    aria-label={`ลบหมอ ${doctor.full_name}`}
                                                >
                                                    x
                                                </button>
                                            </Badge>
                                        ))
                                    ) : (
                                        <p className="text-xs text-muted-foreground">ยังไม่ได้เลือกหมอ</p>
                                    )}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <Label htmlFor="doctor-fee">ค่า DF (บาท)</Label>
                                    <Button type="button" variant="link" className="h-0 p-0 text-xs text-amber-600 hover:text-amber-700" onClick={() => setShowRatesDialog(true)}>
                                        <ExternalLink className="h-3 w-3 mr-1" />
                                        เทียบเรทค่ามือ
                                    </Button>
                                </div>
                                <Input
                                    id="doctor-fee"
                                    type="number"
                                    min={0}
                                    value={formData.doctor_fee || ''}
                                    onChange={(e) => setFormData({ ...formData, doctor_fee: Number(e.target.value) })}
                                    placeholder="0"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2 flex flex-col">
                                <Label className="flex items-center gap-1 mb-1">
                                    <UserCog className="h-4 w-4" />
                                    ผู้ช่วย (เลือกได้หลายคน)
                                </Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            className="w-full justify-between font-normal text-left text-sm"
                                        >
                                            <span className="truncate">
                                                {selectedTherapists.length > 0
                                                    ? `เลือกแล้ว ${selectedTherapists.length} คน`
                                                    : "เลือกผู้ช่วย..."}
                                            </span>
                                            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-64 p-2" align="start">
                                        <div className="space-y-2">
                                            <Input
                                                placeholder="ค้นหาผู้ช่วย..."
                                                value={therapistSearchText}
                                                onChange={(e) => setTherapistSearchText(e.target.value)}
                                                className="h-8 text-xs"
                                            />
                                            <div className="max-h-48 overflow-y-auto space-y-1">
                                                {therapists
                                                    .filter((t) =>
                                                        t.full_name.toLowerCase().includes(therapistSearchText.toLowerCase())
                                                    )
                                                    .map((t) => {
                                                        const isSelected = formData.therapist_ids.includes(t.staff_id.toString())
                                                        return (
                                                            <button
                                                                key={t.staff_id}
                                                                type="button"
                                                                onClick={() => toggleStaffSelection('therapist_ids', t.staff_id.toString())}
                                                                className={cn(
                                                                    "flex items-center justify-between w-full px-2 py-1.5 text-xs rounded-sm transition-colors text-left hover:bg-slate-100",
                                                                    isSelected && "bg-slate-50 font-medium text-primary"
                                                                )}
                                                            >
                                                                <span>{t.full_name}</span>
                                                                {isSelected && <Check className="h-3 w-3 text-primary" />}
                                                            </button>
                                                        )
                                                    })}
                                                {therapists.filter((t) =>
                                                    t.full_name.toLowerCase().includes(therapistSearchText.toLowerCase())
                                                ).length === 0 && (
                                                    <p className="text-center py-2 text-xs text-muted-foreground">ไม่พบข้อมูลผู้ช่วย</p>
                                                )}
                                            </div>
                                        </div>
                                    </PopoverContent>
                                </Popover>
                                <div className="flex flex-wrap gap-1 mt-1.5">
                                    {selectedTherapists.length > 0 ? (
                                        selectedTherapists.map((therapist) => (
                                            <Badge key={therapist.staff_id} variant="secondary" className="pr-1 text-xs">
                                                {therapist.full_name}
                                                <button
                                                    type="button"
                                                    className="ml-1 text-[10px] leading-none text-muted-foreground hover:text-foreground"
                                                    onClick={() => removeStaffSelection('therapist_ids', therapist.staff_id.toString())}
                                                    aria-label={`ลบผู้ช่วย ${therapist.full_name}`}
                                                >
                                                    x
                                                </button>
                                            </Badge>
                                        ))
                                    ) : (
                                        <p className="text-xs text-muted-foreground">ยังไม่ได้เลือกผู้ช่วย</p>
                                    )}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <Label htmlFor="therapist-fee">ค่ามือ (บาท)</Label>
                                    <Button type="button" variant="link" className="h-0 p-0 text-xs text-amber-600 hover:text-amber-700" onClick={() => setShowRatesDialog(true)}>
                                        <ExternalLink className="h-3 w-3 mr-1" />
                                        เทียบเรทค่ามือ
                                    </Button>
                                </div>
                                <Input
                                    id="therapist-fee"
                                    type="number"
                                    min={0}
                                    value={formData.therapist_fee || ''}
                                    onChange={(e) => setFormData({ ...formData, therapist_fee: Number(e.target.value) })}
                                    placeholder="0"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="service-note">หมายเหตุ</Label>
                            <Textarea
                                id="service-note"
                                value={formData.note}
                                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                                placeholder="เช่น ตำแหน่งที่ทำ, สภาพผิว..."
                                rows={2}
                            />
                        </div>

                        <div className="flex gap-2 justify-end pt-4">
                            <Button variant="outline" onClick={handleCloseDialog}>
                                ยกเลิก
                            </Button>
                            <Button
                                onClick={handleSubmitService}
                                disabled={createUsage.isPending}
                                aria-busy={createUsage.isPending}
                                className="bg-green-600 hover:bg-green-700 text-white"
                            >
                                <Check className="h-4 w-4 mr-2" />
                                {createUsage.isPending ? 'กำลังบันทึก...' : 'บันทึกการรับบริการ'}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Rates Reference Dialog */}
            <Dialog open={showRatesDialog} onOpenChange={setShowRatesDialog}>
                <DialogContent className="max-w-xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>ฐานข้อมูลเรทค่ามือ</DialogTitle>
                        <DialogDescription>
                            ใช้อ้างอิงสำหรับการกรอกค่าตอบแทนแพทย์และผู้ช่วย
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                        {commissionData?.rates ? (
                            <div className="grid gap-6">
                                {['Doctor', 'Therapist'].map(positionType => {
                                    const rates = commissionData.rates.filter((r: any) => {
                                        if (r.is_active === false) return false

                                        if (positionType === 'Doctor') {
                                            return r.fee_type === 'DF' || (!r.fee_type && r.position_type === 'Doctor')
                                        }

                                        return r.fee_type === 'HAND_FEE' || (!r.fee_type && r.position_type === 'Therapist')
                                    })
                                    if (rates.length === 0) return null

                                    return (
                                        <div key={positionType} className="space-y-2">
                                            <h4 className="font-semibold text-lg text-primary border-b pb-1">
                                                {positionType === 'Doctor' ? 'แพทย์ (DF)' : 'ผู้ช่วย (Therapist)'}
                                            </h4>
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>รายการ</TableHead>
                                                        <TableHead>คอร์สที่ผูก</TableHead>
                                                        <TableHead className="text-right w-32">เรท (บาท)</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {rates.map((rate: any) => (
                                                        <TableRow key={rate.id}>
                                                            <TableCell className="font-medium">{rate.item_name}</TableCell>
                                                            <TableCell>{rate.course?.course_name || '-'}</TableCell>
                                                            <TableCell className="text-right text-amber-600 font-medium">
                                                                {formatCurrency(Number(rate.rate_amount) || 0)}
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    )
                                })}
                            </div>
                        ) : (
                            <p className="text-muted-foreground text-center py-4">กำลังโหลดข้อมูล...</p>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
