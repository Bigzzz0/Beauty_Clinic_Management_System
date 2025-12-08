import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth-store'
import type { Customer, PaginatedResponse } from '@/types'

const getAuthHeader = (): HeadersInit => {
    const token = useAuthStore.getState().token
    if (token) {
        return { Authorization: `Bearer ${token}` }
    }
    return {}
}

export function useCustomers(params?: { page?: number; limit?: number; search?: string }) {
    return useQuery({
        queryKey: ['customers', params],
        queryFn: async (): Promise<PaginatedResponse<Customer>> => {
            const searchParams = new URLSearchParams()
            if (params?.page) searchParams.set('page', params.page.toString())
            if (params?.limit) searchParams.set('limit', params.limit.toString())
            if (params?.search) searchParams.set('search', params.search)

            const res = await fetch(`/api/customers?${searchParams}`, {
                headers: getAuthHeader(),
            })
            if (!res.ok) throw new Error('Failed to fetch customers')
            return res.json()
        },
    })
}

export function useCustomer(id: number) {
    return useQuery({
        queryKey: ['customer', id],
        queryFn: async (): Promise<Customer> => {
            const res = await fetch(`/api/customers/${id}`, {
                headers: getAuthHeader(),
            })
            if (!res.ok) throw new Error('Failed to fetch customer')
            return res.json()
        },
        enabled: !!id,
    })
}

export function useSearchCustomers(query: string) {
    return useQuery({
        queryKey: ['customers', 'search', query],
        queryFn: async (): Promise<Customer[]> => {
            const res = await fetch(`/api/customers/search?q=${encodeURIComponent(query)}`, {
                headers: getAuthHeader(),
            })
            if (!res.ok) throw new Error('Failed to search customers')
            return res.json()
        },
        enabled: query.length >= 2,
    })
}

export function useCreateCustomer() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (data: Partial<Customer>): Promise<Customer> => {
            const res = await fetch('/api/customers', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...getAuthHeader(),
                },
                body: JSON.stringify(data),
            })
            if (!res.ok) throw new Error('Failed to create customer')
            return res.json()
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['customers'] })
        },
    })
}

export function useUpdateCustomer() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async ({ id, data }: { id: number; data: Partial<Customer> }): Promise<Customer> => {
            const res = await fetch(`/api/customers/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    ...getAuthHeader(),
                },
                body: JSON.stringify(data),
            })
            if (!res.ok) throw new Error('Failed to update customer')
            return res.json()
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['customers'] })
        },
    })
}
