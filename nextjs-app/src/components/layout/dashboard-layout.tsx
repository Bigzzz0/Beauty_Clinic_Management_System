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
                    <div className="h-12 w-12 animate-spin rounded-full border-4 border-pink-500 border-t-transparent" />
                    <p className="text-sm text-slate-500">กำลังโหลด...</p>
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
                <main id="main-content" tabIndex={-1} className="p-4 lg:p-6 outline-none">
                    <Breadcrumbs />
                    {children}
                </main>
            </div>
        </div>
    )
}
