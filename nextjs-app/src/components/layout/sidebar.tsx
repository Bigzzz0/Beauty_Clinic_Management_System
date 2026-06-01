'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useUIStore } from '@/stores/ui-store'
import { useAuthStore } from '@/stores/auth-store'
import Image from 'next/image'
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
        roles: ['Admin', 'Doctor', 'Therapist'],
    },
    {
        title: 'รับเข้าสต๊อก',
        icon: PackagePlus,
        href: '/inventory/stock-in',
        roles: ['Admin', 'Doctor', 'Therapist'],
    },
    {
        title: 'โอนย้าย',
        icon: ArrowLeftRight,
        href: '/inventory/transfer',
        roles: ['Admin', 'Doctor', 'Therapist'],
    },
    {
        title: 'ปรับยอด',
        icon: Boxes,
        href: '/inventory/adjustment',
        roles: ['Admin', 'Doctor', 'Therapist'],
    },
    {
        title: 'บันทึกการใช้',
        icon: ClipboardList,
        href: '/inventory/usage',
        roles: ['Admin', 'Doctor', 'Therapist'],
    },
    {
        title: 'หลักฐานคลังสินค้า',
        icon: FileText,
        href: '/inventory/evidence',
        roles: ['Admin'],
    },
]

const reportItems = [
    {
        title: 'รายงาน',
        icon: BarChart3,
        href: '/reports',
    },
    {
        title: 'รายได้แพทย์และพนักงาน',
        icon: FileText,
        href: '/reports/commission',
    },
]

