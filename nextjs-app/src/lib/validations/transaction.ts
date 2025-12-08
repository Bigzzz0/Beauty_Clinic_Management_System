import { z } from 'zod'

const paymentMethods = ['CASH', 'TRANSFER', 'CREDIT'] as const

export const transactionItemSchema = z.object({
    product_id: z.number().nullable().optional(),
    course_id: z.number().nullable().optional(),
    qty: z.coerce.number().min(1, 'จำนวนต้องมากกว่า 0'),
    unit_price: z.coerce.number().min(0),
    subtotal: z.coerce.number().min(0),
})

export const transactionSchema = z.object({
    customer_id: z.coerce.number().min(1, 'กรุณาเลือกลูกค้า'),
    discount: z.coerce.number().min(0, 'ส่วนลดต้องไม่ติดลบ').default(0),
    items: z.array(transactionItemSchema).min(1, 'กรุณาเพิ่มสินค้าอย่างน้อย 1 รายการ'),
})

export const paymentSchema = z.object({
    transaction_id: z.coerce.number().min(1),
    amount_paid: z.coerce.number().min(0.01, 'จำนวนเงินต้องมากกว่า 0'),
    payment_method: z.enum(paymentMethods, 'กรุณาเลือกวิธีชำระเงิน'),
})

export type TransactionFormData = z.infer<typeof transactionSchema>
export type TransactionItemFormData = z.infer<typeof transactionItemSchema>
export type PaymentFormData = z.infer<typeof paymentSchema>
