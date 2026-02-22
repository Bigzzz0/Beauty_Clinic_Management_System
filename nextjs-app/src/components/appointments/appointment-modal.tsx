'use client'

import { useState, useEffect } from 'react'
import { Plus, X, Calendar as CalendarIcon, Clock, User, FileText } from 'lucide-react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/auth-store'

interface AppointmentModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess: () => void
    initialDate?: Date
    appointmentId?: number
}

interface Customer {
    customer_id: number
    first_name: string
    last_name: string
    hn_code: string
    phone_number?: string
}

export function AppointmentModal({ open, onOpenChange, onSuccess, initialDate, appointmentId }: AppointmentModalProps) {
    const token = useAuthStore((state) => state.token)

    const [isLoading, setIsLoading] = useState(false)
    const [selectedCustomer, setSelectedCustomer] = useState<string>('')
    const [customerSearch, setCustomerSearch] = useState<string>('')
    const [isDropdownOpen, setIsDropdownOpen] = useState(false)
    const [appointmentDate, setAppointmentDate] = useState<string>(
        initialDate ? initialDate.toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16)
    )
    const [duration, setDuration] = useState('60')
    const [notes, setNotes] = useState('')

    // Fetch customers
    const { data: customers = [] } = useQuery<Customer[]>({
        queryKey: ['customers-for-appointments'],
        queryFn: async () => {
            const res = await fetch('/api/customers?limit=100', {
                headers: token ? { Authorization: `Bearer ${token}` } : {}
            })
            if (!res.ok) return []
            const payload = await res.json()
            return payload.data || []
        },
        enabled: open
    })

    // Reset when open changes
    useEffect(() => {
        if (open) {
            setSelectedCustomer('')
            setCustomerSearch('')
            setIsDropdownOpen(false)
            setAppointmentDate(initialDate ? initialDate.toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16))
            setDuration('60')
            setNotes('')
        }
    }, [open, initialDate])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedCustomer) {
            toast.error('กรุณาเลือกลูกค้า')
            return
        }

        setIsLoading(true)
        try {
            // Convert to proper Date object, then to ISO string
            const dateObj = new Date(appointmentDate)

            const res = await fetch('/api/appointments', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {})
                },
                body: JSON.stringify({
                    customer_id: parseInt(selectedCustomer),
                    appointment_date: dateObj.toISOString(),
                    duration_minutes: parseInt(duration),
                    notes: notes || null
                })
            })

            if (!res.ok) throw new Error('บันทึกผิดพลาด')

            toast.success('สร้างนัดหมายสำเร็จ')
            onSuccess()
            onOpenChange(false)
        } catch (error) {
            console.error(error)
            toast.error('ไม่สามารถสร้างนัดหมายได้')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>เพิ่มตารางนัดหมาย</DialogTitle>
                    <DialogDescription>
                        ระบุข้อมูลลูกค้า วันเวลา และรายละเอียดการนัดหมาย
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label>ลูกค้า</Label>
                        <div className="relative">
                            <Input
                                placeholder="พิมพ์ชื่อ, นามสกุล หรือ HN..."
                                value={customerSearch}
                                onChange={(e) => {
                                    setCustomerSearch(e.target.value)
                                    setSelectedCustomer('')
                                    setIsDropdownOpen(true)
                                }}
                                onFocus={() => setIsDropdownOpen(true)}
                                onBlur={() => setTimeout(() => setIsDropdownOpen(false), 200)}
                            />
                            {isDropdownOpen && (
                                <div className="absolute top-full mt-1 left-0 z-50 w-full overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md max-h-48 overflow-y-auto">
                                    {(() => {
                                        const term = customerSearch.toLowerCase()
                                        const filtered = customers.filter(c =>
                                            `${c.hn_code} ${c.first_name} ${c.last_name} ${c.phone_number || ''}`.toLowerCase().includes(term)
                                        )
                                        if (filtered.length === 0) {
                                            return <div className="p-4 text-center text-sm text-muted-foreground">ไม่พบข้อมูลลูกค้า</div>
                                        }
                                        return filtered.map(c => (
                                            <div
                                                key={c.customer_id}
                                                className="relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 px-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                                                onClick={() => {
                                                    setSelectedCustomer(c.customer_id.toString())
                                                    setCustomerSearch(`${c.hn_code} - ${c.first_name} ${c.last_name}`)
                                                    setIsDropdownOpen(false)
                                                }}
                                            >
                                                <div className="flex flex-col">
                                                    <span className="font-medium">{c.first_name} {c.last_name}</span>
                                                    <span className="text-xs text-muted-foreground">{c.hn_code} {c.phone_number ? `· ${c.phone_number}` : ''}</span>
                                                </div>
                                            </div>
                                        ))
                                    })()}
                                </div>
                            )}
                        </div>
                        {!selectedCustomer && customerSearch && !isDropdownOpen && (
                            <p className="text-xs text-destructive">กรุณาเลือกลูกค้าจากรายการด้วยการคลิก</p>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>วันและเวลา</Label>
                            <Input
                                type="datetime-local"
                                value={appointmentDate}
                                onChange={(e) => setAppointmentDate(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>ระยะเวลา (นาที)</Label>
                            <Select value={duration} onValueChange={setDuration}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="30">30 นาที</SelectItem>
                                    <SelectItem value="60">1 ชั่วโมง</SelectItem>
                                    <SelectItem value="90">1.5 ชั่วโมง</SelectItem>
                                    <SelectItem value="120">2 ชั่วโมง</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>หมายเหตุ</Label>
                        <Input
                            placeholder="ระบุสิ่งที่ต้องการทำ..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                        />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
                            ยกเลิก
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? 'กำลังบันทึก...' : 'บันทึกนัดหมาย'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