export function SidebarContent({ isMobile = false }: { isMobile?: boolean }) {
    const pathname = usePathname()
    const { isSidebarOpen, toggleSidebar } = useUIStore()
    const { user, logout } = useAuthStore()

    // When in mobile mode (inside Sheet), it's always fully expanded
    const collapsed = !isMobile && !isSidebarOpen

    const isActive = (href: string) => {
        if (href === '/dashboard') {
            return pathname === '/dashboard' || pathname === '/'
        }
        return pathname.startsWith(href)
    }

    const filteredMenuItems = menuItems.filter((item) => item.roles.includes(user?.position || ''))

    return (
        <div className="flex flex-col h-full bg-white">
            <div className="flex h-16 shrink-0 items-center justify-between border-b border-slate-100 px-4">
                <div className={cn('flex items-center gap-3', collapsed && 'hidden')}>
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl overflow-hidden ring-2 ring-amber-100 shadow-sm">
                        <Image src="/JinLogo.jpg" alt="Jiin Clinic" width={40} height={40} className="w-full h-full object-contain" />
                    </div>
                    <div>
                        <h1 className="text-sm font-bold text-slate-800">Beauty Clinic</h1>
                        <p className="text-xs text-slate-400">Management System</p>
                    </div>
                </div>
                {!isMobile && (
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={toggleSidebar}
                        className="text-slate-400 hover:bg-amber-50 hover:text-amber-700 rounded-lg"
                        aria-label="Toggle sidebar"
                    >
                        <ChevronLeft
                            className={cn('h-5 w-5 transition-transform duration-300', collapsed && 'rotate-180')}
                        />
                    </Button>
                )}
            </div>

            <ScrollArea className="flex-1">
                <nav className="space-y-0.5 p-3">
                    {/* Main Menu */}
                    {filteredMenuItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            title={collapsed ? item.title : undefined}
                            aria-current={isActive(item.href) ? 'page' : undefined}
                            className={cn(
                                'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-200',
                                isActive(item.href)
                                    ? 'bg-gradient-to-r from-amber-50 to-amber-100/60 text-amber-800 font-semibold shadow-sm'
                                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                            )}
                        >
                            <item.icon className={cn(
                                'h-5 w-5 flex-shrink-0 transition-transform duration-200',
                                isActive(item.href) ? 'text-amber-600' : 'group-hover:scale-110 group-hover:text-amber-600'
                            )} />
                            <span className={cn(collapsed && 'hidden')}>{item.title}</span>
                            {isActive(item.href) && !collapsed && (
                                <span className="ml-auto h-1.5 w-1.5 rounded-full bg-amber-500" />
                            )}
                        </Link>
                    ))}

                    {/* Inventory Section */}
                    {['Admin', 'Doctor', 'Therapist'].includes(user?.position || '') && (
                        <>
                            <div className={cn('my-3 flex items-center gap-2 px-3', collapsed && 'hidden')}>
                                <div className="h-px flex-1 bg-slate-100" />
                                <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">คลังสินค้า</p>
                                <div className="h-px flex-1 bg-slate-100" />
                            </div>
                            {collapsed && <Separator className="my-3" />}
                            {inventoryItems
                                .filter((item) => item.roles.includes(user?.position || ''))
                                .map((item) => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    title={collapsed ? item.title : undefined}
                                    aria-current={isActive(item.href) ? 'page' : undefined}
                                    className={cn(
                                        'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-200',
                                        isActive(item.href)
                                            ? 'bg-gradient-to-r from-amber-50 to-amber-100/60 text-amber-800 font-semibold shadow-sm'
                                            : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                                    )}
                                >
                                    <item.icon className={cn(
                                        'h-5 w-5 flex-shrink-0 transition-transform duration-200',
                                        isActive(item.href) ? 'text-amber-600' : 'group-hover:scale-110 group-hover:text-amber-600'
                                    )} />
                                    <span className={cn(collapsed && 'hidden')}>{item.title}</span>
                                    {isActive(item.href) && !collapsed && (
                                        <span className="ml-auto h-1.5 w-1.5 rounded-full bg-amber-500" />
                                    )}
                                </Link>
                            ))}
                        </>
                    )}

                    {/* Reports Section */}
                    {['Admin', 'Sale', 'Cashier'].includes(user?.position || '') && (
                        <>
                            <div className={cn('my-3 flex items-center gap-2 px-3', collapsed && 'hidden')}>
                                <div className="h-px flex-1 bg-slate-100" />
                                <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">รายงาน</p>
                                <div className="h-px flex-1 bg-slate-100" />
                            </div>
                            {collapsed && <Separator className="my-3" />}
                            {reportItems.map((item) => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    title={collapsed ? item.title : undefined}
                                    aria-current={isActive(item.href) ? 'page' : undefined}
                                    className={cn(
                                        'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-200',
                                        isActive(item.href)
                                            ? 'bg-gradient-to-r from-amber-50 to-amber-100/60 text-amber-800 font-semibold shadow-sm'
                                            : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                                    )}
                                >
                                    <item.icon className={cn(
                                        'h-5 w-5 flex-shrink-0 transition-transform duration-200',
                                        isActive(item.href) ? 'text-amber-600' : 'group-hover:scale-110 group-hover:text-amber-600'
                                    )} />
                                    <span className={cn(collapsed && 'hidden')}>{item.title}</span>
                                    {isActive(item.href) && !collapsed && (
                                        <span className="ml-auto h-1.5 w-1.5 rounded-full bg-amber-500" />
                                    )}
                                </Link>
                            ))}
                        </>
                    )}

                    {/* Settings */}
                    <div className={cn('my-3 flex items-center gap-2 px-3', collapsed && 'hidden')}>
                        <div className="h-px flex-1 bg-slate-100" />
                    </div>
                    {collapsed && <Separator className="my-3" />}
                    <Link
                        href="/settings"
                        title={collapsed ? 'ตั้งค่า' : undefined}
                        aria-current={isActive('/settings') ? 'page' : undefined}
                        className={cn(
                            'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-200',
                            isActive('/settings')
                                ? 'bg-gradient-to-r from-amber-50 to-amber-100/60 text-amber-800 font-semibold shadow-sm'
                                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                        )}
                    >
                        <Settings className={cn(
                            'h-5 w-5 flex-shrink-0 transition-transform duration-200',
                            isActive('/settings') ? 'text-amber-600' : 'group-hover:scale-110 group-hover:text-amber-600 group-hover:rotate-45'
                        )} />
                        <span className={cn(collapsed && 'hidden')}>ตั้งค่า</span>
                    </Link>
                </nav>
            </ScrollArea>

            {/* User Section (Footer) */}
            <div className="shrink-0 border-t border-slate-100 p-3">
                <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="relative flex-shrink-0">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-amber-500 text-sm font-bold text-white shadow-sm">
                                {user?.full_name?.charAt(0) || 'U'}
                            </div>
                            <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-white" title="Online" />
                        </div>
                        <div className={cn('flex-1 min-w-0', collapsed && 'hidden')}>
                            <p className="text-sm font-semibold text-slate-800 truncate">{user?.full_name || 'User'}</p>
                            <p className="text-xs text-slate-400 truncate">{user?.position || 'Staff'}</p>
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={logout}
                        title={collapsed ? 'ออกจากระบบ' : undefined}
                        className="shrink-0 text-slate-400 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
                        aria-label="Logout"
                    >
                        <LogOut className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    )
}

export function Sidebar() {
    const { isSidebarOpen } = useUIStore()

    return (
        <aside
            className={cn(
                'hidden lg:block fixed left-0 top-0 z-40 h-screen bg-white border-r border-slate-200 transition-all duration-300',
                isSidebarOpen ? 'w-64' : 'w-20'
            )}
        >
            <SidebarContent />
        </aside>
    )
}
