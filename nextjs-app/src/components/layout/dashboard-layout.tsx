'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/auth-store'
import { useUIStore } from '@/stores/ui-store'
import { cn } from '@/lib/utils'
import { Sidebar } from './sidebar'
import { Header } from './header'

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
            <Sidebar />
            <div
                className={cn(
                    'transition-all duration-300',
                    isSidebarOpen ? 'lg:ml-64' : 'lg:ml-20'
                )}
            >
                <Header />
                <main className="p-4 lg:p-6">{children}</main>
            </div>
        </div>
    )
}
