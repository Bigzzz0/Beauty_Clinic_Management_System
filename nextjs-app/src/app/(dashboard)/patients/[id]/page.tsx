'use client'

import { useState, use } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
    User, ArrowLeft, Edit, Save, X, AlertTriangle,
    Phone, MapPin, Calendar, Cake, Users2,
    Clock, Syringe, Camera, Upload, Plus, Trash2, ShieldCheck,
    Wallet, ArrowUpRight, ArrowDownLeft, RefreshCcw
} from 'lucide-react'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/auth-store'
import { formatDate, formatDateTime } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogTrigger,
} from '@/components/ui/dialog'
import { PhoneInputField } from '@/components/ui/phone-input'

interface PatientDetail {
    customer_id: number
    hn_code: string
    first_name: string
    last_name: string
    full_name: string | null
    nickname: string | null
    phone_number: string
    address: string | null
    birth_date: string | null
    drug_allergy: string | null
    underlying_disease: string | null

    member_level: string | null
    total_debt: number
    age: number | null
    transaction_header: Array<{
        transaction_id: number
        transaction_date: string
        net_amount: number
        remaining_balance: number
        payment_status: string
    }>
    customer_course: Array<{
        id: number
        remaining_sessions: number
        course: { course_name: string }
    }>
    customer_consent?: Array<{
        id: number
        consent_type: string
        is_granted: boolean
        version: string
        consent_date: string
    }>
}

interface TreatmentHistory {
    usage_id: number
    service_date: string
    service_name: string
    note: string | null
    course_name: string | null
    doctor: string | null
    products: Array<{
        product_name: string
        qty_used: number
        unit: string
        lot_number: string | null
    }>
}

interface GalleryImage {
    gallery_id: number
    image_type: 'Before' | 'After'
    image_path: string
    taken_date: string
    notes: string | null
    is_marketing_allowed: boolean
    service_usage?: { service_name: string }
}

const getMemberBadgeColor = (level: string | null) => {
    switch (level?.toLowerCase()) {
        case 'platinum gold': return 'bg-purple-600 text-white border-purple-700'
        case 'platinum': return 'bg-indigo-100 text-indigo-800 border-indigo-300'
        case 'gold': return 'bg-amber-400 text-amber-900 border-amber-500'
        case 'silver': return 'bg-slate-200 text-slate-700 border-slate-400'
        default: return 'bg-slate-100 text-slate-600 border-slate-300'
    }
}

