'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar as CalendarIcon, Plus, ChevronLeft, ChevronRight, Filter } from 'lucide-react'
import { format, addDays, subDays, addWeeks, subWeeks, addMonths, subMonths } from 'date-fns'
import { th } from 'date-fns/locale'
import { useQuery } from '@tanstack/react-query'
import { AppointmentModal } from '@/components/appointments/appointment-modal'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarUI } from "@/components/ui/calendar"
import { useAuthStore } from '@/stores/auth-store'
import { toast } from 'sonner'
import { Appointment } from '@/types'

import { DailyTimeline } from '@/components/appointments/daily-timeline'
import { WeeklyTimeline } from '@/components/appointments/weekly-timeline'
import { MonthlyCalendar } from '@/components/appointments/monthly-calendar'
import { CalendarCheck } from 'lucide-react';
type ViewType = 'day' | 'week' | 'month';

export default function AppointmentsPage() {
    const token = useAuthStore((state) => state.token)
    const [currentDate, setCurrentDate] = useState(new Date())
    const [view, setView] = useState<ViewType>('day')

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [selectedDateForModal, setSelectedDateForModal] = useState<Date | undefined>(undefined)
    const [editingAppointmentId, setEditingAppointmentId] = useState<number | undefined>(undefined)

    // Fetch appointments
    // We send the view type so the API could theoretically return a wider range of dates
    const { data: appointments = [], isLoading, refetch } = useQuery<Appointment[]>({
        queryKey: ['appointments', format(currentDate, 'yyyy-MM-dd'), view],
        queryFn: async () => {
            const res = await fetch(`/api/appointments?date=${currentDate.toISOString()}&view=${view}`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {}
            })
            if (!res.ok) throw new Error('Failed to fetch appointments')
            const data = await res.json()
            return data.appointments
        }
    })

    const handlePrev = () => {
        if (view === 'day') setCurrentDate(prev => subDays(prev, 1))
        if (view === 'week') setCurrentDate(prev => subWeeks(prev, 1))
        if (view === 'month') setCurrentDate(prev => subMonths(prev, 1))
    }

    const handleNext = () => {
        if (view === 'day') setCurrentDate(prev => addDays(prev, 1))
        if (view === 'week') setCurrentDate(prev => addWeeks(prev, 1))
        if (view === 'month') setCurrentDate(prev => addMonths(prev, 1))
    }

    const handleToday = () => setCurrentDate(new Date())

    const handleTimeSlotClick = (date: Date) => {
        setSelectedDateForModal(date)
        setEditingAppointmentId(undefined)
        setIsModalOpen(true)
    }

    const handleAppointmentClick = (appointment: Appointment) => {
        setSelectedDateForModal(new Date(appointment.appointment_date))
        setEditingAppointmentId(appointment.id)
        setIsModalOpen(true)
    }

    const handleAppointmentDrop = async (appointmentId: number, newDate: Date) => {
        try {
            const res = await fetch(`/api/appointments/${appointmentId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {})
                },
                body: JSON.stringify({ appointment_date: newDate.toISOString() })
            })
            if (!res.ok) throw new Error('Failed to reschedule')
            toast.success('เลื่อนนัดหมายสำเร็จ')
            refetch()
        } catch (error) {
            console.error(error)
            toast.error('ไม่สามารถเลื่อนนัดหมายได้')
        }
    }

    const getFormattedDateRange = () => {
        if (view === 'day') {
            return format(currentDate, 'EEEE d MMMM yyyy', { locale: th })
        }
        if (view === 'month') {
            return format(currentDate, 'MMMM yyyy', { locale: th })
        }
        return `สัปดาห์ของ ${format(currentDate, 'd MMMM yyyy', { locale: th })}`
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <CalendarCheck className="h-6 w-6 text-primary" />
                        ตารางนัดหมาย
                    </h2>
                    <p className="text-muted-foreground">จัดการและติดตามการนัดหมายของลูกค้าในแต่ละวัน</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon">
                        <Filter className="h-4 w-4" />
                    </Button>
                    <Button onClick={() => handleTimeSlotClick(currentDate)}>
                        <Plus className="h-4 w-4 mr-2" />
                        เพิ่มนัดหมาย
                    </Button>
                </div>
            </div>

            <Card>
                <div className="flex flex-col sm:flex-row items-center justify-between p-4 border-b gap-4">
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="icon" onClick={handlePrev}>
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={handleToday}>
                            วันนี้
                        </Button>
                        <Button variant="outline" size="icon" onClick={handleNext}>
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="ghost" className="text-lg font-semibold ml-2 min-w-[200px] justify-start hover:bg-muted/50">
                                    {getFormattedDateRange()}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <CalendarUI
                                    mode="single"
                                    selected={currentDate}
                                    onSelect={(date) => date && setCurrentDate(date)}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                    </div>

                    <Tabs value={view} onValueChange={(v) => setView(v as ViewType)} className="w-full sm:w-auto">
                        <TabsList className="grid w-full sm:w-auto grid-cols-3">
                            <TabsTrigger value="day">รายวัน</TabsTrigger>
                            <TabsTrigger value="week">รายสัปดาห์</TabsTrigger>
                            <TabsTrigger value="month">รายเดือน</TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>

                <CardContent className="p-0 sm:p-4">
                    {isLoading ? (
                        <div className="h-[600px] flex items-center justify-center">
                            <div className="animate-pulse flex flex-col items-center">
                                <CalendarIcon className="h-10 w-10 text-muted-foreground/30 mb-4" />
                                <p className="text-muted-foreground">กำลังโหลดตาราง...</p>
                            </div>
                        </div>
                    ) : (
                        <div className="mt-4 sm:mt-0">
                            {view === 'day' && (
                                <DailyTimeline
                                    date={currentDate}
                                    appointments={appointments}
                                    onTimeSlotClick={handleTimeSlotClick}
                                    onAppointmentClick={handleAppointmentClick}
                                    onAppointmentDrop={handleAppointmentDrop}
                                />
                            )}
                            {view === 'week' && (
                                <WeeklyTimeline
                                    date={currentDate}
                                    appointments={appointments}
                                    onTimeSlotClick={handleTimeSlotClick}
                                    onAppointmentClick={handleAppointmentClick}
                                    onAppointmentDrop={handleAppointmentDrop}
                                />
                            )}
                            {view === 'month' && (
                                <MonthlyCalendar
                                    date={currentDate}
                                    appointments={appointments}
                                    onTimeSlotClick={handleTimeSlotClick}
                                    onAppointmentClick={handleAppointmentClick}
                                    onAppointmentDrop={handleAppointmentDrop}
                                />
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            <AppointmentModal
                open={isModalOpen}
                onOpenChange={setIsModalOpen}
                onSuccess={refetch}
                initialDate={selectedDateForModal}
                appointmentId={editingAppointmentId}
            />
        </div>
    )
}
