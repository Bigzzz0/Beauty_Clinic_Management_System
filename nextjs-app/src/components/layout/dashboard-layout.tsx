'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/auth-store'
import { useUIStore } from '@/stores/ui-store'
import { cn } from '@/lib/utils'
import { Sidebar } from './sidebar'
import { Header } from './header'
import { Breadcrumbs } from '@/components/ui/breadcrumbs'
import { Button } from '@/components/ui/button'

interface DashboardLayoutProps {
    children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
    const { isAuthenticated, isLoading, setLoading } = useAuthStore()
    const { isSidebarOpen, setMobile } = useUIStore()
    const router = useRouter()
    const pathname = usePathname()

    useEffect(() => {
        // Check for mobile on mount
        const checkMobile = () => {
            setMobile(window.innerWidth < 1024)
        }
        checkMobile()
        window.addEventListener('resize', checkMobile)
        return () => window.removeEventListener('resize', checkMobile)
    }, [setMobile])

    useEffect(() => {
        // Wait for hydration then check auth
        setLoading(false)
    }, [setLoading])

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push('/login')
        }
    }, [isAuthenticated, isLoading, router])

    if (isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-50">
                <div className="flex flex-col items-center gap-4">
                    <div className="relative flex h-16 w-16 items-center justify-center">
                        <div className="absolute inset-0 animate-spin rounded-full border-4 border-amber-200 border-t-amber-500" />
                        <div className="h-3 w-3 rounded-full bg-amber-500 animate-pulse" />
                    </div>
                    <div className="flex items-center gap-1.5">
                        {[0, 1, 2].map((i) => (
                            <div
                                key={i}
                                className="h-1.5 w-1.5 rounded-full bg-amber-400"
                                style={{ animation: `pulseGlow 1.2s ease-in-out ${i * 0.2}s infinite` }}
                            />
                        ))}
                    </div>
                    <div className="flex flex-col items-center gap-1 text-center mt-1">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                            Loading System
                        </span>
                        <span className="text-sm font-medium text-slate-600">
                            กำลังโหลดข้อมูลระบบ กรุณารอสักครู่
                        </span>
                    </div>
                </div>
            </div>
        )
    }

    if (!isAuthenticated) {
        return null
    }

    return (
        <div className="min-h-screen bg-slate-50">
            <a
                href="#main-content"
                className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-50 inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
                Skip to main content
            </a>
            <Sidebar />
            <div
                className={cn(
                    'transition-all duration-300',
                    isSidebarOpen ? 'lg:ml-64' : 'lg:ml-20'
                )}
            >
                <Header />
                <main id="main-content" tabIndex={-1} className="p-4 lg:p-6 outline-none animate-fade-in">
                    <Breadcrumbs />
                    {children}
                </main>
            </div>
        </div>
    )
}