export default function PatientDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const customerId = parseInt(id)
    const router = useRouter()
    const queryClient = useQueryClient()
    const token = useAuthStore((s) => s.token)

    const [isEditing, setIsEditing] = useState(false)
    const [editForm, setEditForm] = useState<Partial<PatientDetail>>({})
    const [uploadOpen, setUploadOpen] = useState(false)
    const [uploadData, setUploadData] = useState({ image_data: '', image_file: null as File | null, image_type: 'Before' as 'Before' | 'After', notes: '', is_marketing_allowed: false })
    const [deleteId, setDeleteId] = useState<number | null>(null)
    const [selectedGalleryImage, setSelectedGalleryImage] = useState<GalleryImage | null>(null)
    const [selectedRefundCourse, setSelectedRefundCourse] = useState<any | null>(null)
    const [refundAmount, setRefundAmount] = useState(0)
    const [refundNote, setRefundNote] = useState('')

    // Fetch patient details
    const { data: patient, isLoading } = useQuery<PatientDetail>({
        queryKey: ['patient', customerId],
        queryFn: async () => {
            const res = await fetch(`/api/customers/${customerId}`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            })
            if (!res.ok) throw new Error('Failed to fetch')
            return res.json()
        },
    })

    // Fetch treatment history
    const { data: history = [] } = useQuery<TreatmentHistory[]>({
        queryKey: ['patient-history', customerId],
        queryFn: async () => {
            const res = await fetch(`/api/customers/${customerId}/history`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            })
            if (!res.ok) throw new Error('Failed to fetch')
            return res.json()
        },
    })

    // Fetch gallery
    const { data: galleryData } = useQuery<{ images: GalleryImage[], grouped: Record<string, GalleryImage[]> }>({
        queryKey: ['patient-gallery', customerId],
        queryFn: async () => {
            const res = await fetch(`/api/customers/${customerId}/gallery`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            })
            if (!res.ok) throw new Error('Failed to fetch')
            return res.json()
        },
    })

    // Fetch deposit balance & history
    const { data: depositBalance } = useQuery<{ balance: number; totalAdded: number; totalUsed: number; totalRefunded: number }>({
        queryKey: ['patient-deposit-balance', customerId],
        queryFn: async () => {
            const res = await fetch(`/api/deposits/balance/${customerId}`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            })
            if (!res.ok) return { balance: 0, totalAdded: 0, totalUsed: 0, totalRefunded: 0 }
            return res.json()
        }
    })

    const { data: depositLogs = [] } = useQuery<Array<{
        id: number
        amount: number
        type: 'ADD' | 'DEDUCT' | 'REFUND' | 'ADJUST'
        balance_after: number
        note: string | null
        created_at: string
        staff?: { full_name: string } | null
        transaction_id?: number | null
    }>>({
        queryKey: ['patient-deposit-logs', customerId],
        queryFn: async () => {
            const res = await fetch(`/api/deposits?customerId=${customerId}`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            })
            if (!res.ok) return []
            const json = await res.json()
            return json.data || []
        }
    })

    // Update mutation
    const updateMutation = useMutation({
        mutationFn: async (data: Partial<PatientDetail>) => {
            const res = await fetch(`/api/customers/${customerId}`, {
                method: 'PUT',
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
            toast.success('บันทึกข้อมูลสำเร็จ')
            queryClient.invalidateQueries({ queryKey: ['patient', customerId] })
            queryClient.invalidateQueries({ queryKey: ['patients'] })
            queryClient.invalidateQueries({ queryKey: ['customers'] })
            setIsEditing(false)
        },
        onError: () => toast.error('เกิดข้อผิดพลาด'),
    })

    // Upload gallery mutation
    const uploadMutation = useMutation({
        mutationFn: async (data: typeof uploadData) => {
            const formData = new FormData()
            if (data.image_file) {
                formData.append('image_file', data.image_file)
            } else if (data.image_data) {
                formData.append('image_data', data.image_data)
            }
            formData.append('image_type', data.image_type)
            formData.append('notes', data.notes || '')
            formData.append('is_marketing_allowed', data.is_marketing_allowed.toString())

            const res = await fetch(`/api/customers/${customerId}/gallery`, {
                method: 'POST',
                headers: {
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: formData,
            })
            if (!res.ok) throw new Error('Failed')
            return res.json()
        },
        onSuccess: () => {
            toast.success('อัพโหลดรูปสำเร็จ')
            queryClient.invalidateQueries({ queryKey: ['patient-gallery', customerId] })
            setUploadOpen(false)
            setUploadData({ image_data: '', image_file: null, image_type: 'Before', notes: '', is_marketing_allowed: false })
        },
        onError: () => toast.error('อัพโหลดไม่สำเร็จ'),
    })

    // Delete gallery image mutation
    const deleteMutation = useMutation({
        mutationFn: async (galleryId: number) => {
            const res = await fetch(`/api/gallery/${galleryId}`, {
                method: 'DELETE',
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            })
            if (!res.ok) throw new Error('Failed')
            return res.json()
        },
        onSuccess: () => {
            toast.success('ลบรูปภาพสำเร็จ')
            queryClient.invalidateQueries({ queryKey: ['patient-gallery', customerId] })
            setDeleteId(null)
        },
        onError: () => toast.error('ลบรูปภาพไม่สำเร็จ'),
    })

    // Consent update mutation
    const consentMutation = useMutation({
        mutationFn: async (data: { consent_type: string; is_granted: boolean; version: string }) => {
            const res = await fetch(`/api/customers/${customerId}/consent`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify(data),
            })
            if (!res.ok) throw new Error('Failed to update consent')
            return res.json()
        },
        onSuccess: () => {
            toast.success('บันทึกความยินยอมสำเร็จ')
            queryClient.invalidateQueries({ queryKey: ['patient', customerId] })
        },
        onError: () => toast.error('บันทึกความยินยอมไม่สำเร็จ'),
    })

    // Refund course mutation
    const refundCourseMutation = useMutation({
        mutationFn: async (data: { customer_course_id: number; refund_amount: number; note: string }) => {
            const res = await fetch(`/api/customers/${customerId}/courses/refund`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify(data),
            })
            if (!res.ok) {
                const errData = await res.json()
                throw new Error(errData.error || 'Failed to refund')
            }
            return res.json()
        },
        onSuccess: (data) => {
            toast.success('คืนเงินเข้ามัดจำสำเร็จ', {
                description: `ยอดมัดจำใหม่คือ ฿${data.new_balance.toLocaleString()}`
            })
            queryClient.invalidateQueries({ queryKey: ['patient', customerId] })
            queryClient.invalidateQueries({ queryKey: ['patient-deposit-balance', customerId] })
            queryClient.invalidateQueries({ queryKey: ['patient-deposit-logs', customerId] })
            setSelectedRefundCourse(null)
        },
        onError: (err: any) => {
            toast.error(err.message || 'คืนเงินคอร์สไม่สำเร็จ')
        }
    })

    // Data Anonymize mutation
    const anonymizeMutation = useMutation({
        mutationFn: async () => {
            const res = await fetch(`/api/customers/${customerId}/anonymize`, {
                method: 'POST',
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            })
            if (!res.ok) throw new Error('Failed to anonymize data')
            return res.json()
        },
        onSuccess: () => {
            toast.success('ลบข้อมูลและปกปิดตัวตนสำเร็จ (Anonymized)')
            queryClient.invalidateQueries({ queryKey: ['patient', customerId] })
            queryClient.invalidateQueries({ queryKey: ['patients'] })
            queryClient.invalidateQueries({ queryKey: ['customers'] })
            router.push('/patients') // Redirect to list after anonymizing to match soft delete behavior
        },
        onError: () => toast.error('ไม่สามารถทำรายการได้'),
    })

    const getLatestConsent = (type: string) => {
        if (!patient?.customer_consent) return false
        const consents = patient.customer_consent.filter(c => c.consent_type === type)
        if (consents.length === 0) return false
        return consents.sort((a, b) => new Date(b.consent_date).getTime() - new Date(a.consent_date).getTime())[0].is_granted
    }


    const handleEdit = () => {
        if (patient) {
            setEditForm({
                first_name: patient.first_name,
                last_name: patient.last_name,
                nickname: patient.nickname,
                phone_number: patient.phone_number,
                address: patient.address,
                birth_date: patient.birth_date?.split('T')[0],
                drug_allergy: patient.drug_allergy,
                underlying_disease: patient.underlying_disease,

                member_level: patient.member_level,
            })
            setIsEditing(true)
        }
    }

    const handleSave = () => {
        updateMutation.mutate(editForm)
    }

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            const reader = new FileReader()
            reader.onloadend = () => {
                setUploadData(prev => ({ ...prev, image_file: file, image_data: reader.result as string }))
            }
            reader.readAsDataURL(file)
        }
    }

    if (isLoading || !patient) {
        return (
            <div className="space-y-6 animate-pulse">
                <div className="h-48 bg-slate-100 rounded-xl" />
                <div className="h-64 bg-slate-100 rounded-xl" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()} aria-label="ย้อนกลับ">
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <h1 className="text-2xl font-bold">OPD Card</h1>
            </div>

            {/* Patient Header Card */}
            <Card className="overflow-hidden">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 text-white">
                    <div className="flex items-start gap-6">
                        {/* Avatar */}
                        <div className="h-24 w-24 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                            <User className="h-14 w-14 text-white" />
                        </div>

                        {/* Info */}
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                                <h2 className="text-2xl font-bold">
                                    {patient.full_name || `${patient.first_name} ${patient.last_name}`}
                                </h2>
                                <Badge className={getMemberBadgeColor(patient.member_level)}>
                                    {patient.member_level || 'General'}
                                </Badge>
                            </div>
                            <div className="flex items-center gap-4 text-blue-100">
                                <span className="font-mono">{patient.hn_code}</span>
                                {patient.nickname && <span>• &quot;{patient.nickname}&quot;</span>}
                                {patient.age && <span>• {patient.age} ปี</span>}
                            </div>
                            <div className="flex items-center gap-2 mt-2 text-blue-100">
                                <Phone className="h-4 w-4" />
                                {patient.phone_number}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2">
                            {!isEditing ? (
                                <Button variant="secondary" onClick={handleEdit}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    แก้ไข
                                </Button>
                            ) : (
                                <>
                                    <Button variant="secondary" onClick={handleSave} disabled={updateMutation.isPending} aria-busy={updateMutation.isPending}>
                                        <Save className="h-4 w-4 mr-2" />
                                        {updateMutation.isPending ? 'กำลังบันทึก...' : 'บันทึก'}
                                    </Button>
                                    <Button variant="ghost" onClick={() => setIsEditing(false)} aria-label="ยกเลิกการแก้ไข">
                                        <X className="h-4 w-4" />
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </Card>

            {/* Debt Widget */}
            {patient.total_debt > 0 && (
                <Card className="border-red-200 bg-red-50">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="h-12 w-12 rounded-lg bg-red-100 flex items-center justify-center">
                                    <AlertTriangle className="h-6 w-6 text-red-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-red-600">ยอดค้างชำระ</p>
                                    <p className="text-2xl font-bold text-red-700">฿{patient.total_debt.toLocaleString()}</p>
                                </div>
                            </div>
                            <Button
                                className="bg-red-600 hover:bg-red-700"
                                onClick={() => router.push(`/debtors?search=${patient.hn_code}`)}
                            >
                                ชำระเงิน
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Medical Alert */}
            {(patient.drug_allergy || patient.underlying_disease) && (
                <Card className="border-red-300 bg-red-100">
                    <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="h-6 w-6 text-red-600 shrink-0 mt-0.5" />
                            <div className="space-y-2">
                                <h3 className="font-bold text-red-800">ข้อควรระวังทางการแพทย์</h3>
                                {patient.drug_allergy && (
                                    <p className="text-red-700">
                                        <strong>แพ้ยา:</strong> {patient.drug_allergy}
                                    </p>
                                )}
                                {patient.underlying_disease && (
                                    <p className="text-red-700">
                                        <strong>โรคประจำตัว:</strong> {patient.underlying_disease}
                                    </p>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Tabs */}
            <Tabs defaultValue="info" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="info">
                        <User className="h-4 w-4 mr-2" />
                        ข้อมูลส่วนตัว
                    </TabsTrigger>
                    <TabsTrigger value="courses">
                        <Syringe className="h-4 w-4 mr-2" />
                        คอร์สของคนไข้
                    </TabsTrigger>
                    <TabsTrigger value="history">
                        <Clock className="h-4 w-4 mr-2" />
                        ประวัติการรักษา
                    </TabsTrigger>
                    <TabsTrigger value="gallery">
                        <Camera className="h-4 w-4 mr-2" />
                        Gallery
                    </TabsTrigger>
                    <TabsTrigger value="deposits">
                        <Wallet className="h-4 w-4 mr-2" />
                        ประวัติมัดจำ (Deposits)
                    </TabsTrigger>
                    <TabsTrigger value="privacy">
                        <ShieldCheck className="h-4 w-4 mr-2" />
                        PDPA & Consent
                    </TabsTrigger>
                </TabsList>

                {/* Personal Info Tab */}
                <TabsContent value="info">
                    <Card>
                        <CardHeader>
                            <CardTitle>ข้อมูลส่วนตัว</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {isEditing ? (
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div>
                                        <Label>ชื่อ</Label>
                                        <Input
                                            maxLength={50}
                                            value={editForm.first_name || ''}
                                            onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <Label>นามสกุล</Label>
                                        <Input
                                            maxLength={50}
                                            value={editForm.last_name || ''}
                                            onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <Label>ชื่อเล่น</Label>
                                        <Input
                                            value={editForm.nickname || ''}
                                            onChange={(e) => setEditForm({ ...editForm, nickname: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <Label>เบอร์โทร</Label>
                                        <PhoneInputField
                                            value={editForm.phone_number || ''}
                                            onChange={(val) => setEditForm({ ...editForm, phone_number: val })}
                                        />
                                    </div>
                                    <div>
                                        <Label>วันเกิด</Label>
                                        <Input
                                            type="date"
                                            value={editForm.birth_date || ''}
                                            onChange={(e) => setEditForm({ ...editForm, birth_date: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <Label>ระดับสมาชิก</Label>
                                        <Select
                                            value={editForm.member_level || 'General'}
                                            onValueChange={(v) => setEditForm({ ...editForm, member_level: v })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="General">General</SelectItem>
                                                <SelectItem value="Silver">Silver</SelectItem>
                                                <SelectItem value="Gold">Gold</SelectItem>
                                                <SelectItem value="Platinum">Platinum</SelectItem>
                                                <SelectItem value="Platinum Gold">Platinum Gold</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="md:col-span-2">
                                        <Label>ที่อยู่</Label>
                                        <Textarea
                                            value={editForm.address || ''}
                                            onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                                        />
                                    </div>

                                    <div>
                                        <Label className="text-red-600">แพ้ยา</Label>
                                        <Textarea
                                            value={editForm.drug_allergy || ''}
                                            onChange={(e) => setEditForm({ ...editForm, drug_allergy: e.target.value })}
                                            className="border-red-200"
                                        />
                                    </div>
                                    <div>
                                        <Label className="text-red-600">โรคประจำตัว</Label>
                                        <Textarea
                                            value={editForm.underlying_disease || ''}
                                            onChange={(e) => setEditForm({ ...editForm, underlying_disease: e.target.value })}
                                            className="border-red-200"
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="flex items-center gap-3">
                                        <Phone className="h-5 w-5 text-slate-400" />
                                        <div>
                                            <p className="text-xs text-slate-500">เบอร์โทร</p>
                                            <p className="font-medium">{patient.phone_number}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Cake className="h-5 w-5 text-slate-400" />
                                        <div>
                                            <p className="text-xs text-slate-500">วันเกิด / อายุ</p>
                                            <p className="font-medium">
                                                {patient.birth_date ? formatDate(patient.birth_date) : '-'}
                                                {patient.age && ` (${patient.age} ปี)`}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3 md:col-span-2">
                                        <MapPin className="h-5 w-5 text-slate-400 shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-xs text-slate-500">ที่อยู่</p>
                                            <p className="font-medium">{patient.address || '-'}</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Courses Tab */}
                <TabsContent value="courses">
                    <Card>
                        <CardHeader>
                            <CardTitle>คอร์สรักษาของคนไข้</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {!patient.customer_course || patient.customer_course.length === 0 ? (
                                <div className="py-12 text-center text-slate-500">
                                    <Syringe className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                    <p>ยังไม่มีคอร์สในระบบ</p>
                                </div>
                            ) : (
                                <div className="grid gap-4 md:grid-cols-2">
                                    {patient.customer_course.map((userCourse: any) => {
                                        const total = userCourse.total_sessions || userCourse.course.session_count || 1
                                        const remaining = userCourse.remaining_sessions
                                        const isUsedUp = remaining === 0 || userCourse.status === 'USED_UP'
                                        
                                        return (
                                            <div key={userCourse.id} className={`p-4 rounded-xl border flex flex-col justify-between ${isUsedUp ? 'bg-slate-50 border-slate-200 opacity-60' : 'bg-white border-amber-200 shadow-sm'}`}>
                                                <div>
                                                    <div className="flex items-start justify-between gap-2">
                                                        <h3 className="font-bold text-slate-800 text-base">{userCourse.course.course_name}</h3>
                                                        <Badge className={isUsedUp ? 'bg-slate-200 text-slate-700' : 'bg-amber-100 text-amber-800'}>
                                                            {isUsedUp ? 'จบคอร์ส' : 'กำลังใช้งาน'}
                                                        </Badge>
                                                    </div>
                                                    <p className="text-xs text-slate-400 font-mono mt-1">HN Course ID: #{userCourse.id}</p>
                                                    
                                                    {/* Progress */}
                                                    <div className="mt-4">
                                                        <div className="flex justify-between text-xs font-semibold text-slate-500 mb-1.5">
                                                            <span>ครั้งที่ใช้ไป</span>
                                                            <span>{total - remaining} / {total} ครั้ง</span>
                                                        </div>
                                                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                                            <div className="h-full bg-amber-500 rounded-full" style={{ width: `${((total - remaining) / total) * 100}%` }} />
                                                        </div>
                                                    </div>
                                                </div>

                                                {!isUsedUp && (
                                                    <div className="mt-4 pt-3 border-t border-dashed flex justify-between items-center">
                                                        <span className="text-xs text-slate-400">คงเหลือ {remaining} ครั้ง</span>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 rounded-lg cursor-pointer"
                                                            onClick={() => {
                                                                const stdPrice = Number(userCourse.course.standard_price || 999)
                                                                const autoAmt = Math.round((remaining / total) * stdPrice)
                                                                setSelectedRefundCourse(userCourse)
                                                                setRefundAmount(autoAmt)
                                                                setRefundNote(`คืนเงินคอร์ส ${userCourse.course.course_name} คงเหลือ ${remaining} ครั้ง`)
                                                            }}
                                                        >
                                                            คืนคอร์สเป็นมัดจำ
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Treatment History Tab */}
                <TabsContent value="history">
                    <Card>
                        <CardHeader>
                            <CardTitle>ประวัติการรักษา</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {history.length === 0 ? (
                                <div className="py-12 text-center text-slate-500">
                                    <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                    <p>ยังไม่มีประวัติการรักษา</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {history.map((item) => (
                                        <div key={item.usage_id} className="p-4 rounded-lg bg-slate-50 border-l-4 border-blue-500">
                                            <div className="flex items-start justify-between mb-2">
                                                <div>
                                                    <p className="font-medium text-blue-700">{item.service_name}</p>
                                                    {item.course_name && (
                                                        <p className="text-sm text-slate-500">{item.course_name}</p>
                                                    )}
                                                </div>
                                                <div className="text-right text-sm text-slate-500">
                                                    <p>{item.service_date ? formatDateTime(item.service_date) : '-'}</p>
                                                    {item.doctor && <p className="text-blue-600">Dr. {item.doctor}</p>}
                                                </div>
                                            </div>
                                            {item.products.length > 0 && (
                                                <div className="mt-2 pt-2 border-t border-slate-200">
                                                    <p className="text-xs text-slate-500 mb-1">ยา/อุปกรณ์ที่ใช้:</p>
                                                    <div className="flex flex-wrap gap-2">
                                                        {item.products.map((p, i) => (
                                                            <Badge key={i} variant="secondary" className="text-xs">
                                                                {p.product_name} x{p.qty_used} {p.unit}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                            {item.note && (
                                                <p className="mt-2 text-sm text-slate-600"><span className="font-semibold">หมายเหตุ:</span> {item.note}</p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Gallery Tab */}
                <TabsContent value="gallery">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>Gallery Before/After</CardTitle>
                            <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
                                <DialogTrigger asChild>
                                    <Button size="sm">
                                        <Plus className="h-4 w-4 mr-2" />
                                        อัพโหลดรูป
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>อัพโหลดรูปภาพ</DialogTitle>
                                        <DialogDescription className="sr-only">
                                            เลือกรูป Before หรือ After และใส่ข้อความสำหรับรูปภาพที่ต้องการอัพโหลด
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4">
                                        <div>
                                            <Label>ประเภท</Label>
                                            <Select
                                                value={uploadData.image_type}
                                                onValueChange={(v) => setUploadData({ ...uploadData, image_type: v as 'Before' | 'After' })}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Before">Before</SelectItem>
                                                    <SelectItem value="After">After</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div>
                                            <Label>รูปภาพ</Label>
                                            <label className="cursor-pointer block">
                                                <div className="border-2 border-dashed rounded-lg p-6 text-center hover:bg-slate-50">
                                                    {uploadData.image_data ? (
                                                        <img src={uploadData.image_data} alt="Preview" className="max-h-48 mx-auto rounded" />
                                                    ) : (
                                                        <>
                                                            <Upload className="h-8 w-8 mx-auto mb-2 text-slate-400" />
                                                            <p className="text-sm text-slate-500">คลิกเพื่อเลือกรูป</p>
                                                        </>
                                                    )}
                                                </div>
                                                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                                            </label>
                                        </div>
                                        <div>
                                            <Label>หมายเหตุ</Label>
                                            <Input
                                                value={uploadData.notes}
                                                onChange={(e) => setUploadData({ ...uploadData, notes: e.target.value })}
                                                placeholder="ระบุหมายเหตุ..."
                                            />
                                        </div>
                                        <div className="flex items-center space-x-2 pt-2 pb-2">
                                            <Switch
                                                id="marketing-consent"
                                                checked={uploadData.is_marketing_allowed}
                                                onCheckedChange={(checked) => setUploadData({ ...uploadData, is_marketing_allowed: checked })}
                                            />
                                            <Label htmlFor="marketing-consent" className="text-sm font-normal">
                                                ยินยอมให้นำภาพไปใช้เพื่อการตลาด (Marketing Consent)
                                            </Label>
                                        </div>
                                        <Button
                                            className="w-full"
                                            onClick={() => uploadMutation.mutate(uploadData)}
                                            disabled={!uploadData.image_data || uploadMutation.isPending}
                                        >
                                            อัพโหลด
                                        </Button>
                                    </div>
                                </DialogContent>
                            </Dialog>
                        </CardHeader>
                        <CardContent>
                            {!galleryData?.images?.length ? (
                                <div className="py-12 text-center text-slate-500">
                                    <Camera className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                    <p>ยังไม่มีรูปภาพ</p>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {Object.entries(galleryData.grouped || {}).map(([date, images]) => (
                                        <div key={date}>
                                            <p className="font-medium text-sm text-slate-500 mb-3">
                                                {new Date(date).toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })}
                                            </p>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                                {(images as GalleryImage[]).map((img) => (
                                                    <div key={img.gallery_id} className="relative group aspect-square">
                                                        <button
                                                            type="button"
                                                            className="absolute inset-0 z-10 rounded-lg"
                                                            aria-label={`ดูรายละเอียดรูป ${img.image_type}`}
                                                            onClick={() => setSelectedGalleryImage(img)}
                                                        />
                                                        <Image
                                                            src={img.image_path}
                                                            alt={img.image_type}
                                                            fill
                                                            unoptimized
                                                            className="object-cover rounded-lg"
                                                            sizes="(max-width: 768px) 50vw, 25vw"
                                                        />
                                                        <Badge
                                                            className={`absolute top-2 left-2 ${img.image_type === 'Before'
                                                                ? 'bg-blue-100 text-blue-700'
                                                                : 'bg-green-100 text-green-700'
                                                                }`}
                                                        >
                                                            {img.image_type}
                                                        </Badge>
                                                        {!img.is_marketing_allowed && (
                                                            <div className="absolute bottom-2 left-2 bg-black/60 rounded p-1 text-white" title="ไม่อนุญาตให้ใช้ทำการตลาด">
                                                                <ShieldCheck className="h-4 w-4" />
                                                            </div>
                                                        )}

                                                        {/* Delete Button - Only visible on hover */}
                                                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <Button
                                                                variant="destructive"
                                                                size="icon"
                                                                className="h-8 w-8 rounded-full z-20 relative"
                                                                aria-label="ลบรูปภาพ"
                                                                onClick={(e) => {
                                                                    e.stopPropagation()
                                                                    setDeleteId(img.gallery_id)
                                                                }}
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <Dialog open={!!selectedGalleryImage} onOpenChange={(open) => !open && setSelectedGalleryImage(null)}>
                                <DialogContent className="max-w-3xl">
                                    <DialogHeader>
                                        <DialogTitle>รายละเอียดรูปภาพคนไข้</DialogTitle>
                                    </DialogHeader>
                                    {selectedGalleryImage && (
                                        <div className="space-y-4">
                                            <div className="rounded-lg overflow-hidden border bg-slate-50">
                                                <img
                                                    src={selectedGalleryImage.image_path}
                                                    alt={selectedGalleryImage.image_type}
                                                    className="w-full max-h-[70vh] object-contain"
                                                />
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                                                <div>
                                                    <p className="text-slate-500">ประเภท</p>
                                                    <p className="font-medium">{selectedGalleryImage.image_type}</p>
                                                </div>
                                                <div>
                                                    <p className="text-slate-500">วันที่ถ่าย</p>
                                                    <p className="font-medium">{formatDateTime(selectedGalleryImage.taken_date)}</p>
                                                </div>
                                                <div>
                                                    <p className="text-slate-500">บริการที่เกี่ยวข้อง</p>
                                                    <p className="font-medium">{selectedGalleryImage.service_usage?.service_name || '-'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-slate-500">Marketing Consent</p>
                                                    <p className="font-medium">{selectedGalleryImage.is_marketing_allowed ? 'อนุญาต' : 'ไม่อนุญาต'}</p>
                                                </div>
                                                <div className="sm:col-span-2">
                                                    <p className="text-slate-500">หมายเหตุ</p>
                                                    <p className="font-medium whitespace-pre-wrap">{selectedGalleryImage.notes || '-'}</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </DialogContent>
                            </Dialog>

                            <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>ยืนยันการลบรูปภาพ</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            คุณต้องการลบรูปภาพนี้ใช่หรือไม่? การกระทำนี้ไม่สามารถยกเลิกได้ และไฟล์รูปภาพจะถูกลบออกจากระบบอย่างถาวร
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
                                        <AlertDialogAction
                                            onClick={() => deleteId && deleteMutation.mutate(deleteId)}
                                            className="bg-red-600 hover:bg-red-700"
                                        >
                                            ยืนยันลบ
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Privacy & Consent Tab */}
                <TabsContent value="privacy">
                    <Card>
                        <CardHeader>
                            <CardTitle>การจัดการสิทธิส่วนบุคคล (PDPA & Consent)</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center justify-between p-4 rounded-lg border">
                                <div className="space-y-0.5">
                                    <h4 className="font-semibold text-base">ความยินยอมตาม พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล (PDPA)</h4>
                                    <p className="text-sm text-slate-500">
                                        ยินยอมให้คลินิกบันทึกและประมวลผลข้อมูลส่วนบุคคล ข้อมูลสุขภาพ เพื่อใช้ประกอบการรักษาและให้บริการ
                                    </p>
                                </div>
                                <Switch
                                    checked={getLatestConsent('PDPA_PRIVACY')}
                                    onCheckedChange={(val) => consentMutation.mutate({ consent_type: 'PDPA_PRIVACY', is_granted: val, version: 'v1.0' })}
                                    disabled={consentMutation.isPending}
                                />
                            </div>

                            <div className="flex items-center justify-between p-4 rounded-lg border">
                                <div className="space-y-0.5">
                                    <h4 className="font-semibold text-base">ความยินยอมในการรับข่าวสาร (Marketing Consent)</h4>
                                    <p className="text-sm text-slate-500">
                                        ยินยอมให้คลินิกติดต่อเพื่อนำเสนอโปรโมชั่น สิทธิพิเศษ และข่าวสารการตลาดที่เป็นประโยชน์
                                    </p>
                                </div>
                                <Switch
                                    checked={getLatestConsent('MARKETING')}
                                    onCheckedChange={(val) => consentMutation.mutate({ consent_type: 'MARKETING', is_granted: val, version: 'v1.0' })}
                                    disabled={consentMutation.isPending}
                                />
                            </div>

                            <div className="flex items-center justify-between p-4 rounded-lg border">
                                <div className="space-y-0.5">
                                    <h4 className="font-semibold text-base">ความยินยอมในการรักษา (Medical Treatment Consent)</h4>
                                    <p className="text-sm text-slate-500">
                                        ผู้เข้ารับบริการยินยอมให้แพทย์ทำการตรวจวินิจฉัยและทำหัตถการทางการแพทย์ รวมถึงรับทราบความเสี่ยงที่อาจเกิดขึ้น
                                    </p>
                                </div>
                                <Switch
                                    checked={getLatestConsent('MEDICAL_TREATMENT')}
                                    onCheckedChange={(val) => consentMutation.mutate({ consent_type: 'MEDICAL_TREATMENT', is_granted: val, version: 'v1.0' })}
                                    disabled={consentMutation.isPending}
                                />
                            </div>

                            {/* Anonymize Action */}
                            <div className="pt-6 mt-6 border-t border-red-100">
                                <div className="bg-red-50 p-4 rounded-lg flex flex-col md:flex-row items-center justify-between gap-4">
                                    <div>
                                        <h4 className="font-semibold text-red-700 text-base">Anonymize Data (ลบข้อมูลเพื่อปกปิดตัวตน)</h4>
                                        <p className="text-sm text-red-600 mt-1">
                                            กระบวนการนี้จะแทนที่ชื่อและเบอร์ด้วยข้อมูลสุ่ม แต่คงประวัติการทำธุรกรรมไว้สำหรับบัญชี ตามสิทธิ Right to be Forgotten
                                        </p>
                                    </div>
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="destructive" className="shrink-0">
                                                <Trash2 className="h-4 w-4 mr-2" />
                                                Anonymize Data
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle className="text-red-600">ยืนยันการทำ Anonymization</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    คุณแน่ใจหรือไม่ว่าต้องการลบข้อมูลที่ระบุตัวตนของลูกค้ารายนี้? <br /><br />
                                                    การกระทำนี้ <strong>ไม่สามารถย้อนกลับได้</strong> ข้อมูลส่วนตัวจะถูกแทนที่ด้วยข้อมูลสุ่ม และจะตัดสิทธิ์การติดต่อทางการตลาดทันที
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
                                                <AlertDialogAction
                                                    onClick={() => anonymizeMutation.mutate()}
                                                    className="bg-red-600 hover:bg-red-700"
                                                    disabled={anonymizeMutation.isPending}
                                                >
                                                    {anonymizeMutation.isPending ? 'กำลังดำเนินการ...' : 'ยืนยัน Anonymize'}
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Deposits Tab */}
                <TabsContent value="deposits">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>สมุดเดินบัญชีเงินมัดจำ (Deposit Passbook)</CardTitle>
                                <p className="text-muted-foreground text-xs mt-1">ยอดเงินสะสมล่วงหน้าและประวัติการชำระบิลของคนไข้</p>
                            </div>
                            <Badge className="bg-amber-100 text-amber-800 border-amber-200 text-sm font-semibold px-3 py-1 gap-1">
                                <Wallet className="h-4 w-4" />
                                ยอดมัดจำคงเหลือ: ฿{(depositBalance?.balance || 0).toLocaleString()}
                            </Badge>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Summary metrics */}
                            <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
                                <div className="p-4 rounded-xl border bg-slate-50 flex items-center justify-between">
                                    <div>
                                        <p className="text-xs text-slate-500 font-semibold">ยอดฝากมัดจำรวม</p>
                                        <p className="text-lg font-bold text-slate-800 mt-1">฿{(depositBalance?.totalAdded || 0).toLocaleString()}</p>
                                    </div>
                                    <div className="h-9 w-9 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                                        <ArrowUpRight className="h-5 w-5" />
                                    </div>
                                </div>
                                <div className="p-4 rounded-xl border bg-slate-50 flex items-center justify-between">
                                    <div>
                                        <p className="text-xs text-slate-500 font-semibold">ยอดใช้ชำระค่าคอร์ส</p>
                                        <p className="text-lg font-bold text-slate-800 mt-1">฿{(depositBalance?.totalUsed || 0).toLocaleString()}</p>
                                    </div>
                                    <div className="h-9 w-9 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center">
                                        <ArrowDownLeft className="h-5 w-5" />
                                    </div>
                                </div>
                                <div className="p-4 rounded-xl border bg-slate-50 flex items-center justify-between">
                                    <div>
                                        <p className="text-xs text-slate-500 font-semibold">คืนเงิน / ปรับปรุงยอด</p>
                                        <p className="text-lg font-bold text-slate-800 mt-1">฿{(depositBalance?.totalRefunded || 0).toLocaleString()}</p>
                                    </div>
                                    <div className="h-9 w-9 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center">
                                        <RefreshCcw className="h-5 w-5" />
                                    </div>
                                </div>
                            </div>

                            {/* Ledger Timeline */}
                            <div className="space-y-4">
                                <h4 className="font-semibold text-slate-700 text-sm">บันทึกความเคลื่อนไหวบัญชี (Passbook Timeline)</h4>
                                
                                {depositLogs.length === 0 ? (
                                    <div className="py-12 text-center text-slate-400 border rounded-lg border-dashed">
                                        <Wallet className="h-10 w-10 mx-auto mb-3 opacity-40" />
                                        <p className="text-sm">ยังไม่มีรายการเงินมัดจำสำหรับคนไข้รายนี้</p>
                                    </div>
                                ) : (
                                    <div className="relative border-l pl-4 ml-3 space-y-6 py-2">
                                        {depositLogs.map((log) => {
                                            const isAdd = log.type === 'ADD'
                                            const isDeduct = log.type === 'DEDUCT'
                                            const isRefund = log.type === 'REFUND'
                                            const isAdjust = log.type === 'ADJUST'

                                            let typeLabel = 'ปรับยอด'
                                            let typeColor = 'bg-slate-100 text-slate-700 border-slate-200'
                                            let amountPrefix = ''

                                            if (isAdd) {
                                                typeLabel = 'เติมมัดจำ'
                                                typeColor = 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                amountPrefix = '+'
                                            } else if (isDeduct) {
                                                typeLabel = 'ใช้หักบิล'
                                                typeColor = 'bg-blue-50 text-blue-700 border-blue-200'
                                                amountPrefix = '-'
                                            } else if (isRefund) {
                                                typeLabel = 'คืนเงินมัดจำ'
                                                typeColor = 'bg-red-50 text-red-700 border-red-200'
                                                amountPrefix = '-'
                                            }

                                            return (
                                                <div key={log.id} className="relative">
                                                    {/* Dot */}
                                                    <span className="absolute -left-[25px] top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-white border shadow-sm ring-4 ring-white">
                                                        <span className={`h-1.5 w-1.5 rounded-full ${isAdd ? 'bg-emerald-500' : isDeduct ? 'bg-blue-500' : isRefund ? 'bg-red-500' : 'bg-amber-500'}`} />
                                                    </span>

                                                    {/* Box */}
                                                    <div className="p-4 rounded-xl border bg-slate-50/50 hover:bg-slate-50 transition-colors">
                                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                                            <div className="flex items-center gap-2">
                                                                <Badge className={typeColor}>{typeLabel}</Badge>
                                                                <span className="text-xs text-slate-400 font-semibold">{formatDateTime(log.created_at)}</span>
                                                            </div>
                                                            <div className="text-right">
                                                                <span className={`font-mono font-bold text-sm ${isAdd ? 'text-emerald-600' : (isDeduct || isRefund) ? 'text-red-600' : 'text-amber-600'}`}>
                                                                    {amountPrefix}฿{log.amount.toLocaleString()}
                                                                </span>
                                                                <span className="text-[10px] text-slate-400 font-semibold block">คงเหลือ: ฿{log.balance_after.toLocaleString()}</span>
                                                            </div>
                                                        </div>

                                                        {log.note && (
                                                             <p className="mt-2 text-xs text-slate-600 font-medium"><span className="font-semibold">หมายเหตุ:</span> {log.note}</p>
                                                        )}

                                                        <div className="mt-3 pt-2.5 border-t border-dashed flex flex-wrap items-center justify-between text-[10px] text-slate-400 font-semibold">
                                                            <span>ทำรายการโดย: {log.staff?.full_name || 'ระบบอัตโนมัติ'}</span>
                                                            {log.transaction_id && (
                                                                <Link href={`/transactions?search=${log.transaction_id}`} className="text-blue-500 hover:underline">
                                                                    อิงรหัสธุรกรรม #{log.transaction_id}
                                                                </Link>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

            </Tabs>

            {/* Refund Course to Deposit Dialog */}
            <Dialog open={!!selectedRefundCourse} onOpenChange={(open) => !open && setSelectedRefundCourse(null)}>
                <DialogContent className="max-w-md rounded-2xl w-[95vw] mx-auto z-[100]">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-bold text-slate-800">ยืนยันการคืนคอร์สเป็นเงินมัดจำ</DialogTitle>
                        <DialogDescription className="text-slate-500 text-xs mt-1">
                            ระบบจะยกเลิกการใช้คอร์สนี้ถาวร และเปลี่ยนจำนวนครั้งคงเหลือเป็นวงเงินมัดจำสะสมของคนไข้
                        </DialogDescription>
                    </DialogHeader>
                    {selectedRefundCourse && (
                        <div className="space-y-4 pt-2">
                            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200">
                                <h4 className="font-bold text-amber-800 text-sm">{selectedRefundCourse.course.course_name}</h4>
                                <div className="grid grid-cols-2 gap-2 mt-2.5 text-xs text-amber-700">
                                    <span>จำนวนคงเหลือ: <strong>{selectedRefundCourse.remaining_sessions} / {selectedRefundCourse.total_sessions || selectedRefundCourse.course.session_count} ครั้ง</strong></span>
                                    <span>ราคามาตรฐานคอร์ส: <strong>฿{Number(selectedRefundCourse.course.standard_price).toLocaleString()}</strong></span>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="refund-amt-input" className="text-xs font-semibold text-slate-500">จำนวนเงินที่จะคืนเข้าบัญชีมัดจำ (฿)</Label>
                                <Input
                                    id="refund-amt-input"
                                    type="number"
                                    min={0}
                                    value={refundAmount}
                                    onChange={(e) => setRefundAmount(parseFloat(e.target.value.replace(/-/g, '')) || 0)}
                                    className="h-10 font-mono font-bold text-lg text-amber-600"
                                />
                                <p className="text-[10px] text-slate-400">คำนวณสัดส่วนครั้งคงเหลืออัตโนมัติ: ฿{Math.round((selectedRefundCourse.remaining_sessions / (selectedRefundCourse.total_sessions || selectedRefundCourse.course.session_count)) * Number(selectedRefundCourse.course.standard_price)).toLocaleString()}</p>
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="refund-note-input" className="text-xs font-semibold text-slate-500">หมายเหตุธุรกรรม</Label>
                                <Textarea
                                    id="refund-note-input"
                                    value={refundNote}
                                    onChange={(e) => setRefundNote(e.target.value)}
                                    placeholder="ใส่สาเหตุการคืน เช่น ลูกค้าขอเปลี่ยนโปร..."
                                    className="h-20 text-xs"
                                />
                            </div>

                            <Button
                                className="w-full h-11 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl mt-2 cursor-pointer"
                                onClick={() => refundCourseMutation.mutate({
                                    customer_course_id: selectedRefundCourse.id,
                                    refund_amount: refundAmount,
                                    note: refundNote
                                })}
                                disabled={refundCourseMutation.isPending}
                            >
                                {refundCourseMutation.isPending ? 'กำลังบันทึก...' : 'ยืนยันการคืนเงินเข้ามัดจำ'}
                            </Button>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
