import { create } from 'zustand'
import type { Product, Course, CartItem } from '@/types'

interface StaffAssignment {
    doctor_id: number | null
    doctor_name: string | null
    therapist_id: number | null
    therapist_name: string | null
}

interface EnhancedCartItem extends CartItem {
    staff?: StaffAssignment
}

interface CartState {
    items: EnhancedCartItem[]
    customerId: number | null
    customerName: string | null
    customerAlerts: {
        drug_allergy: string | null
        underlying_disease: string | null
    } | null
    discount: number
    discountType: 'fixed' | 'percentage'

    // Actions
    addProduct: (product: Product, qty?: number) => void
    addCourse: (course: Course, qty?: number) => void
    updateQuantity: (itemId: string, qty: number) => void
    removeItem: (itemId: string) => void
    clearCart: () => void
    setCustomer: (customerId: number, customerName: string, alerts?: { drug_allergy: string | null; underlying_disease: string | null }) => void
    clearCustomer: () => void
    setDiscount: (discount: number) => void
    setDiscountType: (discountType: 'fixed' | 'percentage') => void
    setItemStaff: (itemId: string, staff: StaffAssignment) => void

    // Computed
    getSubtotal: () => number
    getDiscountAmount: () => number
    getTotal: () => number
    getItemCount: () => number
}

export const useCartStore = create<CartState>((set, get) => ({
    items: [],
    customerId: null,
    customerName: null,
    customerAlerts: null,
    discount: 0,
    discountType: 'fixed',

    addProduct: (product, qty = 1) => {
        const items = get().items
        const existingIndex = items.findIndex(
            (item) => item.type === 'product' && item.product?.product_id === product.product_id
        )

        if (existingIndex >= 0) {
            const newItems = [...items]
            newItems[existingIndex].qty += qty
            newItems[existingIndex].subtotal = newItems[existingIndex].qty * newItems[existingIndex].unit_price
            set({ items: newItems })
        } else {
            const newItem: EnhancedCartItem = {
                id: `product-${product.product_id}`,
                type: 'product',
                product,
                qty,
                unit_price: product.standard_price,
                subtotal: qty * product.standard_price,
                staff: { doctor_id: null, doctor_name: null, therapist_id: null, therapist_name: null },
            }
            set({ items: [...items, newItem] })
        }
    },

    addCourse: (course, qty = 1) => {
        const items = get().items
        const existingIndex = items.findIndex(
            (item) => item.type === 'course' && item.course?.course_id === course.course_id
        )

        if (existingIndex >= 0) {
            const newItems = [...items]
            newItems[existingIndex].qty += qty
            newItems[existingIndex].subtotal = newItems[existingIndex].qty * newItems[existingIndex].unit_price
            set({ items: newItems })
        } else {
            const newItem: EnhancedCartItem = {
                id: `course-${course.course_id}`,
                type: 'course',
                course,
                qty,
                unit_price: course.standard_price,
                subtotal: qty * course.standard_price,
                staff: { doctor_id: null, doctor_name: null, therapist_id: null, therapist_name: null },
            }
            set({ items: [...items, newItem] })
        }
    },

    updateQuantity: (itemId, qty) => {
        if (qty <= 0) {
            get().removeItem(itemId)
            return
        }

        const items = get().items.map((item) =>
            item.id === itemId
                ? { ...item, qty, subtotal: qty * item.unit_price }
                : item
        )
        set({ items })
        if (get().discountType === 'fixed' && get().discount > get().getSubtotal()) {
            set({ discount: get().getSubtotal() })
        }
    },

    removeItem: (itemId) => {
        set({ items: get().items.filter((item) => item.id !== itemId) })
        if (get().discountType === 'fixed' && get().discount > get().getSubtotal()) {
            set({ discount: get().getSubtotal() })
        }
    },

    clearCart: () => {
        set({ items: [], discount: 0, discountType: 'fixed' })
    },

    setCustomer: (customerId, customerName, alerts) => {
        set({
            customerId,
            customerName,
            customerAlerts: alerts || null,
        })
    },

    clearCustomer: () => {
        set({ customerId: null, customerName: null, customerAlerts: null })
    },

    setDiscount: (discount) => {
        const d = Math.max(0, discount)
        if (get().discountType === 'percentage') {
            set({ discount: Math.min(d, 100) })
        } else {
            set({ discount: Math.min(d, get().getSubtotal()) })
        }
    },

    setDiscountType: (discountType) => {
        set({ discountType, discount: 0 })
    },

    setItemStaff: (itemId, staff) => {
        const items = get().items.map((item) =>
            item.id === itemId ? { ...item, staff } : item
        )
        set({ items })
    },

    getSubtotal: () => {
        return get().items.reduce((sum, item) => sum + item.subtotal, 0)
    },

    getDiscountAmount: () => {
        if (get().discountType === 'percentage') {
            return (get().getSubtotal() * get().discount) / 100
        }
        return get().discount
    },

    getTotal: () => {
        return Math.max(0, get().getSubtotal() - get().getDiscountAmount())
    },

    getItemCount: () => {
        return get().items.reduce((sum, item) => sum + item.qty, 0)
    },
}))
