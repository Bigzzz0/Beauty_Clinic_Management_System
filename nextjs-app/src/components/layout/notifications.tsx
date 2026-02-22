'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, Package, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ScrollArea } from '@/components/ui/scroll-area'

interface AppNotification {
    id: string;
    title: string;
    description: string;
    type: 'alert' | 'info';
    icon: 'package' | 'calendar';
    link: string;
    read: boolean;
    time: string;
}

export function NotificationMenu() {
    const router = useRouter()
    const [notifications, setNotifications] = useState<AppNotification[]>([])
    const [unreadCount, setUnreadCount] = useState(0)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                const res = await fetch('/api/notifications')
                if (res.ok) {
                    const data = await res.json()

                    // Fetch marked-as-read IDs from local storage
                    const readIds: string[] = JSON.parse(localStorage.getItem('readNotifications') || '[]')

                    const formattedData = data.notifications.map((n: any) => ({
                        ...n,
                        read: readIds.includes(n.id)
                    }))

                    setNotifications(formattedData)
                    setUnreadCount(formattedData.filter((n: AppNotification) => !n.read).length)
                }
            } catch (error) {
                console.error("Failed to load notifications", error)
            } finally {
                setIsLoading(false)
            }
        }

        fetchNotifications()
    }, [])

    const handleMarkAllAsRead = () => {
        const allIds = notifications.map(n => n.id)
        localStorage.setItem('readNotifications', JSON.stringify(allIds))

        setNotifications(prev => prev.map(n => ({ ...n, read: true })))
        setUnreadCount(0)
    }

    const handleSelectNotification = (link: string) => {
        router.push(link)
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative" aria-label={`Notifications, ${unreadCount} unread`}>
                    <Bell className="h-5 w-5 text-muted-foreground" />
                    {unreadCount > 0 && (
                        <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] text-white animate-in zoom-in">
                            {unreadCount}
                        </span>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
                <div className="flex items-center justify-between px-4 py-2">
                    <DropdownMenuLabel className="p-0 text-base">การแจ้งเตือน</DropdownMenuLabel>
                    {unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-auto px-2 py-1 text-xs text-muted-foreground hover:text-primary"
                            onClick={handleMarkAllAsRead}
                        >
                            อ่านทั้งหมด
                        </Button>
                    )}
                </div>
                <DropdownMenuSeparator />
                <ScrollArea className="h-[300px]">
                    <DropdownMenuGroup>
                        {isLoading ? (
                            <div className="p-4 text-center text-sm text-muted-foreground">
                                กำลังโหลด...
                            </div>
                        ) : notifications.length > 0 ? (
                            notifications.map((notification) => (
                                <DropdownMenuItem
                                    key={notification.id}
                                    onClick={() => handleSelectNotification(notification.link)}
                                    className="cursor-pointer p-3 focus:bg-accent flex items-start gap-3 outline-none"
                                >
                                    <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${notification.type === 'alert' ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-500' : 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-500'}`}>
                                        {notification.icon === 'package' ? <Package className="h-4 w-4" /> : <Calendar className="h-4 w-4" />}
                                    </div>
                                    <div className="flex flex-col gap-1 overflow-hidden">
                                        <div className="flex items-center gap-2">
                                            <p className={`text-sm ${!notification.read ? 'font-semibold text-foreground' : 'font-medium text-muted-foreground'}`} title={notification.title}>
                                                {notification.title}
                                            </p>
                                            {!notification.read && (
                                                <span className="flex h-2 w-2 shrink-0 rounded-full bg-primary" />
                                            )}
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            {notification.description}
                                        </p>
                                        <p className="text-[10px] text-muted-foreground/80 mt-1">
                                            {notification.time}
                                        </p>
                                    </div>
                                </DropdownMenuItem>
                            ))
                        ) : (
                            <div className="p-4 text-center text-sm text-muted-foreground">
                                ไม่มีการแจ้งเตือนใหม่
                            </div>
                        )}
                    </DropdownMenuGroup>
                </ScrollArea>
                <DropdownMenuSeparator />
                <div className="p-2 text-center flex flex-col items-center">
                    <Button variant="ghost" size="sm" className="w-full text-xs text-muted-foreground">
                        ดูหน้าต่างสินค้า
                    </Button>
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
