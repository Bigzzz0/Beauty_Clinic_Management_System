'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
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
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { SidebarContent } from './sidebar'

/** Separate component so Sheet open state is fully self-contained (no store dependency) */
function MobileDrawer() {
    const [open, setOpen] = useState(false)
    const pathname = usePathname()

    // Close drawer on navigation
    useEffect(() => {
        setOpen(false)
    }, [pathname])

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Toggle sidebar">
                    <Menu className="h-5 w-5" />
                </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[280px] p-0 border-r-0 flex flex-col gap-0">
                <SheetHeader className="sr-only">
                    <SheetTitle>Navigation Menu</SheetTitle>
                </SheetHeader>
                <SidebarContent isMobile={true} />
            </SheetContent>
        </Sheet>
    )
}

export function Header() {
    const { user, logout } = useAuthStore()

    return (
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-white/95 backdrop-blur-sm px-4 lg:px-6 shadow-sm">
            <div className="flex items-center gap-4">
                {/* Mobile hamburger — hidden on desktop via CSS, uses own local state */}
                <div className="lg:hidden">
                    <MobileDrawer />
                </div>
                <GlobalSearch />
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
                <NotificationMenu />

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="flex items-center gap-2 pl-2 sm:pl-3 hover:bg-amber-50 rounded-xl transition-colors" aria-label="User menu">
                            <Avatar className="h-8 w-8 ring-2 ring-amber-200 ring-offset-1">
                                <AvatarFallback className="bg-gradient-to-br from-amber-400 to-amber-500 text-white font-bold text-sm">
                                    {user?.full_name?.charAt(0) || 'U'}
                                </AvatarFallback>
                            </Avatar>
                            <div className="hidden text-left md:block">
                                <p className="text-sm font-medium text-slate-800">{user?.full_name || 'User'}</p>
                                <p className="text-xs text-slate-500">{user?.position || 'Staff'}</p>
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
