'use client'

import { QueryClient, QueryClientProvider, QueryCache, MutationCache } from '@tanstack/react-query'
import { useState } from 'react'
import { Toaster } from '@/components/ui/sonner'
import { useAuthStore } from '@/stores/auth-store'
import { useRouter } from 'next/navigation'

export function Providers({ children }: { children: React.ReactNode }) {
    const router = useRouter()

    const [queryClient] = useState(
        () =>
            new QueryClient({
                queryCache: new QueryCache({
                    onError: (error: any) => {
                        if (error?.message?.includes('401') || error?.status === 401 || error?.message === 'Unauthorized') {
                            useAuthStore.getState().logout()
                            router.push('/login')
                        }
                    }
                }),
                mutationCache: new MutationCache({
                    onError: (error: any) => {
                        if (error?.message?.includes('401') || error?.status === 401 || error?.message === 'Unauthorized') {
                            useAuthStore.getState().logout()
                            router.push('/login')
                        }
                    }
                }),
                defaultOptions: {
                    queries: {
                        staleTime: 60 * 1000, // 1 minute
                        retry: (failureCount, error: any) => {
                            if (error?.message?.includes('401') || error?.status === 401 || error?.message === 'Unauthorized') return false;
                            return failureCount < 1;
                        },
                        refetchOnWindowFocus: false,
                    },
                },
            })
    )

    return (
        <QueryClientProvider client={queryClient}>
            {children}
            <Toaster position="top-right" richColors closeButton />
        </QueryClientProvider>
    )
}
