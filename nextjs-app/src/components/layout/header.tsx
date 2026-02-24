'use client'

import { Menu } from 'lucide-react'
import { useUIStore } from '@/stores/ui-store'
import { useAuthStore } from '@/stores/auth-store'
import { Button } from '@/components/ui/button'
import { GlobalSearch } from './global-search'
import { NotificationMenu } from './notifications'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import Link from 'next/link'

export function Header() {
    const { toggleSidebar, isMobile } = useUIStore()
    const { user, logout } = useAuthStore()

    return (
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-card px-4 lg:px-6">
            <div className="flex items-center gap-4">
                {isMobile && (
                    <Button variant="ghost" size="icon" onClick={toggleSidebar} aria-label="Toggle sidebar">
                        <Menu className="h-5 w-5" />
                    </Button>
                )}
                <GlobalSearch />
            </div>

            <div className="flex items-center gap-3">
                <NotificationMenu />

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="flex items-center gap-2" aria-label="User menu">
                            <Avatar className="h-8 w-8">
                                <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white">
                                    {user?.full_name?.charAt(0) || 'U'}
                                </AvatarFallback>
                            </Avatar>
                            <div className="hidden text-left md:block">
                                <p className="text-sm font-medium">{user?.full_name || 'User'}</p>
                                <p className="text-xs text-muted-foreground">{user?.position || 'Staff'}</p>
                            </div>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuLabel>บัญชีของฉัน</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                            <Link href="/settings">ตั้งค่า</Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <button className="relative flex w-full text-left cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50 text-destructive focus:bg-accent focus:text-destructive">
                                    ออกจากระบบ
                                </button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>ยืนยันการออกจากระบบ</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        คุณต้องการออกจากระบบใช่หรือไม่?
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
                                    <AlertDialogAction onClick={logout} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                        ออกจากระบบ
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    )
}

