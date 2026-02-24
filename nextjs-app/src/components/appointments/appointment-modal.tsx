'use client'

import { useState, useEffect } from 'react'
import { Plus, X, Calendar as CalendarIcon, Clock, User, FileText, AlertCircle, Check, XCircle, UserX } from 'lucide-react'
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { ScrollArea } from '@/components/ui/scroll-area'
import { format, isSameDay } from 'date-fns'
import { th } from 'date-fns/locale'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/auth-store'
import { cn } from '@/lib/utils'
import { Appointment } from '@/types'

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

interface Staff {
    staff_id: number
    full_name: string
    position: string
}

export function AppointmentModal({ open, onOpenChange, onSuccess, initialDate, appointmentId }: AppointmentModalProps) {
    const token = useAuthStore((state) => state.token)

    const [isLoading, setIsLoading] = useState(false)
    const [selectedCustomer, setSelectedCustomer] = useState<string>('')
    const [customerSearch, setCustomerSearch] = useState<string>('')
    const [isDropdownOpen, setIsDropdownOpen] = useState(false)

    // Upgraded DateTime state
    const [date, setDate] = useState<Date | undefined>(initialDate || new Date())
    const [time, setTime] = useState<string>(initialDate ? format(initialDate, 'HH:mm') : '09:00')
    const [duration, setDuration] = useState('60')
    const [notes, setNotes] = useState('')
    const [currentStatus, setCurrentStatus] = useState<string>('SCHEDULED')

    // Staff assignments
    const [selectedDoctor, setSelectedDoctor] = useState<string>('none')
    const [selectedTherapist, setSelectedTherapist] = useState<string>('none')

    const timeSlots = Array.from({ length: 48 }).map((_, i) => {
        const hour = Math.floor(i / 2).toString().padStart(2, '0')
        const minute = i % 2 === 0 ? '00' : '30'
        return `${hour}:${minute}`
    })

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

    // Fetch staff
    const { data: staffList = [] } = useQuery<Staff[]>({
        queryKey: ['staff-for-appointments'],
        queryFn: async () => {
            const res = await fetch('/api/staff', {
                headers: token ? { Authorization: `Bearer ${token}` } : {}
            })
            if (!res.ok) return []
            return res.json()
        },
        enabled: open
    })

    const doctors = staffList.filter(s => s.position === 'Doctor')
    const therapists = staffList.filter(s => s.position === 'Therapist')

    // Extract time overlap logic
    const { data: currentDayAppointments = [] } = useQuery<Appointment[]>({
        queryKey: ['appointments-overlap', date ? format(date, 'yyyy-MM-dd') : ''],
        queryFn: async () => {
            if (!date) return []
            const res = await fetch(`/api/appointments?date=${date.toISOString()}&view=day`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {}
            })
            if (!res.ok) return []
            const payload = await res.json()
            return payload.appointments
        },
        enabled: open && !!date
    })



    // Reset when open changes or if we were editing an existing one
    useEffect(() => {
        if (open) {
            if (appointmentId) {
                // Fetch specific appointment details if editing
                const fetchAppointment = async () => {
                    try {
                        const res = await fetch(`/api/appointments/${appointmentId}`, {
                            headers: token ? { Authorization: `Bearer ${token}` } : {}
                        })
                        if (res.ok) {
                            const data = await res.json()
                            setSelectedCustomer(data.customer_id.toString())
                            setCustomerSearch(`${data.customer.hn_code} - ${data.customer.first_name} ${data.customer.last_name}`)
                            const d = new Date(data.appointment_date)
                            setDate(d)
                            setTime(format(d, 'HH:mm'))
                            setDuration(data.duration_minutes.toString())
                            setNotes(data.notes || '')
                            setCurrentStatus(data.status || 'SCHEDULED')
                            setSelectedDoctor(data.doctor_id ? data.doctor_id.toString() : 'none')
                            setSelectedTherapist(data.therapist_id ? data.therapist_id.toString() : 'none')
                        }
                    } catch (e) {
                        console.error("Failed to load appointment details", e)
                    }
                }
                fetchAppointment()
            } else {
                setSelectedCustomer('')
                setCustomerSearch('')
                setIsDropdownOpen(false)
                setDate(initialDate || new Date())
                setTime(initialDate ? format(initialDate, 'HH:mm') : '09:00')
                setDuration('60')
                setNotes('')
                setCurrentStatus('SCHEDULED')
                setSelectedDoctor('none')
                setSelectedTherapist('none')
            }
        }
    }, [open, initialDate, appointmentId, token])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedCustomer) {
            toast.error('กรุณาเลือกลูกค้า')
            return
        }
        if (!date || !time) {
            toast.error('กรุณาระบุวันและเวลา')
            return
        }

        setIsLoading(true)
        try {
            const [hours, minutes] = time.split(':').map(Number)
            const finalDate = new Date(date)
            finalDate.setHours(hours, minutes, 0, 0)

            const bodyData = {
                customer_id: parseInt(selectedCustomer),
                appointment_date: finalDate.toISOString(),
                duration_minutes: parseInt(duration),
                notes: notes || null,
                doctor_id: selectedDoctor === 'none' ? null : parseInt(selectedDoctor),
                therapist_id: selectedTherapist === 'none' ? null : parseInt(selectedTherapist)
            }

            let res;
            if (appointmentId) {
                res = await fetch(`/api/appointments/${appointmentId}`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        ...(token ? { Authorization: `Bearer ${token}` } : {})
                    },
                    body: JSON.stringify(bodyData)
                })
            } else {
                res = await fetch('/api/appointments', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        ...(token ? { Authorization: `Bearer ${token}` } : {})
                    },
                    body: JSON.stringify(bodyData)
                })
            }

            if (!res.ok) {
                const errorData = await res.json().catch(() => null);
                console.error('API Error Response:', errorData);
                throw new Error('บันทึกผิดพลาด')
            }

            toast.success(appointmentId ? 'อัปเดตนัดหมายสำเร็จ' : 'สร้างนัดหมายสำเร็จ')
            onSuccess()
            onOpenChange(false)
        } catch (error) {
            console.error(error)
            toast.error(appointmentId ? 'ไม่สามารถอัปเดตนัดหมายได้' : 'ไม่สามารถสร้างนัดหมายได้')
        } finally {
            setIsLoading(false)
        }
    }
    const handleUpdateStatus = async (newStatus: string) => {
        if (!appointmentId) return
        setIsLoading(true)
        try {
            const res = await fetch(`/api/appointments/${appointmentId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {})
                },
                body: JSON.stringify({ status: newStatus })
            })
            if (!res.ok) throw new Error()
            toast.success('อัปเดตสถานะสำเร็จ')
            onSuccess()
            onOpenChange(false)
        } catch (error) {
            toast.error('ไม่สามารถอัปเดตสถานะได้')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{appointmentId ? 'แก้ไขนัดหมาย' : 'เพิ่มตารางนัดหมาย'}</DialogTitle>
                    <DialogDescription>
                        ระบุข้อมูลลูกค้า วันเวลา และแพทย์/ผู้เชี่ยวชาญ ที่ให้การรักษา
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 pt-4">
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
                                onFocus={() => {
                                    if (!selectedCustomer) setIsDropdownOpen(true)
                                }}
                                onBlur={() => setTimeout(() => setIsDropdownOpen(false), 200)}
                            />
                            {isDropdownOpen && !selectedCustomer && (
                                <div
                                    className="absolute top-full mt-1 left-0 z-50 w-full overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md max-h-48 overflow-y-auto"
                                    onMouseDown={(e) => e.preventDefault()}
                                >
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
                        <div className="space-y-2 flex flex-col">
                            <Label>วันที่นัดหมาย</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant={"outline"}
                                        className={cn(
                                            "w-full justify-start text-left font-normal",
                                            !date && "text-muted-foreground"
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {date ? format(date, "PPP", { locale: th }) : <span>เลือกวันที่</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={date}
                                        onSelect={setDate}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-2">
                                <Label>เวลา</Label>
                                <Select value={time} onValueChange={setTime}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="เวลา" />
                                    </SelectTrigger>
                                    <SelectContent className="max-h-48">
                                        {timeSlots.map((t) => (
                                            <SelectItem key={t} value={t}>{t}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>ระยะเวลา</Label>
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
                    </div>



                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>แพทย์ผู้ดูแล (Doctor)</Label>
                            <Select value={selectedDoctor} onValueChange={setSelectedDoctor}>
                                <SelectTrigger>
                                    <SelectValue placeholder="เลือกแพทย์" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">ไม่ระบุ</SelectItem>
                                    {doctors.map(d => (
                                        <SelectItem key={d.staff_id} value={d.staff_id.toString()}>
                                            พญ. {d.full_name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>ผู้เชี่ยวชาญ (Therapist)</Label>
                            <Select value={selectedTherapist} onValueChange={setSelectedTherapist}>
                                <SelectTrigger>
                                    <SelectValue placeholder="เลือกผู้เชี่ยวชาญ" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">ไม่ระบุ</SelectItem>
                                    {therapists.map(t => (
                                        <SelectItem key={t.staff_id} value={t.staff_id.toString()}>
                                            {t.full_name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>หมายเหตุ</Label>
                        <Input
                            placeholder="ระบุสิ่งที่ต้องการทำ หรืออาการเบื้องต้น..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                        />
                    </div>

                    <DialogFooter className="mt-6 flex flex-col sm:flex-row sm:justify-between items-start sm:items-center w-full gap-4">
                        <div className="flex-1 flex flex-wrap gap-2 w-full sm:w-auto justify-center sm:justify-start">
                            {appointmentId && currentStatus !== 'COMPLETED' && currentStatus !== 'CANCELLED' && (
                                <>
                                    <Button type="button" className="bg-green-600 hover:bg-green-700 text-white shrink-0" onClick={() => handleUpdateStatus('COMPLETED')} disabled={isLoading}>
                                        <Check className="w-4 h-4 mr-2" />
                                        สำเร็จ
                                    </Button>
                                    <Button type="button" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50 shrink-0" onClick={() => handleUpdateStatus('CANCELLED')} disabled={isLoading}>
                                        <XCircle className="w-4 h-4 mr-2" />
                                        ยกเลิกนัด
                                    </Button>
                                    <Button type="button" variant="outline" className="text-orange-600 border-orange-200 hover:bg-orange-50 shrink-0" onClick={() => handleUpdateStatus('NO_SHOW')} disabled={isLoading}>
                                        <UserX className="w-4 h-4 mr-2" />
                                        ไม่มาตามนัด
                                    </Button>
                                </>
                            )}
                        </div>
                        <div className="flex gap-2 w-full sm:w-auto justify-end">
                            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={isLoading}>
                                ปิด
                            </Button>
                            <Button type="submit" disabled={isLoading}>
                                {isLoading ? 'กำลังบันทึก...' : 'บันทึกนัดหมาย'}
                            </Button>
                        </div>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
