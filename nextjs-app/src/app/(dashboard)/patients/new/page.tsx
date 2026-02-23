'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, User, Phone, MapPin, Cake, AlertTriangle, CreditCard } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAuthStore } from '@/stores/auth-store'
import { toast } from 'sonner'

export default function NewPatientPage() {
    const router = useRouter()
    const token = useAuthStore((s) => s.token)
    const [isLoading, setIsLoading] = useState(false)

    // Form state
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        nickname: '',
        phone_number: '',
        id_card_number: '',
        birth_date: '',
        address: '',
        drug_allergy: '',
        underlying_disease: '',
        member_level: 'General'
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            const res = await fetch('/api/customers', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify(formData),
            })

            if (!res.ok) {
                const error = await res.json()
                throw new Error(error.error || 'Failed to create patient')
            }

            toast.success('เพิ่มคนไข้สำเร็จ')
            router.push('/patients')
        } catch (error) {
            console.error(error)
            toast.error(error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการเพิ่มคนไข้')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold">ลงทะเบียนคนไข้ใหม่</h1>
                    <p className="text-muted-foreground">กรอกข้อมูลเพื่อสร้างประวัติคนไข้</p>
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="grid gap-6">
                    {/* Personal Info */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <User className="h-5 w-5 text-primary" />
                                ข้อมูลส่วนตัว
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="first_name" className="after:content-['*'] after:ml-0.5 after:text-red-500">
                                    ชื่อจริง
                                </Label>
                                <Input
                                    id="first_name"
                                    required
                                    maxLength={50}
                                    value={formData.first_name}
                                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                                    placeholder="ระบุชื่อจริง"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="last_name" className="after:content-['*'] after:ml-0.5 after:text-red-500">
                                    นามสกุล
                                </Label>
                                <Input
                                    id="last_name"
                                    required
                                    maxLength={50}
                                    value={formData.last_name}
                                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                                    placeholder="ระบุนามสกุล"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="nickname">ชื่อเล่น</Label>
                                <Input
                                    id="nickname"
                                    value={formData.nickname}
                                    onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                                    placeholder="ระบุชื่อเล่น"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="id_card_number">เลขบัตรประชาชน</Label>
                                <div className="relative">
                                    <CreditCard className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="id_card_number"
                                        className="pl-9"
                                        value={formData.id_card_number}
                                        onChange={(e) => setFormData({ ...formData, id_card_number: e.target.value })}
                                        placeholder="ระบุเลขบัตรประชาชน 13 หลัก"
                                        maxLength={13}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="birth_date">วันเกิด</Label>
                                <div className="relative">
                                    <Cake className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="birth_date"
                                        type="date"
                                        className="pl-9"
                                        value={formData.birth_date}
                                        onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="member_level">ระดับสมาชิก</Label>
                                <Select
                                    value={formData.member_level}
                                    onValueChange={(val) => setFormData({ ...formData, member_level: val })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="เลือกระดับสมาชิก" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="General">General</SelectItem>
                                        <SelectItem value="Gold">Gold</SelectItem>
                                        <SelectItem value="Platinum">Platinum</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Contact Info */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Phone className="h-5 w-5 text-primary" />
                                ข้อมูลติดต่อ
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="phone_number" className="after:content-['*'] after:ml-0.5 after:text-red-500">
                                    เบอร์โทรศัพท์
                                </Label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="phone_number"
                                        required
                                        className="pl-9"
                                        value={formData.phone_number}
                                        onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                                        placeholder="08x-xxx-xxxx"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <Label htmlFor="address">ที่อยู่</Label>
                                <div className="relative">
                                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Textarea
                                        id="address"
                                        className="min-h-[80px] pl-9"
                                        value={formData.address}
                                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                        placeholder="บ้านเลขที่, ถนน, แขวง/ตำบล, เขต/อำเภอ, จังหวัด..."
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Medical Info */}
                    <Card className="border-red-100">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-red-700">
                                <AlertTriangle className="h-5 w-5" />
                                ข้อมูลทางการแพทย์
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="drug_allergy" className="text-red-700">ประวัติแพ้ยา</Label>
                                <Textarea
                                    id="drug_allergy"
                                    className="border-red-200 focus-visible:ring-red-500"
                                    value={formData.drug_allergy}
                                    onChange={(e) => setFormData({ ...formData, drug_allergy: e.target.value })}
                                    placeholder="ระบุชื่อยาที่แพ้ (ถ้ามี)"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="underlying_disease">โรคประจำตัว</Label>
                                <Textarea
                                    id="underlying_disease"
                                    value={formData.underlying_disease}
                                    onChange={(e) => setFormData({ ...formData, underlying_disease: e.target.value })}
                                    placeholder="ระบุโรคประจำตัว (ถ้ามี)"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex justify-end gap-4">
                        <Button type="button" variant="outline" onClick={() => router.back()}>
                            ยกเลิก
                        </Button>
                        <Button type="submit" disabled={isLoading} className="bg-primary hover:bg-primary/90">
                            {isLoading ? (
                                <>
                                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                    กำลังบันทึก...
                                </>
                            ) : (
                                <>
                                    <Save className="mr-2 h-4 w-4" />
                                    บันทึกข้อมูล
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </form>
        </div>
    )
}
