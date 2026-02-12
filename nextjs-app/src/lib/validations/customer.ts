import { z } from 'zod'

export const customerSchema = z.object({
    first_name: z.string().min(1, 'กรุณากรอกชื่อ'),
    last_name: z.string().min(1, 'กรุณากรอกนามสกุล'),
    nickname: z.string().optional(),
    phone_number: z.string().min(9, 'เบอร์โทรไม่ถูกต้อง').max(10, 'เบอร์โทรไม่ถูกต้อง'),
    id_card_number: z.string().length(13, 'เลขบัตรประชาชนต้องมี 13 หลัก').optional().or(z.literal('')),
    address: z.string().optional(),
    birth_date: z.string().optional(),
    drug_allergy: z.string().optional(),
    underlying_disease: z.string().optional(),
    personal_consult: z.string().optional(),
    personal_consult_id: z.number().optional().nullable(),
    member_level: z.string().default('General'),
})

export const customerSearchSchema = z.object({
    q: z.string().min(1, 'กรุณากรอกคำค้นหา'),
})

export type CustomerFormData = z.infer<typeof customerSchema>
export type CustomerSearchInput = z.infer<typeof customerSearchSchema>
