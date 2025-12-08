'use client'

import { Menu, Bell, Search } from 'lucide-react'
import { useUIStore } from '@/stores/ui-store'
import { useAuthStore } from '@/stores/auth-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import Link from 'next/link'

export function Header() {
    const { toggleSidebar, isMobile } = useUIStore()
    const { user, logout } = useAuthStore()

    return (
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-white px-4 lg:px-6">
            <div className="flex items-center gap-4">
                {isMobile && (
                    <Button variant="ghost" size="icon" onClick={toggleSidebar}>
                        <Menu className="h-5 w-5" />
                    </Button>
                )}
                <div className="relative hidden md:block">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                        placeholder="ค้นหาลูกค้า, สินค้า..."
                        className="w-64 pl-9"
                    />
                </div>
            </div>

            <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5 text-slate-600" />
                    <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">
                        3
                    </span>
                </Button>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                                <AvatarFallback className="bg-gradient-to-br from-pink-500 to-purple-600 text-white">
                                    {user?.full_name?.charAt(0) || 'U'}
                                </AvatarFallback>
                            </Avatar>
                            <div className="hidden text-left md:block">
                                <p className="text-sm font-medium">{user?.full_name || 'User'}</p>
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
                        <DropdownMenuItem asChild>
                            <Link href="/settings/password">เปลี่ยนรหัสผ่าน</Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={logout} className="text-red-600">
                            ออกจากระบบ
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    )
}
