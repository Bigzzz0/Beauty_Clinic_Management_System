import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth-store'
import type { Product, Course } from '@/types'

const getAuthHeader = (): HeadersInit => {
    const token = useAuthStore.getState().token
    if (token) {
        return { Authorization: `Bearer ${token}` }
    }
    return {}
}

// Products
export function useProducts(params?: { category?: string; search?: string }) {
    return useQuery({
        queryKey: ['products', params],
        queryFn: async (): Promise<Product[]> => {
            const searchParams = new URLSearchParams()
            if (params?.category) searchParams.set('category', params.category)
            if (params?.search) searchParams.set('search', params.search)

            const res = await fetch(`/api/products?${searchParams}`, {
                headers: getAuthHeader(),
            })
            if (!res.ok) throw new Error('Failed to fetch products')
            return res.json()
        },
    })
}

export function useProduct(id: number) {
    return useQuery({
        queryKey: ['product', id],
        queryFn: async (): Promise<Product> => {
            const res = await fetch(`/api/products/${id}`, {
                headers: getAuthHeader(),
            })
            if (!res.ok) throw new Error('Failed to fetch product')
            return res.json()
        },
        enabled: !!id,
    })
}

export function useCreateProduct() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (data: Partial<Product>): Promise<Product> => {
            const res = await fetch('/api/products', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...getAuthHeader(),
                },
                body: JSON.stringify(data),
            })
            if (!res.ok) throw new Error('Failed to create product')
            return res.json()
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] })
        },
    })
}

export function useUpdateProduct() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async ({ id, data }: { id: number; data: Partial<Product> }): Promise<Product> => {
            const res = await fetch(`/api/products/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    ...getAuthHeader(),
                },
                body: JSON.stringify(data),
            })
            if (!res.ok) throw new Error('Failed to update product')
            return res.json()
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] })
        },
    })
}

// Courses
export function useCourses() {
    return useQuery({
        queryKey: ['courses'],
        queryFn: async (): Promise<Course[]> => {
            const res = await fetch('/api/courses', {
                headers: getAuthHeader(),
            })
            if (!res.ok) throw new Error('Failed to fetch courses')
            return res.json()
        },
    })
}

export function useCourse(id: number) {
    return useQuery({
        queryKey: ['course', id],
        queryFn: async (): Promise<Course> => {
            const res = await fetch(`/api/courses/${id}`, {
                headers: getAuthHeader(),
            })
            if (!res.ok) throw new Error('Failed to fetch course')
            return res.json()
        },
        enabled: !!id,
    })
}

export function useCreateCourse() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (data: Partial<Course>): Promise<Course> => {
            const res = await fetch('/api/courses', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...getAuthHeader(),
                },
                body: JSON.stringify(data),
            })
            if (!res.ok) throw new Error('Failed to create course')
            return res.json()
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['courses'] })
        },
    })
}
