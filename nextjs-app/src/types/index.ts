// Staff types
export type StaffPosition = 'Doctor' | 'Therapist' | 'Admin' | 'Sale' | 'Cashier'

export interface Staff {
    staff_id: number
    full_name: string
    position: StaffPosition
    username: string
    is_active: boolean
    created_at: string
}

// Customer types
export interface Customer {
    customer_id: number
    hn_code: string
    id_card_number?: string
    first_name: string
    last_name: string
    full_name?: string
    nickname?: string
    phone_number: string
    address?: string
    birth_date?: string
    drug_allergy?: string
    underlying_disease?: string
    personal_consult?: string
    member_level: string
    created_at: string
}

// Product types
export type ProductCategory = 'Botox' | 'Filler' | 'Treatment' | 'Medicine' | 'Equipment' | 'Skin'

export interface Product {
    product_id: number
    product_code?: string
    product_name: string
    category: ProductCategory
    main_unit: string
    sub_unit: string
    pack_size: number
    is_liquid: boolean
    cost_price: number
    standard_price: number
    staff_price: number
    is_active: boolean
}

// Inventory types
export interface Inventory {
    inventory_id: number
    product_id: number
    full_qty: number
    opened_qty: number
    last_updated: string
    product?: Product
}

// Course types
export interface Course {
    course_id: number
    course_code?: string
    course_name: string
    description?: string
    standard_price: number
    staff_price?: number
    is_active: boolean
    items?: CourseItem[]
}

export interface CourseItem {
    id: number
    course_id: number
    item_name: string
    qty_limit: number
}

// Customer Course types
export type CustomerCourseStatus = 'ACTIVE' | 'EXPIRED' | 'USED_UP'

export interface CustomerCourse {
    id: number
    customer_id: number
    course_id: number
    transaction_id: number
    total_sessions: number
    remaining_sessions: number
    purchase_date?: string
    expiry_date?: string
    status: CustomerCourseStatus
    course?: Course
}

// Transaction types
export type PaymentStatus = 'PAID' | 'PARTIAL' | 'UNPAID' | 'VOIDED'
export type TransactionChannel = 'WALK_IN' | 'BOOKING' | 'ONLINE'
export type PaymentMethod = 'CASH' | 'TRANSFER' | 'CREDIT'

export interface TransactionHeader {
    transaction_id: number
    customer_id: number
    staff_id: number
    transaction_date: string
    total_amount: number
    discount: number
    net_amount: number
    remaining_balance: number
    payment_status: PaymentStatus
    channel: TransactionChannel
    customer?: Customer
    staff?: Staff
    items?: TransactionItem[]
    payments?: PaymentLog[]
}

export interface TransactionItem {
    item_id: number
    transaction_id: number
    product_id?: number
    course_id?: number
    qty: number
    unit_price: number
    subtotal: number
    product?: Product
    course?: Course
}

export interface PaymentLog {
    payment_id: number
    transaction_id: number
    staff_id: number
    amount_paid: number
    payment_method: PaymentMethod
    payment_date: string
}

// Service Usage types
export interface ServiceUsage {
    usage_id: number
    service_date: string
    customer_id: number
    customer_course_id?: number
    service_type: string
    notes?: string
    status: string
    customer?: Customer
    customerCourse?: CustomerCourse
    inventoryUsages?: InventoryUsage[]
    feeLogs?: FeeLog[]
}

export interface InventoryUsage {
    id: number
    usage_id: number
    product_id: number
    qty_used: number
    lot_number?: string
    product?: Product
}

// Fee types
export type FeeType = 'DF' | 'HAND_FEE'

export interface FeeLog {
    fee_id: number
    usage_id: number
    staff_id: number
    fee_type: FeeType
    amount: number
    staff?: Staff
}

// Stock Movement types
export type StockActionType = 'IN' | 'OUT' | 'TRANSFER' | 'ADJUST_DAMAGED' | 'ADJUST_EXPIRED' | 'ADJUST_CLAIM' | 'ADJUST_LOST' | 'USAGE' | 'VOID_RETURN'

export interface StockMovement {
    movement_id: number
    product_id: number
    staff_id: number
    action_type: StockActionType
    qty_main: number
    qty_sub: number
    lot_number?: string
    expiry_date?: string
    evidence_image?: string
    note?: string
    related_transaction_id?: number
    related_usage_id?: number
    created_at: string
    product?: Product
    staff?: Staff
}

// Gallery types
export type GalleryImageType = 'Before' | 'After' | 'Follow-up' | 'Document'

export interface PatientGallery {
    gallery_id: number
    customer_id: number
    usage_id?: number
    image_type: GalleryImageType
    image_path: string
    taken_date: string
    notes?: string
    created_at: string
}

// API Response types
export interface ApiResponse<T> {
    data?: T
    error?: string
    message?: string
}

export interface PaginatedResponse<T> {
    data: T[]
    meta: {
        total: number
        page: number
        limit: number
        totalPages: number
    }
}

// Cart types for POS
export interface CartItem {
    id: string
    type: 'product' | 'course'
    product?: Product
    course?: Course
    qty: number
    unit_price: number
    subtotal: number
}
