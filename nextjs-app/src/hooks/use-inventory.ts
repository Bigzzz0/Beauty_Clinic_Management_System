import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth-store'
import type { Inventory, StockMovement } from '@/types'

const getAuthHeader = (): HeadersInit => {
    const token = useAuthStore.getState().token
    if (token) {
        return { Authorization: `Bearer ${token}` }
    }
    return {}
}

export function useInventory(params?: { search?: string; lowStock?: boolean }) {
    return useQuery({
        queryKey: ['inventory', params],
        queryFn: async (): Promise<Inventory[]> => {
            const searchParams = new URLSearchParams()
            if (params?.search) searchParams.set('search', params.search)
            if (params?.lowStock) searchParams.set('lowStock', 'true')

            const res = await fetch(`/api/inventory?${searchParams}`, {
                headers: getAuthHeader(),
            })
            if (!res.ok) throw new Error('Failed to fetch inventory')
            return res.json()
        },
    })
}

export function useStockIn() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (data: {
            product_id: number
            qty_main: number
            qty_sub?: number
            lot_number?: string
            expiry_date?: string
            note?: string
        }): Promise<StockMovement> => {
            const res = await fetch('/api/inventory/stock-in', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...getAuthHeader(),
                },
                body: JSON.stringify(data),
            })
            if (!res.ok) throw new Error('Failed to record stock in')
            return res.json()
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['inventory'] })
        },
    })
}

export function useRecordUsage() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (data: {
            customer_id: number
            customer_course_id?: number
            service_type: string
            notes?: string
            items: Array<{
                product_id: number
                qty_used: number
                lot_number?: string
            }>
            fees?: Array<{
                staff_id: number
                fee_type: 'DF' | 'HAND_FEE'
                amount: number
            }>
        }): Promise<{ usage_id: number }> => {
            const res = await fetch('/api/inventory/usage', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...getAuthHeader(),
                },
                body: JSON.stringify(data),
            })
            if (!res.ok) throw new Error('Failed to record usage')
            return res.json()
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['inventory'] })
        },
    })
}

// Reports
export function useInventoryDashboard() {
    return useQuery({
        queryKey: ['inventory', 'dashboard'],
        queryFn: async () => {
            const res = await fetch('/api/reports/inventory/dashboard', {
                headers: getAuthHeader(),
            })
            if (!res.ok) throw new Error('Failed to fetch inventory dashboard')
            return res.json()
        },
    })
}

export function useDailyUsageReport(date: string) {
    return useQuery({
        queryKey: ['inventory', 'daily-usage', date],
        queryFn: async () => {
            const res = await fetch(`/api/reports/inventory/daily-usage?date=${date}`, {
                headers: getAuthHeader(),
            })
            if (!res.ok) throw new Error('Failed to fetch daily usage report')
            return res.json()
        },
        enabled: !!date,
    })
}

export function useStockCard(productId: number, month?: string) {
    return useQuery({
        queryKey: ['inventory', 'stock-card', productId, month],
        queryFn: async () => {
            const searchParams = new URLSearchParams()
            if (month) searchParams.set('month', month)

            const res = await fetch(`/api/reports/inventory/stock-card/${productId}?${searchParams}`, {
                headers: getAuthHeader(),
            })
            if (!res.ok) throw new Error('Failed to fetch stock card')
            return res.json()
        },
        enabled: !!productId,
    })
}
