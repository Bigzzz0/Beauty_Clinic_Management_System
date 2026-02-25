'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useUIStore } from '@/stores/ui-store'
import { useAuthStore } from '@/stores/auth-store'
import {
    LayoutDashboard,
    Users,
    ShoppingCart,
    Package,
    FileText,
    BarChart3,
    Settings,
    LogOut,
    ChevronLeft,
    Boxes,
    PackagePlus,
    ArrowLeftRight,
    ClipboardList,
    Receipt,
    CreditCard,
    CalendarDays
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'

const menuItems = [
    {
        title: 'Dashboard',
        icon: LayoutDashboard,
        href: '/dashboard',
        roles: ['Admin', 'Doctor', 'Therapist', 'Sale', 'Cashier'],
    },
    {
        title: 'ลูกค้า/คนไข้',
        icon: Users,
        href: '/patients',
        roles: ['Admin', 'Doctor', 'Therapist', 'Sale', 'Cashier'],
    },
    {
        title: 'ตารางนัดหมาย',
        icon: CalendarDays,
        href: '/appointments',
        roles: ['Admin', 'Doctor', 'Therapist', 'Sale', 'Cashier'],
    },
    {
        title: 'ขายสินค้า (POS)',
        icon: ShoppingCart,
        href: '/pos',
        roles: ['Admin', 'Sale', 'Cashier'],
    },
    {
        title: 'รับบริการ',
        icon: ClipboardList,
        href: '/service',
        roles: ['Admin', 'Doctor', 'Therapist'],
    },
    {
        title: 'ลูกหนี้',
        icon: CreditCard,
        href: '/debtors',
        roles: ['Admin', 'Sale', 'Cashier'],
    },
    {
        title: 'รายการขาย',
        icon: Receipt,
        href: '/transactions',
        roles: ['Admin', 'Sale', 'Cashier'],
    },
]

const inventoryItems = [
    {
        title: 'คลังสินค้า',
        icon: Package,
        href: '/inventory',
    },
    {
        title: 'รับเข้าสต๊อก',
        icon: PackagePlus,
        href: '/inventory/stock-in',
    },
    {
        title: 'โอนย้าย',
        icon: ArrowLeftRight,
        href: '/inventory/transfer',
    },
    {
        title: 'ปรับยอด',
        icon: Boxes,
        href: '/inventory/adjustment',
    },
    {
        title: 'บันทึกการใช้',
        icon: ClipboardList,
        href: '/inventory/usage',
    },
]

const reportItems = [
    {
        title: 'รายงาน',
        icon: BarChart3,
        href: '/reports',
    },
]

export function Sidebar() {
    const pathname = usePathname()
    const { isSidebarOpen, toggleSidebar } = useUIStore()
    const { user, logout } = useAuthStore()

    const isActive = (href: string) => {
        if (href === '/dashboard') {
            return pathname === '/dashboard' || pathname === '/'
        }
        return pathname.startsWith(href)
    }

    return (
        <aside
            className={cn(
                'fixed left-0 top-0 z-40 h-screen bg-white border-r border-slate-200 transition-all duration-300',
                isSidebarOpen ? 'w-64' : 'w-20'
            )}
        >
            <div className="flex h-16 items-center justify-between border-b border-slate-100 px-4">
                <div className={cn('flex items-center gap-3', !isSidebarOpen && 'hidden')}>
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-400">
                        <span className="text-lg font-bold text-slate-900">BC</span>
                    </div>
                    <div>
                        <h1 className="text-sm font-semibold text-slate-800">Beauty Clinic</h1>
                        <p className="text-xs text-slate-500">Management System</p>
                    </div>
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleSidebar}
                    className="text-slate-500 hover:bg-amber-50 hover:text-amber-700"
                    aria-label="Toggle sidebar"
                >
                    <ChevronLeft
                        className={cn('h-5 w-5 transition-transform', !isSidebarOpen && 'rotate-180')}
                    />
                </Button>
            </div>

            <ScrollArea className="h-[calc(100vh-8rem)]">
                <nav className="space-y-1 p-3">
                    {/* Main Menu */}
                    {menuItems
                        .filter((item) => item.roles.includes(user?.position || ''))
                        .map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                title={!isSidebarOpen ? item.title : undefined}
                                aria-current={isActive(item.href) ? 'page' : undefined}
                                className={cn(
                                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-200',
                                    isActive(item.href)
                                        ? 'bg-amber-50 text-amber-800 border-l-4 border-amber-500 font-medium pl-2'
                                        : 'text-slate-500 hover:bg-amber-50 hover:text-amber-700'
                                )}
                            >
                                <item.icon className="h-5 w-5 flex-shrink-0" />
                                <span className={cn(!isSidebarOpen && 'hidden')}>{item.title}</span>
                            </Link>
                        ))}

                    {/* Inventory Section */}
                    {['Admin', 'Doctor', 'Therapist'].includes(user?.position || '') && (
                        <>
                            <Separator className="my-3" />
                            <p
                                className={cn(
                                    'mb-2 px-3 text-xs font-medium uppercase tracking-wider text-slate-400',
                                    !isSidebarOpen && 'hidden'
                                )}
                            >
                                คลังสินค้า
                            </p>
                            {inventoryItems.map((item) => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    title={!isSidebarOpen ? item.title : undefined}
                                    aria-current={isActive(item.href) ? 'page' : undefined}
                                    className={cn(
                                        'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-200',
                                        isActive(item.href)
                                            ? 'bg-amber-50 text-amber-800 border-l-4 border-amber-500 font-medium pl-2'
                                            : 'text-slate-500 hover:bg-amber-50 hover:text-amber-700'
                                    )}
                                >
                                    <item.icon className="h-5 w-5 flex-shrink-0" />
                                    <span className={cn(!isSidebarOpen && 'hidden')}>{item.title}</span>
                                </Link>
                            ))}
                        </>
                    )}

                    {/* Reports Section */}
                    {['Admin', 'Sale', 'Cashier'].includes(user?.position || '') && (
                        <>
                            <Separator className="my-3" />
                            {reportItems.map((item) => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    title={!isSidebarOpen ? item.title : undefined}
                                    aria-current={isActive(item.href) ? 'page' : undefined}
                                    className={cn(
                                        'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-200',
                                        isActive(item.href)
                                            ? 'bg-amber-50 text-amber-800 border-l-4 border-amber-500 font-medium pl-2'
                                            : 'text-slate-500 hover:bg-amber-50 hover:text-amber-700'
                                    )}
                                >
                                    <item.icon className="h-5 w-5 flex-shrink-0" />
                                    <span className={cn(!isSidebarOpen && 'hidden')}>{item.title}</span>
                                </Link>
                            ))}
                        </>
                    )}

                    {/* Settings */}
                    <Separator className="my-3" />
                    <Link
                        href="/settings"
                        title={!isSidebarOpen ? "ตั้งค่า" : undefined}
                        aria-current={isActive('/settings') ? 'page' : undefined}
                        className={cn(
                            'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-200',
                            isActive('/settings')
                                ? 'bg-amber-50 text-amber-800 border-l-4 border-amber-500 font-medium pl-2'
                                : 'text-slate-500 hover:bg-amber-50 hover:text-amber-700'
                        )}
                    >
                        <Settings className="h-5 w-5 flex-shrink-0" />
                        <span className={cn(!isSidebarOpen && 'hidden')}>ตั้งค่า</span>
                    </Link>
                </nav>
            </ScrollArea>

            {/* User Section */}
            <div className="absolute bottom-0 left-0 right-0 border-t border-slate-100 p-3">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-400 text-sm font-semibold text-slate-900">
                        {user?.full_name?.charAt(0) || 'U'}
                    </div>
                    <div className={cn('flex-1', !isSidebarOpen && 'hidden')}>
                        <p className="text-sm font-medium text-slate-800">{user?.full_name || 'User'}</p>
                        <p className="text-xs text-slate-500">{user?.position || 'Staff'}</p>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={logout}
                        className={cn('text-slate-500 hover:bg-amber-50 hover:text-amber-700', !isSidebarOpen && 'hidden')}
                        aria-label="Logout"
                    >
                        <LogOut className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </aside>
    )
}
