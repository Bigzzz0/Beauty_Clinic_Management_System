'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/auth-store'
import { toast } from 'sonner'

const IDLE_TIMEOUT_MS = 30 * 60 * 1000 // 30 minutes

export function IdleTimeout() {
    const router = useRouter()
    const { isAuthenticated, logout } = useAuthStore()

    useEffect(() => {
        if (!isAuthenticated) return

        let timeoutId: NodeJS.Timeout

        const handleIdle = () => {
            logout()
            toast.error('เซสชันหมดอายุ', {
                description: 'กรุณาเข้าสู่ระบบใหม่อีกครั้งเพื่อความปลอดภัย',
            })
            router.push('/login')
        }

        const resetTimer = () => {
            clearTimeout(timeoutId)
            timeoutId = setTimeout(handleIdle, IDLE_TIMEOUT_MS)
        }

        // DOM Events to track activity
        const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart']

        // Initial setup
        resetTimer()

        // Add listeners
        events.forEach(event => {
            window.addEventListener(event, resetTimer, { passive: true })
        })

        return () => {
            clearTimeout(timeoutId)
            events.forEach(event => {
                window.removeEventListener(event, resetTimer)
            })
        }
    }, [isAuthenticated, logout, router])

    return null
}
