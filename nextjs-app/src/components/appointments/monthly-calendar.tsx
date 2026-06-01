import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay } from 'date-fns';
import { th } from 'date-fns/locale';
import { Clock, MoreHorizontal, User, Phone, Stethoscope, Sparkles, Edit, CalendarX } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Appointment } from '@/types';
import {
    HoverCard,
    HoverCardContent,
    HoverCardTrigger,
} from "@/components/ui/hover-card"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from '@/components/ui/button';

interface MonthlyCalendarProps {
    date: Date;
    appointments: Appointment[];
    onAppointmentClick: (appointment: Appointment) => void;
    onTimeSlotClick: (date: Date) => void;
    onAppointmentDrop?: (appointmentId: number, newDate: Date) => void;
    onSeeMore?: (date: Date) => void;
}

export function MonthlyCalendar({ date, appointments, onAppointmentClick, onTimeSlotClick, onAppointmentDrop, onSeeMore }: MonthlyCalendarProps) {
    const monthStart = startOfMonth(date);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 }); // Monday
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

    const dateFormat = "d";
    const rows = [];
    let days = [];
    let day = startDate;
    let formattedDate = "";

    const handleDragStart = (e: React.DragEvent, id: number) => {
        e.dataTransfer.setData('appointmentId', id.toString());
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const handleDrop = (e: React.DragEvent, dropDate: Date) => {
        e.preventDefault();
        const appointmentId = e.dataTransfer.getData('appointmentId');
        if (appointmentId && onAppointmentDrop) {
            // Default to 09:00 for a dropped whole day
            const newDate = new Date(dropDate);
            newDate.setHours(9, 0, 0, 0);
            onAppointmentDrop(Number(appointmentId), newDate);
        }
    };

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'SCHEDULED': return 'border-blue-500 bg-blue-100/80 dark:bg-blue-900/40 text-blue-900 dark:text-blue-100'
            case 'COMPLETED': return 'border-green-500 bg-green-100/80 dark:bg-green-900/40 text-green-900 dark:text-green-100'
            case 'CANCELLED': return 'border-red-500 bg-red-100/80 dark:bg-red-900/40 text-red-900 dark:text-red-100 opacity-60'
            case 'NO_SHOW': return 'border-gray-500 bg-gray-200/80 dark:bg-gray-800 text-gray-700 dark:text-gray-300 opacity-60'
            default: return 'border-border bg-card'
        }
    };

    // Build the grid
    while (day <= endDate) {
        for (let i = 0; i < 7; i++) {
            formattedDate = format(day, dateFormat);
            const cloneDay = day;

            // Get appointments for this day
            const dayAppointments = appointments.filter(app => {
                const appDate = new Date(app.appointment_date);
                return isSameDay(appDate, cloneDay);
            });

            days.push(
                <div
                    key={day.toString()}
                    className={cn(
                        "min-h-[120px] p-2 border-r border-b relative group/day cursor-pointer hover:bg-accent/20 transition-colors",
                        !isSameMonth(day, monthStart) ? "bg-muted/30 text-muted-foreground" : "bg-card",
                        isSameDay(day, new Date()) ? "bg-primary/[0.03]" : ""
                    )}
                    onClick={() => onTimeSlotClick(cloneDay)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, cloneDay)}
                >
                    <div className="flex justify-between items-start mb-1 gap-1">
                        <span className={cn(
                            "text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full shrink-0",
                            isSameDay(day, new Date()) ? "bg-primary text-primary-foreground" : ""
                        )}>
                            {formattedDate}
                        </span>
                        {dayAppointments.length > 0 && (
                            <span className="text-[10px] text-muted-foreground font-medium bg-muted px-1.5 py-0.5 rounded-full whitespace-nowrap">
                                {dayAppointments.length} นัด
                            </span>
                        )}
                    </div>

                    <div className="space-y-1 overflow-y-auto max-h-[80px] custom-scrollbar">
                        {dayAppointments.slice(0, 4).map((app) => (
                            <HoverCard key={app.id} openDelay={200} closeDelay={100}>
                                <HoverCardTrigger asChild>
                                    <div
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, app.id)}
                                        onClick={(e) => { e.stopPropagation(); onAppointmentClick(app); }}
                                        className={cn(
                                            "text-[10px] sm:text-xs truncate rounded px-1.5 py-0.5 border-l-2 cursor-pointer hover:opacity-80 relative group flex justify-between items-center gap-1",
                                            getStatusStyle(app.status)
                                        )}
                                    >
                                        <span className="truncate">
                                            <span className="font-semibold">{format(new Date(app.appointment_date), 'HH:mm')}</span> {app.customer?.first_name}
                                        </span>

                                        {/* Dropdown Menu Trigger - visible on hover */}
                                        <div className="md:opacity-0 group-hover:opacity-100 transition-opacity shrink-0" onClick={e => e.stopPropagation()}>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-[14px] w-[14px] p-0 hover:bg-background/20 rounded-sm">
                                                        <MoreHorizontal className="h-2.5 w-2.5" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-48">
                                                    <DropdownMenuLabel>ดำเนินการ</DropdownMenuLabel>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem onClick={() => onAppointmentClick(app)}>
                                                        <Edit className="mr-2 h-4 w-4" />
                                                        <span>ดู/แก้ไข รายละเอียด</span>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem disabled className="text-muted-foreground">
                                                        <CalendarX className="mr-2 h-4 w-4" />
                                                        <span>ยกเลิกนัดหมาย</span>
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </div>
                                </HoverCardTrigger>

                                <HoverCardContent side="right" align="start" className="w-80 p-0 shadow-lg" onClick={e => e.stopPropagation()}>
                                    <div className="bg-muted px-4 py-3 border-b flex justify-between items-center">
                                        <div className="font-semibold text-lg flex items-center gap-2">
                                            {app.customer?.first_name} {app.customer?.last_name}
                                        </div>
                                        <span className={cn(
                                            "px-2 py-0.5 rounded-full text-xs font-medium border",
                                            getStatusStyle(app.status)
                                        )}>
                                            {app.status}
                                        </span>
                                    </div>
                                    <div className="p-4 space-y-3 relative z-50">
                                        <div className="flex gap-2 text-sm text-muted-foreground">
                                            <Clock className="w-4 h-4 mt-0.5 text-foreground/70" />
                                            <div>
                                                <p className="font-medium text-foreground">{format(new Date(app.appointment_date), 'EEEE d MMMM yyyy', { locale: th })}</p>
                                                <p>{format(new Date(app.appointment_date), 'HH:mm')} - {format(new Date(new Date(app.appointment_date).getTime() + app.duration_minutes * 60000), 'HH:mm')} ({app.duration_minutes} นาที)</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2 text-sm text-foreground/80">
                                            <User className="w-4 h-4 text-foreground/70" />
                                            <span>HN: <strong className="text-foreground">{app.customer?.hn_code}</strong></span>
                                        </div>
                                        {app.customer?.phone_number && (
                                            <div className="flex gap-2 text-sm text-foreground/80">
                                                <Phone className="w-4 h-4 text-foreground/70" />
                                                <a href={`tel:${app.customer.phone_number}`} className="text-blue-500 hover:underline">{app.customer.phone_number}</a>
                                            </div>
                                        )}
                                        {(app.doctor || app.therapist) && (
                                            <div className="pt-2 mt-2 border-t space-y-2">
                                                {app.doctor && (
                                                    <div className="flex items-center gap-2 text-sm">
                                                        <Stethoscope className="w-4 h-4 text-blue-500" />
                                                        <span>แพทย์: <strong>พญ. {app.doctor.full_name}</strong></span>
                                                    </div>
                                                )}
                                                {app.therapist && (
                                                    <div className="flex items-center gap-2 text-sm">
                                                        <Sparkles className="w-4 h-4 text-purple-500" />
                                                        <span>ผู้เชี่ยวชาญ: <strong>{app.therapist.full_name}</strong></span>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                        {app.notes && (
                                            <div className="bg-muted/50 p-2 text-xs rounded-md border border-border/50 mt-2">
                                                <span className="font-semibold block mb-1">หมายเหตุ:</span>
                                                {app.notes}
                                            </div>
                                        )}
                                    </div>
                                </HoverCardContent>
                            </HoverCard>
                        ))}
                        {dayAppointments.length > 4 && (
                            <div className="text-[10px] text-muted-foreground text-center pt-1 font-medium bg-muted/30 rounded mx-1 pb-0.5 cursor-pointer hover:bg-muted/50 transition-colors" onClick={(e) => {
                                e.stopPropagation();
                                if (onSeeMore) {
                                    onSeeMore(cloneDay);
                                } else {
                                    onTimeSlotClick(cloneDay);
                                }
                            }}>
                                +{dayAppointments.length - 4} รายการ (ดูทั้งหมด)
                            </div>
                        )}
                    </div>
                </div>
            );
            day = addDays(day, 1);
        }
        rows.push(
            <div className="grid grid-cols-7" key={day.toString()}>
                {days}
            </div>
        );
        days = [];
    }

    const weekDays = ['จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์', 'อาทิตย์'];

    return (
        <div className="border rounded-md bg-card overflow-hidden">
            <div className="grid grid-cols-7 border-b bg-muted/40">
                {weekDays.map((wd, i) => (
                    <div key={i} className="py-3 text-center text-xs font-semibold text-muted-foreground border-r last:border-r-0">
                        {wd}
                    </div>
                ))}
            </div>
            <div className="flex flex-col">
                {rows}
            </div>
        </div>
    );
}
