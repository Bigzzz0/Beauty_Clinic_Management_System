'use client'

import { useState, use } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import {
    User, ArrowLeft, Edit, Save, X, AlertTriangle,
    Phone, MapPin, Calendar, Cake, Users2,
    Clock, Syringe, Camera, Upload, Plus, Trash2
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
} from '@/components/ui/alert-dialog'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/auth-store'
import { formatDate, formatDateTime } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
    service_usage?: { service_name: string }
}

const getMemberBadgeColor = (level: string | null) => {
    switch (level?.toLowerCase()) {
        case 'platinum': return 'bg-purple-100 text-purple-800 border-purple-200'
        case 'gold': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
        default: return 'bg-slate-100 text-slate-700 border-slate-200'
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
    const [uploadData, setUploadData] = useState({ image_data: '', image_type: 'Before' as 'Before' | 'After', notes: '' })
    const [deleteId, setDeleteId] = useState<number | null>(null)

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
            setIsEditing(false)
        },
        onError: () => toast.error('เกิดข้อผิดพลาด'),
    })

    // Upload gallery mutation
    const uploadMutation = useMutation({
        mutationFn: async (data: typeof uploadData) => {
            const res = await fetch(`/api/customers/${customerId}/gallery`, {
                method: 'POST',
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
            toast.success('อัพโหลดรูปสำเร็จ')
            queryClient.invalidateQueries({ queryKey: ['patient-gallery', customerId] })
            setUploadOpen(false)
            setUploadData({ image_data: '', image_type: 'Before', notes: '' })
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
                setUploadData({ ...uploadData, image_data: reader.result as string })
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
                                {patient.nickname && <span>• "{patient.nickname}"</span>}
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
                                <h3 className="font-bold text-red-800">⚠️ ข้อควรระวังทางการแพทย์</h3>
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
                    <TabsTrigger value="history">
                        <Clock className="h-4 w-4 mr-2" />
                        ประวัติการรักษา
                    </TabsTrigger>
                    <TabsTrigger value="gallery">
                        <Camera className="h-4 w-4 mr-2" />
                        Gallery
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
                                        <Input
                                            value={editForm.phone_number || ''}
                                            onChange={(e) => setEditForm({ ...editForm, phone_number: e.target.value })}
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
                                                <SelectItem value="Gold">Gold</SelectItem>
                                                <SelectItem value="Platinum">Platinum</SelectItem>
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
                                                <p className="mt-2 text-sm text-slate-600">📝 {item.note}</p>
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
                                                        <Image
                                                            src={img.image_path}
                                                            alt={img.image_type}
                                                            fill
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

                                                        {/* Delete Button - Only visible on hover */}
                                                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <Button
                                                                variant="destructive"
                                                                size="icon"
                                                                className="h-8 w-8 rounded-full"
                                                                aria-label="ลบรูปภาพ"
                                                                onClick={() => setDeleteId(img.gallery_id)}
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
            </Tabs>
        </div>
    )
}
