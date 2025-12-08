import { z } from 'zod'

const productCategories = ['Botox', 'Filler', 'Treatment', 'Medicine', 'Equipment', 'Skin'] as const

export const productSchema = z.object({
    product_code: z.string().optional(),
    product_name: z.string().min(1, 'กรุณากรอกชื่อสินค้า'),
    category: z.enum(productCategories, 'กรุณาเลือกหมวดหมู่'),
    main_unit: z.string().min(1, 'กรุณากรอกหน่วยหลัก'),
    sub_unit: z.string().min(1, 'กรุณากรอกหน่วยย่อย'),
    pack_size: z.coerce.number().min(1, 'จำนวนต่อแพ็คต้องมากกว่า 0'),
    is_liquid: z.boolean().default(false),
    cost_price: z.coerce.number().min(0, 'ราคาทุนต้องไม่น้อยกว่า 0'),
    standard_price: z.coerce.number().min(0, 'ราคาขายต้องไม่น้อยกว่า 0'),
    staff_price: z.coerce.number().min(0).optional(),
    is_active: z.boolean().default(true),
})

export const courseSchema = z.object({
    course_code: z.string().optional(),
    course_name: z.string().min(1, 'กรุณากรอกชื่อคอร์ส'),
    description: z.string().optional(),
    standard_price: z.coerce.number().min(0, 'ราคาขายต้องไม่น้อยกว่า 0'),
    staff_price: z.coerce.number().min(0).optional(),
    is_active: z.boolean().default(true),
    items: z.array(z.object({
        item_name: z.string().min(1, 'กรุณากรอกชื่อรายการ'),
        qty_limit: z.coerce.number().min(1, 'จำนวนครั้งต้องมากกว่า 0'),
    })).optional(),
})

export type ProductFormData = z.infer<typeof productSchema>
export type CourseFormData = z.infer<typeof courseSchema>
