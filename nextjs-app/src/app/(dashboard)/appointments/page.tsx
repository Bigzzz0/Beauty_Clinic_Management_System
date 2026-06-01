'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar as CalendarIcon, Plus, ChevronLeft, ChevronRight, Filter, User, Download, Bell, BellOff } from 'lucide-react'
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
type StatusFilter = 'ALL' | 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';

export default function AppointmentsPage() {
    const token = useAuthStore((state) => state.token)
    const [currentDate, setCurrentDate] = useState(new Date())
    const [view, setView] = useState<ViewType>('day')
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL')

    // Live Web Notification Alerts Support
    const [permissionStatus, setPermissionStatus] = useState<NotificationPermission | 'unsupported'>('default')
    const [notifiedIds, setNotifiedIds] = useState<number[]>([])

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

    const handleExport = () => {
        if (!appointments || appointments.length === 0) return;

        const formatCSVCell = (val: any) => {
            const str = String(val ?? '');
            if (str.includes(',') || str.includes('"') || str.includes('\n')) {
                return `"${str.replace(/"/g, '""')}"`;
            }
            return str;
        };

        const viewLabel = view === 'day' ? 'รายวัน' : view === 'week' ? 'รายสัปดาห์' : 'รายเดือน';

        const metadata = [
            ['รายงานตารางนัดหมายคนไข้ (Patient Appointments Report)'],
            ['วันที่นัดหมายอ้างอิง', format(currentDate, 'yyyy-MM-dd')],
            ['ประเภทมุมมอง', viewLabel],
            ['จำนวนรายการนัดหมายที่โหลด', `${appointments.length} รายการ`],
            ['วันที่ดึงรายงาน', new Date().toLocaleString('th-TH')],
            [], // เว้นบรรทัด
        ];

        const metadataRows = metadata.map(row => row.map(formatCSVCell).join(','));
        const headers = ['วันเวลานัดหมาย', 'ระยะเวลา (นาที)', 'รหัสคนไข้ (HN)', 'ชื่อ-นามสกุล คนไข้', 'เบอร์โทร', 'สถานะการนัดหมาย', 'แพทย์ผู้ดูแล', 'ผู้เชี่ยวชาญ/ผู้บำบัด', 'หมายเหตุ'];
        
        const dataRows = appointments.map(app => {
            const dateStr = app.appointment_date ? format(new Date(app.appointment_date), 'yyyy-MM-dd HH:mm') : '-';
            return [
                dateStr,
                app.duration_minutes,
                app.customer?.hn_code || '',
                app.customer?.full_name || `${app.customer?.first_name || ''} ${app.customer?.last_name || ''}`,
                app.customer?.phone_number || '',
                app.status === 'SCHEDULED' ? 'นัดหมายแล้ว' : app.status === 'COMPLETED' ? 'เสร็จสิ้น' : app.status === 'CANCELLED' ? 'ยกเลิก' : app.status === 'NO_SHOW' ? 'ไม่มาตามนัด' : app.status,
                app.doctor?.full_name || '',
                app.therapist?.full_name || '',
                app.notes || ''
            ];
        }).map(row => row.map(formatCSVCell).join(','));

        const csvContent = [...metadataRows, headers.join(','), ...dataRows].join('\n');
        const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
        const blob = new Blob([bom, csvContent], { type: 'text/csv;charset=utf-8;' });

        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `appointments_report_${format(currentDate, 'yyyy-MM-dd')}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

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

    // Active Daemon loops and notification helper triggers
    useEffect(() => {
        if (typeof window !== 'undefined') {
            if ('Notification' in window) {
                setPermissionStatus(Notification.permission)
            } else {
                setPermissionStatus('unsupported')
            }
        }
    }, [])

    const playChimeSound = () => {
        if (typeof window === 'undefined') return
        try {
            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
            if (!AudioContextClass) return
            const context = new AudioContextClass()
            
            const osc1 = context.createOscillator()
            const osc2 = context.createOscillator()
            const gain1 = context.createGain()
            const gain2 = context.createGain()
            
            osc1.connect(gain1)
            gain1.connect(context.destination)
            
            osc2.connect(gain2)
            gain2.connect(context.destination)
            
            osc1.type = 'sine'
            osc1.frequency.setValueAtTime(523.25, context.currentTime) // C5
            gain1.gain.setValueAtTime(0.08, context.currentTime)
            gain1.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.6)
            
            osc2.type = 'sine'
            osc2.frequency.setValueAtTime(659.25, context.currentTime + 0.15) // E5
            gain2.gain.setValueAtTime(0.08, context.currentTime + 0.15)
            gain2.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.75)
            
            osc1.start(context.currentTime)
            osc1.stop(context.currentTime + 0.6)
            
            osc2.start(context.currentTime + 0.15)
            osc2.stop(context.currentTime + 0.75)
        } catch (e) {
            console.error('Audio chime failed:', e)
        }
    }

    const requestNotificationPermission = async () => {
        if (typeof window === 'undefined' || !('Notification' in window)) return
        try {
            const status = await Notification.requestPermission()
            setPermissionStatus(status)
            if (status === 'granted') {
                toast.success('เปิดระบบแจ้งเตือนสำเร็จ')
                playChimeSound()
                new Notification('ระบบแจ้งเตือนระบบนัดหมาย', {
                    body: 'เปิดใช้งานการแจ้งเตือนแบบเรียลไทม์สำเร็จแล้ว',
                })
            } else if (status === 'denied') {
                toast.warning('การแจ้งเตือนถูกปฏิเสธ คุณสามารถเปิดใช้งานในตั้งค่าเบราว์เซอร์ได้')
            }
        } catch (err) {
            console.error(err)
        }
    }

    useEffect(() => {
        if (!appointments || appointments.length === 0) return

        const checkUpcomingAppointments = () => {
            const now = new Date()
            const thirtyMinutesFromNow = new Date(now.getTime() + 30 * 60 * 1000)

            appointments.forEach((app) => {
                if (app.status !== 'SCHEDULED') return
                if (notifiedIds.includes(app.id)) return

                const appDate = new Date(app.appointment_date)
                // Check if appointment is starting within the next 30 minutes, and not in the past
                if (appDate > now && appDate <= thirtyMinutesFromNow) {
                    setNotifiedIds(prev => [...prev, app.id])
                    
                    const customerName = app.customer 
                        ? app.customer.full_name || `${app.customer.first_name || ''} ${app.customer.last_name || ''}`.trim()
                        : 'ไม่ระบุชื่อ'
                    const timeStr = format(appDate, 'HH:mm')
                    
                    // 1. Play sound chime
                    playChimeSound()

                    // 2. Show desktop browser notification
                    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
                        new Notification(`แจ้งเตือนนัดหมายคนไข้: ${customerName}`, {
                            body: `มีนัดหมายเข้าบริการเวลา ${timeStr} น. (${app.notes || 'ไม่มีหมายเหตุ'})`,
                            tag: `app-${app.id}`,
                        })
                    }

                    // 3. Show standard UI Toast
                    toast(`🔔 เตือนนัดหมายอีก 30 นาที: คุณ ${customerName}`, {
                        description: `เวลา ${timeStr} น. - ${app.notes || 'ไม่มีหมายเหตุ'}`,
                        action: {
                            label: 'ดูรายละเอียด',
                            onClick: () => handleAppointmentClick(app)
                        },
                        duration: 10000,
                    })
                }
            })
        }

        checkUpcomingAppointments()
        const interval = setInterval(checkUpcomingAppointments, 15000)
        return () => clearInterval(interval)
    }, [appointments, notifiedIds])


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

    // Compute status counts and filtered appointments
    const scheduledCount = appointments.filter((a: Appointment) => a.status === 'SCHEDULED').length
    const completedCount = appointments.filter((a: Appointment) => a.status === 'COMPLETED').length
    const cancelledCount = appointments.filter((a: Appointment) => a.status === 'CANCELLED').length

    const filteredAppointments = statusFilter === 'ALL'
        ? appointments
        : appointments.filter((a: Appointment) => a.status === statusFilter)

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <div className="flex items-center gap-3">
                        <h2 className="text-2xl font-bold flex items-center gap-2">
                            <CalendarCheck className="h-6 w-6 text-amber-500" />
                            ตารางนัดหมาย
                        </h2>
                        {appointments.length > 0 && (
                            <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-700">
                                {appointments.length} รายการ
                            </span>
                        )}
                    </div>
                    <p className="text-muted-foreground text-sm mt-0.5">จัดการและติดตามการนัดหมายของลูกค้าในแต่ละวัน</p>

                    {/* Status Filter Pills */}
                    {appointments.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                            {([
                                { key: 'ALL', label: 'ทั้งหมด', count: appointments.length, activeClass: 'bg-slate-700 text-white', inactiveClass: 'bg-slate-100 text-slate-600 hover:bg-slate-200' },
                                { key: 'SCHEDULED', label: 'รอดำเนินการ', count: scheduledCount, activeClass: 'bg-blue-600 text-white', inactiveClass: 'bg-blue-50 text-blue-600 hover:bg-blue-100' },
                                { key: 'COMPLETED', label: 'เสร็จสิ้น', count: completedCount, activeClass: 'bg-emerald-600 text-white', inactiveClass: 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' },
                                { key: 'CANCELLED', label: 'ยกเลิก', count: cancelledCount, activeClass: 'bg-red-500 text-white', inactiveClass: 'bg-red-50 text-red-500 hover:bg-red-100' },
                            ] as const).map(pill => (
                                <button
                                    key={pill.key}
                                    type="button"
                                    onClick={() => setStatusFilter(pill.key)}
                                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-all ${statusFilter === pill.key ? pill.activeClass : pill.inactiveClass}`}
                                >
                                    {pill.label}
                                    <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${statusFilter === pill.key ? 'bg-white/20' : 'bg-white/70'}`}>
                                        {pill.count}
                                    </span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    {permissionStatus !== 'unsupported' && (
                        <Button
                            variant={permissionStatus === 'granted' ? 'ghost' : 'outline'}
                            size="sm"
                            onClick={requestNotificationPermission}
                            className={`rounded-xl gap-2 text-xs font-semibold ${
                                permissionStatus === 'granted' 
                                    ? 'text-emerald-600 hover:text-emerald-700 bg-emerald-50/50' 
                                    : 'text-amber-600 border-amber-200 hover:bg-amber-50'
                            }`}
                        >
                            {permissionStatus === 'granted' ? (
                                <>
                                    <span className="relative flex h-2 w-2 mr-0.5">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                    </span>
                                    <Bell className="h-4 w-4 text-emerald-500" />
                                    ระบบเตือนทำงานอยู่
                                </>
                            ) : (
                                <>
                                    <BellOff className="h-4 w-4 text-amber-500" />
                                    เปิดระบบแจ้งเตือนจริง
                                </>
                            )}
                        </Button>
                    )}
                    <Button variant="outline" onClick={handleExport} disabled={appointments.length === 0} className="rounded-xl gap-2">
                        <Download className="h-4 w-4" />
                        Export CSV
                    </Button>
                    <Button
                        onClick={() => handleTimeSlotClick(currentDate)}
                        className="rounded-xl gap-2 shadow-md shadow-amber-200/60 transition-all hover:-translate-y-0.5 hover:shadow-lg"
                        style={{ background: 'linear-gradient(135deg, #d97706, #f59e0b)' }}
                    >
                        <Plus className="h-4 w-4" />
                        เพิ่มนัดหมาย
                    </Button>
                </div>
            </div>

            <Card>
                <div className="flex flex-col sm:flex-row items-center justify-between p-4 border-b gap-4">
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="icon" onClick={handlePrev} aria-label="ย้อนกลับ">
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={handleToday}>
                            วันนี้
                        </Button>
                        <Button variant="outline" size="icon" onClick={handleNext} aria-label="ถัดไป">
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
                                    appointments={filteredAppointments}
                                    onTimeSlotClick={handleTimeSlotClick}
                                    onAppointmentClick={handleAppointmentClick}
                                    onAppointmentDrop={handleAppointmentDrop}
                                />
                            )}
                            {view === 'week' && (
                                <WeeklyTimeline
                                    date={currentDate}
                                    appointments={filteredAppointments}
                                    onTimeSlotClick={handleTimeSlotClick}
                                    onAppointmentClick={handleAppointmentClick}
                                    onAppointmentDrop={handleAppointmentDrop}
                                />
                            )}
                            {view === 'month' && (
                                <MonthlyCalendar
                                    date={currentDate}
                                    appointments={filteredAppointments}
                                    onTimeSlotClick={handleTimeSlotClick}
                                    onAppointmentClick={handleAppointmentClick}
                                    onAppointmentDrop={handleAppointmentDrop}
                                    onSeeMore={(date) => {
                                        setCurrentDate(date);
                                        setView('day');
                                    }}
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
