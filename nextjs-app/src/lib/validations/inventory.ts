import { z } from 'zod'

const stockActionTypes = ['IN', 'OUT', 'TRANSFER', 'ADJUST_DAMAGED', 'ADJUST_EXPIRED', 'ADJUST_CLAIM', 'ADJUST_LOST'] as const

export const stockInSchema = z.object({
    product_id: z.coerce.number().min(1, 'กรุณาเลือกสินค้า'),
    qty_main: z.coerce.number().min(1, 'จำนวนต้องมากกว่า 0'),
    qty_sub: z.coerce.number().min(0).default(0),
    lot_number: z.string().optional(),
    expiry_date: z.string().optional(),
    evidence_image: z.string().optional(),
    note: z.string().optional(),
})

export const stockAdjustSchema = z.object({
    product_id: z.coerce.number().min(1, 'กรุณาเลือกสินค้า'),
    action_type: z.enum(stockActionTypes, 'กรุณาเลือกประเภทการปรับปรุง'),
    qty_main: z.coerce.number().min(0),
    qty_sub: z.coerce.number().min(0),
    note: z.string().min(1, 'กรุณาระบุเหตุผล'),
    evidence_image: z.string().optional(),
})

export const usageRecordSchema = z.object({
    customer_id: z.coerce.number().min(1, 'กรุณาเลือกลูกค้า'),
    customer_course_id: z.coerce.number().optional(),
    service_type: z.string().min(1, 'กรุณาระบุประเภทบริการ'),
    notes: z.string().optional(),
    items: z.array(z.object({
        product_id: z.coerce.number().min(1),
        qty_used: z.coerce.number().min(1, 'จำนวนต้องมากกว่า 0'),
        lot_number: z.string().optional(),
    })).min(1, 'กรุณาเพิ่มสินค้าที่ใช้อย่างน้อย 1 รายการ'),
    fees: z.array(z.object({
        staff_id: z.coerce.number().min(1),
        fee_type: z.enum(['DF', 'HAND_FEE']),
        amount: z.coerce.number().min(0),
    })).optional(),
})

export type StockInFormData = z.infer<typeof stockInSchema>
export type StockAdjustFormData = z.infer<typeof stockAdjustSchema>
export type UsageRecordFormData = z.infer<typeof usageRecordSchema>
