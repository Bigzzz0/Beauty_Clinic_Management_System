import { z } from 'zod'

export const loginSchema = z.object({
    username: z.string().min(1, 'กรุณากรอกชื่อผู้ใช้'),
    password: z.string().min(1, 'กรุณากรอกรหัสผ่าน'),
})

export const changePasswordSchema = z.object({
    current_password: z.string().min(1, 'กรุณากรอกรหัสผ่านปัจจุบัน'),
    new_password: z.string().min(6, 'รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร'),
    confirm_password: z.string().min(1, 'กรุณายืนยันรหัสผ่าน'),
}).refine((data) => data.new_password === data.confirm_password, {
    message: 'รหัสผ่านไม่ตรงกัน',
    path: ['confirm_password'],
})

export type LoginInput = z.infer<typeof loginSchema>
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>
