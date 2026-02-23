'use client'

import { useState } from 'react'
import { KeyRound, Save, Eye, EyeOff } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/auth-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

export default function PasswordSettingsPage() {
    const router = useRouter()
    const { user, token } = useAuthStore()

    const [currentPassword, setCurrentPassword] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')

    const [showCurrent, setShowCurrent] = useState(false)
    const [showNew, setShowNew] = useState(false)
    const [showConfirm, setShowConfirm] = useState(false)

    const [isLoading, setIsLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!currentPassword || !newPassword || !confirmPassword) {
            toast.error('กรุณากรอกข้อมูลให้ครบถ้วน')
            return
        }

        if (newPassword !== confirmPassword) {
            toast.error('รหัสผ่านใหม่ไม่ตรงกัน')
            return
        }

        if (newPassword.length < 6) {
            toast.error('รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 6 ตัวอักษร')
            return
        }

        try {
            setIsLoading(true)
            const res = await fetch(`/api/staff/${user?.staff_id}/password`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    currentPassword,
                    newPassword
                })
            })

            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.error || 'เกิดข้อผิดพลาด')
            }

            toast.success('เปลี่ยนรหัสผ่านสำเร็จ')
            setCurrentPassword('')
            setNewPassword('')
            setConfirmPassword('')

            setTimeout(() => router.push('/settings'), 1500)

        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="space-y-6 max-w-2xl mx-auto">
            <div className="flex items-center gap-2">
                <KeyRound className="h-6 w-6 text-primary" />
                <div>
                    <h1 className="text-2xl font-bold">เปลี่ยนรหัสผ่าน</h1>
                    <p className="text-muted-foreground">จัดการรหัสผ่านสำหรับบัญชีของคุณ</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>ตั้งค่ารหัสผ่านใหม่</CardTitle>
                    <CardDescription>
                        รหัสผ่านควรมีความยาวอย่างน้อย 6 ตัวอักษร
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label>รหัสผ่านปัจจุบัน</Label>
                            <div className="relative">
                                <Input
                                    type={showCurrent ? 'text' : 'password'}
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    placeholder="รหัสผ่านปัจจุบัน"
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="absolute right-0 top-0"
                                    onClick={() => setShowCurrent(!showCurrent)}
                                >
                                    {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </Button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>รหัสผ่านใหม่</Label>
                            <div className="relative">
                                <Input
                                    type={showNew ? 'text' : 'password'}
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="รหัสผ่านใหม่"
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="absolute right-0 top-0"
                                    onClick={() => setShowNew(!showNew)}
                                >
                                    {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </Button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>ยืนยันรหัสผ่านใหม่</Label>
                            <div className="relative">
                                <Input
                                    type={showConfirm ? 'text' : 'password'}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="ยืนยันรหัสผ่านใหม่อีกครั้ง"
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="absolute right-0 top-0"
                                    onClick={() => setShowConfirm(!showConfirm)}
                                >
                                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </Button>
                            </div>
                        </div>

                        <div className="pt-4 flex gap-2">
                            <Button type="button" variant="outline" onClick={() => router.back()} className="flex-1">
                                ยกเลิก
                            </Button>
                            <Button type="submit" disabled={isLoading} className="flex-1">
                                <Save className="h-4 w-4 mr-2" />
                                {isLoading ? 'กำลังบันทึก...' : 'บันทึกการเปลี่ยนแปลง'}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
