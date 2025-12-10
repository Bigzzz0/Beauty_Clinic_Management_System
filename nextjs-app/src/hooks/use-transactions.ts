import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth-store'
import type { TransactionHeader, PaginatedResponse, PaymentLog } from '@/types'

const getAuthHeader = (): HeadersInit => {
    const token = useAuthStore.getState().token
    if (token) {
        return { Authorization: `Bearer ${token}` }
    }
    return {}
}

export function useTransactions(params?: {
    page?: number
    limit?: number
    status?: string
    startDate?: string
    endDate?: string
}) {
    return useQuery({
        queryKey: ['transactions', params],
        queryFn: async (): Promise<PaginatedResponse<TransactionHeader>> => {
            const searchParams = new URLSearchParams()
            if (params?.page) searchParams.set('page', params.page.toString())
            if (params?.limit) searchParams.set('limit', params.limit.toString())
            if (params?.status) searchParams.set('status', params.status)
            if (params?.startDate) searchParams.set('startDate', params.startDate)
            if (params?.endDate) searchParams.set('endDate', params.endDate)

            const res = await fetch(`/api/transactions?${searchParams}`, {
                headers: getAuthHeader(),
            })
            if (!res.ok) throw new Error('Failed to fetch transactions')
            return res.json()
        },
    })
}

export function useTransaction(id: number) {
    return useQuery({
        queryKey: ['transaction', id],
        queryFn: async (): Promise<TransactionHeader> => {
            const res = await fetch(`/api/transactions/${id}`, {
                headers: getAuthHeader(),
            })
            if (!res.ok) throw new Error('Failed to fetch transaction')
            return res.json()
        },
        enabled: !!id,
    })
}

export function useCreateTransaction() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (data: {
            customer_id: number
            discount: number
            items: Array<{
                product_id?: number | null
                course_id?: number | null
                qty: number
                unit_price: number
                subtotal: number
            }>
        }): Promise<TransactionHeader> => {
            const res = await fetch('/api/transactions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...getAuthHeader(),
                },
                body: JSON.stringify(data),
            })
            if (!res.ok) throw new Error('Failed to create transaction')
            return res.json()
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['transactions'] })
        },
    })
}

export function useAddPayment() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (data: {
            transaction_id: number
            amount_paid: number
            payment_method: 'CASH' | 'TRANSFER' | 'CREDIT' | 'DEPOSIT'
            customer_id?: number
        }): Promise<PaymentLog> => {
            const res = await fetch('/api/payments', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...getAuthHeader(),
                },
                body: JSON.stringify(data),
            })
            if (!res.ok) throw new Error('Failed to add payment')
            return res.json()
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['transactions'] })
        },
    })
}

// Debtors
export function useDebtors() {
    return useQuery({
        queryKey: ['debtors'],
        queryFn: async (): Promise<TransactionHeader[]> => {
            const res = await fetch('/api/transactions?status=PARTIAL,UNPAID', {
                headers: getAuthHeader(),
            })
            if (!res.ok) throw new Error('Failed to fetch debtors')
            const data = await res.json()
            return data.data || data
        },
    })
}
