'use client'

import { useState } from 'react'
import { Phone, AlertTriangle } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface PhoneInputProps {
    id?: string
    value: string
    onChange: (value: string) => void
    required?: boolean
    className?: string
    placeholder?: string
    disabled?: boolean
}

/**
 * PhoneInputField — รับตัวเลขและสัญลักษณ์ +()-  เท่านั้น
 * แสดง error ถ้าน้อยกว่า 9 หลัก / ✓ ถ้าถูกต้อง
 */
export function PhoneInputField({
    id = 'phone_number',
    value,
    onChange,
    required = false,
    className,
    placeholder = '08x-xxx-xxxx',
    disabled = false,
}: PhoneInputProps) {
    const [touched, setTouched] = useState(false)

    const digits = value.replace(/\D/g, '')
    const isValid = digits.length >= 9 && digits.length <= 15
    const showError = touched && value.length > 0 && !isValid

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // allow digits, +, (, ), -, space only
        const cleaned = e.target.value.replace(/[^0-9+() -]/g, '').slice(0, 20)
        onChange(cleaned)
    }

    return (
        <div className="space-y-1">
            <div className="relative">
                <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                    id={id}
                    inputMode="tel"
                    required={required}
                    disabled={disabled}
                    value={value}
                    onChange={handleChange}
                    onBlur={() => setTouched(true)}
                    placeholder={placeholder}
                    className={cn(
                        'pl-9',
                        showError && 'border-red-500 focus-visible:ring-red-500',
                        className
                    )}
                    aria-describedby={`${id}-hint`}
                />
            </div>

            {showError && (
                <p id={`${id}-hint`} className="text-xs text-red-500 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3 shrink-0" />
                    เบอร์โทรต้องมีอย่างน้อย 9 หลัก (รับตัวเลขและ + - ( ) เท่านั้น)
                </p>
            )}
            {touched && value.length > 0 && isValid && (
                <p id={`${id}-hint`} className="text-xs text-green-600">
                    ✓ รูปแบบถูกต้อง
                </p>
            )}
        </div>
    )
}
