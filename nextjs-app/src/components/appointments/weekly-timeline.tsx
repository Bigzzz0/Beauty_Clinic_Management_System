import { format, addHours, startOfDay, addDays, startOfWeek } from 'date-fns';
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

interface WeeklyTimelineProps {
    date: Date;
    appointments: Appointment[];
    onAppointmentClick: (appointment: Appointment) => void;
    onTimeSlotClick: (date: Date) => void;
    onAppointmentDrop?: (appointmentId: number, newDate: Date) => void;
}

export function WeeklyTimeline({ date, appointments, onAppointmentClick, onTimeSlotClick, onAppointmentDrop }: WeeklyTimelineProps) {
    // Start week on Sunday (0) or Monday (1) depending on locale preference
    const startDate = startOfWeek(date, { weekStartsOn: 1 }); // Monday
    const days = Array.from({ length: 7 }).map((_, i) => addDays(startDate, i));
    const hours = Array.from({ length: 24 }).map((_, i) => addHours(startOfDay(startDate), i));

    const handleDragStart = (e: React.DragEvent, id: number) => {
        e.dataTransfer.setData('appointmentId', id.toString());
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault(); // allow drop
    };

    const handleDrop = (e: React.DragEvent, dropDate: Date) => {
        e.preventDefault();
        const appointmentId = e.dataTransfer.getData('appointmentId');
        if (appointmentId && onAppointmentDrop) {
            onAppointmentDrop(Number(appointmentId), dropDate);
        }
    };

    const getTopRem = (dateString: string | Date) => {
        const d = new Date(dateString);
        const minutes = d.getHours() * 60 + d.getMinutes();
        return (minutes / 60) * 5; // 5rem per hour
    };

    const getHeightRem = (durationMinutes: number) => {
        return (durationMinutes / 60) * 5; // 5rem per hour
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

    const distributeAppointments = (apps: Appointment[]) => {
        const sorted = [...apps].sort((a, b) => new Date(a.appointment_date).getTime() - new Date(b.appointment_date).getTime());
        const columns: Appointment[][] = [];

        for (const app of sorted) {
            let placed = false;
            for (const col of columns) {
                const lastApp = col[col.length - 1];
                const lastAppEnd = new Date(new Date(lastApp.appointment_date).getTime() + lastApp.duration_minutes * 60000);
                if (new Date(app.appointment_date) >= lastAppEnd) {
                    col.push(app);
                    placed = true;
                    break;
                }
            }
            if (!placed) {
                columns.push([app]);
            }
        }

        const result: (Appointment & { colIndex: number; totalCols: number })[] = [];
        columns.forEach((col, colIndex) => {
            col.forEach(app => {
                result.push({
                    ...app,
                    colIndex,
                    totalCols: columns.length
                });
            });
        });
        return result;
    };

    const isToday = (d: Date) => {
        const today = new Date();
        return d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
    };

    return (
        <div className="border rounded-md bg-card flex flex-col h-[800px]">
            {/* Header row (Days) */}
            <div className="flex border-b bg-muted/30">
                <div className="w-16 shrink-0 border-r"></div>
                {days.map((day, i) => (
                    <div
                        key={i}
                        className={cn(
                            "flex-1 border-r last:border-r-0 py-3 text-center",
                            isToday(day) ? "bg-primary/10" : ""
                        )}
                    >
                        <div className="text-xs font-medium uppercase text-muted-foreground">{format(day, 'EEE', { locale: th })}</div>
                        <div className={cn(
                            "text-xl font-semibold mt-1 w-8 h-8 rounded-full flex items-center justify-center mx-auto",
                            isToday(day) ? "bg-primary text-primary-foreground" : ""
                        )}>
                            {format(day, 'd')}
                        </div>
                    </div>
                ))}
            </div>

            {/* Scrollable grid body */}
            <div className="flex flex-1 overflow-y-auto relative">
                {/* Time labels column */}
                <div className="w-16 shrink-0 border-r bg-muted/10">
                    {hours.map((h, i) => (
                        <div key={i} className="h-20 border-b text-xs text-muted-foreground p-2 text-right relative">
                            <span className="absolute -top-2.5 right-2 bg-card px-1">{format(h, 'HH:mm')}</span>
                        </div>
                    ))}
                </div>

                {/* 7-Day Grid */}
                <div className="flex flex-1 relative">
                    {/* Background Grid Lines */}
                    {days.map((day, dayIndex) => (
                        <div key={dayIndex} className="flex-1 border-r last:border-r-0 relative min-w-[120px]">
                            {hours.map((h, i) => {
                                const slotDate = new Date(day);
                                slotDate.setHours(h.getHours(), h.getMinutes(), 0, 0);

                                return (
                                    <div
                                        key={i}
                                        className={cn(
                                            "h-20 border-b border-border/50 transition-colors cursor-pointer",
                                            isToday(day) ? "bg-primary/[0.02]" : "hover:bg-accent/10"
                                        )}
                                        onClick={() => onTimeSlotClick(slotDate)}
                                        onDragOver={handleDragOver}
                                        onDrop={(e) => handleDrop(e, slotDate)}
                                    ></div>
                                );
                            })}

                            {/* Appointments for this specific day */}
                            {distributeAppointments(appointments
                                .filter(app => {
                                    const appDate = new Date(app.appointment_date);
                                    return appDate.getDate() === day.getDate() &&
                                        appDate.getMonth() === day.getMonth() &&
                                        appDate.getFullYear() === day.getFullYear();
                                }))
                                .map((app) => {
                                    const top = getTopRem(app.appointment_date);
                                    const height = getHeightRem(app.duration_minutes);

                                    return (
                                        <div
                                            key={app.id}
                                            className="absolute z-10"
                                            style={{
                                                top: `${top}rem`,
                                                height: `${height}rem`,
                                                left: `calc(${app.colIndex} * 100% / ${app.totalCols} + 1px)`,
                                                width: `calc(100% / ${app.totalCols} - 2px)`,
                                                minHeight: '28px',
                                            }}
                                        >
                                            <HoverCard openDelay={200} closeDelay={100}>
                                                <HoverCardTrigger asChild>
                                                    <div
                                                        draggable
                                                        onDragStart={(e) => handleDragStart(e, app.id)}
                                                        onClick={(e) => { e.stopPropagation(); onAppointmentClick(app); }}
                                                        className={cn(
                                                            "w-full h-full rounded p-1.5 text-[10px] sm:text-xs border-l-[4px] shadow-sm cursor-pointer hover:shadow-md transition-shadow overflow-hidden group relative block",
                                                            getStatusStyle(app.status)
                                                        )}
                                                    >
                                                        <div className="font-bold truncate leading-tight pr-4">
                                                            {format(new Date(app.appointment_date), 'HH:mm')}
                                                        </div>
                                                        <div className="truncate leading-tight">
                                                            {app.customer?.first_name}
                                                        </div>
                                                        {app.duration_minutes >= 60 && (
                                                            <div className="truncate opacity-80 mt-0.5 text-[9px] hidden sm:block">
                                                                HN: {app.customer?.hn_code}
                                                            </div>
                                                        )}

                                                        {/* Dropdown Menu Trigger - tiny size for weekly view */}
                                                        <div className="absolute top-0.5 right-0.5 md:opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger asChild>
                                                                    <Button variant="ghost" className="h-5 w-5 p-0 hover:bg-background/20 rounded-full">
                                                                        <MoreHorizontal className="h-3 w-3" />
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

                                                {/* Consistent HoverCard Content across all timelines */}
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
                                        </div>
                                    );
                                })}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
