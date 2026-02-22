'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CalendarIcon, Plus, ChevronLeft, ChevronRight, Clock, User, Phone, CheckCircle2, XCircle, UserX, MoreHorizontal } from 'lucide-react'
import { format, addDays, subDays } from 'date-fns'
import { th } from 'date-fns/locale'
import { useQuery } from '@tanstack/react-query'
import { AppointmentModal } from '@/components/appointments/appointment-modal'
import { Badge } from '@/components/ui/badge'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useAuthStore } from '@/stores/auth-store'
import { toast } from 'sonner'

interface Appointment {
    id: number
    customer_id: number
    appointment_date: string
    duration_minutes: number
    status: string
    notes: string
    customer: {
        first_name: string
        last_name: string
        hn_code: string
        phone_number: string
    }
}

export default function AppointmentsPage() {
    const token = useAuthStore((state) => state.token)
    const [currentDate, setCurrentDate] = useState(new Date())
    const [isModalOpen, setIsModalOpen] = useState(false)

    // Fetch appointments for the selected date
    const { data: appointments = [], isLoading, refetch } = useQuery<Appointment[]>({
        queryKey: ['appointments', format(currentDate, 'yyyy-MM-dd')],
        queryFn: async () => {
            const res = await fetch(`/api/appointments?date=${currentDate.toISOString()}&view=day`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {}
            })
            if (!res.ok) throw new Error('Failed to fetch appointments')
            const data = await res.json()
            return data.appointments
        }
    })

    const handlePrevDay = () => setCurrentDate(prev => subDays(prev, 1))
    const handleNextDay = () => setCurrentDate(prev => addDays(prev, 1))
    const handleToday = () => setCurrentDate(new Date())

    const getStatusVariant = (status: string) => {
        switch (status) {
            case 'SCHEDULED': return 'default'
            case 'COMPLETED': return 'success'
            case 'CANCELLED': return 'destructive'
            case 'NO_SHOW': return 'secondary'
            default: return 'outline'
        }
    }

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'SCHEDULED': return <Clock className="h-3 w-3 mr-1" />
            case 'COMPLETED': return <CheckCircle2 className="h-3 w-3 mr-1" />
            case 'CANCELLED': return <XCircle className="h-3 w-3 mr-1" />
            case 'NO_SHOW': return <UserX className="h-3 w-3 mr-1" />
            default: return null
        }
    }

    const getStatusColorBorder = (status: string) => {
        switch (status) {
            case 'SCHEDULED': return 'border-l-blue-500 dark:border-l-blue-600'
            case 'COMPLETED': return 'border-l-green-500 dark:border-l-green-600'
            case 'CANCELLED': return 'border-l-red-500 dark:border-l-red-600'
            case 'NO_SHOW': return 'border-l-gray-500 dark:border-l-gray-400'
            default: return 'border-l-border'
        }
    }

    const handleStatusChange = async (id: number, newStatus: string) => {
        try {
            const res = await fetch(`/api/appointments/${id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {})
                },
                body: JSON.stringify({ status: newStatus })
            })
            if (!res.ok) throw new Error('Failed to update status')
            toast.success('อัปเดตสถานะสำเร็จ')
            refetch()
        } catch (error) {
            console.error(error)
            toast.error('อัปเดตสถานะไม่สำเร็จ')
        }
    }

    const getStatusText = (status: string) => {
        switch (status) {
            case 'SCHEDULED': return 'นัดหมายแล้ว'
            case 'COMPLETED': return 'เสร็จสิ้น'
            case 'CANCELLED': return 'ยกเลิก'
            case 'NO_SHOW': return 'ไม่มาตามนัด'
            default: return status
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">ตารางนัดหมาย</h2>
                    <p className="text-muted-foreground">จัดการและติดตามการนัดหมายของลูกค้า</p>
                </div>
                <Button onClick={() => setIsModalOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    เพิ่มนัดหมายใหม่
                </Button>
            </div>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                    <div className="flex items-center space-x-2">
                        <Button variant="outline" size="icon" onClick={handlePrevDay}>
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={handleToday}>
                            วันนี้
                        </Button>
                        <Button variant="outline" size="icon" onClick={handleNextDay}>
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                    <CardTitle className="text-xl font-semibold flex items-center">
                        <CalendarIcon className="mr-2 h-5 w-5 text-primary" />
                        {format(currentDate, 'EEEE d MMMM yyyy', { locale: th })}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="text-center py-10 text-muted-foreground animate-pulse">
                            กำลังโหลดตารางนัดหมาย...
                        </div>
                    ) : appointments.length === 0 ? (
                        <div className="text-center py-20 border-2 border-dashed rounded-lg">
                            <CalendarIcon className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                            <h3 className="text-lg font-medium">ไม่มีนัดหมายในวันนี้</h3>
                            <p className="text-sm text-muted-foreground mt-1">คลิกที่ปุ่มเพิ่มนัดหมายด้านบนเพื่อสร้างรายการใหม่</p>
                            <Button variant="outline" className="mt-4" onClick={() => setIsModalOpen(true)}>
                                เพิ่มนัดหมายแรกเลย
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {appointments.map((app) => (
                                <div key={app.id} className={`flex flex-col sm:flex-row p-4 border rounded-lg gap-4 items-start sm:items-center bg-card hover:bg-accent/50 transition-colors border-l-4 ${getStatusColorBorder(app.status)}`}>
                                    <div className="min-w-[120px] shrink-0 text-center sm:text-left border-b sm:border-b-0 sm:border-r pb-3 sm:pb-0 sm:pr-4">
                                        <div className="text-lg font-bold text-primary flex items-center justify-center sm:justify-start gap-1">
                                            <Clock className="h-4 w-4" />
                                            {format(new Date(app.appointment_date), 'HH:mm')}
                                        </div>
                                        <div className="text-xs text-muted-foreground mt-1">
                                            {app.duration_minutes} นาที
                                        </div>
                                    </div>

                                    <div className="flex-1 space-y-1">
                                        <div className="flex items-center gap-2">
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <span className="font-semibold text-base cursor-pointer hover:underline decoration-primary underline-offset-4">
                                                        {app.customer.first_name} {app.customer.last_name}
                                                    </span>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-80 p-4">
                                                    <div className="space-y-3">
                                                        <h4 className="font-semibold text-sm leading-none flex items-center justify-between">
                                                            ข้อมูลลูกค้า
                                                            <Badge variant="outline" className="text-xs">HN: {app.customer.hn_code}</Badge>
                                                        </h4>
                                                        <div className="grid grid-cols-2 gap-2 text-sm mt-2">
                                                            <div className="text-muted-foreground flex items-center gap-1"><User className="h-3 w-3" /> ชื่อ:</div>
                                                            <div className="font-medium">{app.customer.first_name} {app.customer.last_name}</div>
                                                            <div className="text-muted-foreground flex items-center gap-1"><Phone className="h-3 w-3" /> โทร:</div>
                                                            <div className="font-medium">{app.customer.phone_number || '-'}</div>
                                                        </div>
                                                        <Button variant="secondary" className="w-full mt-2" size="sm" onClick={() => window.location.href = `/patients/${app.customer_id}`}>
                                                            ดูประวัติลูกค้า
                                                        </Button>
                                                    </div>
                                                </PopoverContent>
                                            </Popover>
                                            <Badge variant="outline" className="text-xs">HN: {app.customer.hn_code}</Badge>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-sm text-muted-foreground">
                                            <span className="flex items-center gap-1">
                                                <Phone className="h-3.5 w-3.5" />
                                                {app.customer.phone_number}
                                            </span>
                                            {app.notes && (
                                                <span className="text-foreground">หมายเหตุ: {app.notes}</span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="shrink-0 flex items-center sm:self-center w-full sm:w-auto mt-2 sm:mt-0 justify-between sm:justify-end gap-2">
                                        <Badge variant={getStatusVariant(app.status) as any} className="flex items-center">
                                            {getStatusIcon(app.status)}
                                            {getStatusText(app.status)}
                                        </Badge>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => handleStatusChange(app.id, 'COMPLETED')}>
                                                    <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" /> มาร์คว่าเสร็จสิ้น
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleStatusChange(app.id, 'NO_SHOW')}>
                                                    <UserX className="h-4 w-4 mr-2 text-gray-500" /> ไม่มาตามนัด
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleStatusChange(app.id, 'CANCELLED')} className="text-destructive focus:text-destructive">
                                                    <XCircle className="h-4 w-4 mr-2" /> ยกเลิกนัดหมาย
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            <AppointmentModal
                open={isModalOpen}
                onOpenChange={setIsModalOpen}
                onSuccess={refetch}
                initialDate={currentDate}
            />
        </div>
    )
}
