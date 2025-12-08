import { create } from 'zustand'

interface UIState {
    isSidebarOpen: boolean
    isMobile: boolean
    theme: 'light' | 'dark'

    // Actions
    toggleSidebar: () => void
    setSidebarOpen: (open: boolean) => void
    setMobile: (mobile: boolean) => void
    setTheme: (theme: 'light' | 'dark') => void
}

export const useUIStore = create<UIState>((set, get) => ({
    isSidebarOpen: true,
    isMobile: false,
    theme: 'light',

    toggleSidebar: () => {
        set({ isSidebarOpen: !get().isSidebarOpen })
    },

    setSidebarOpen: (open) => {
        set({ isSidebarOpen: open })
    },

    setMobile: (mobile) => {
        set({ isMobile: mobile, isSidebarOpen: !mobile })
    },

    setTheme: (theme) => {
        set({ theme })
    },
}))
