import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Staff } from '@/types'

interface AuthState {
    user: Staff | null
    token: string | null
    isAuthenticated: boolean
    isLoading: boolean

    // Actions
    login: (user: Staff, token: string) => void
    logout: () => void
    setLoading: (loading: boolean) => void

    // Role checks
    isAdmin: () => boolean
    isDoctor: () => boolean
    isCashier: () => boolean
    isTherapist: () => boolean
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: true,

            login: (user, token) => {
                set({
                    user,
                    token,
                    isAuthenticated: true,
                    isLoading: false,
                })
            },

            logout: () => {
                set({
                    user: null,
                    token: null,
                    isAuthenticated: false,
                    isLoading: false,
                })
            },

            setLoading: (loading) => {
                set({ isLoading: loading })
            },

            isAdmin: () => get().user?.position === 'Admin',
            isDoctor: () => get().user?.position === 'Doctor',
            isCashier: () => get().user?.position === 'Cashier' || get().user?.position === 'Sale',
            isTherapist: () => get().user?.position === 'Therapist',
        }),
        {
            name: 'auth-storage',
            partialize: (state) => ({
                user: state.user,
                token: state.token,
                isAuthenticated: state.isAuthenticated,
            }),
        }
    )
)
