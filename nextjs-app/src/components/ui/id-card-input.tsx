'use client'

import { useState } from 'react'
import { CreditCard, AlertTriangle } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface IdCardInputProps {
    id?: string
    /** raw 13-digit value (no dashes) stored in state */
    value: string
    /** called with raw 13 digits only */
    onChange: (rawValue: string) => void
    className?: string
    disabled?: boolean
}

/** Format raw digits → X-XXXX-XXXXX-XX-X */
export function formatIdCard(digits: string): string {
    if (digits.length <= 1) return digits
    if (digits.length <= 5) return `${digits[0]}-${digits.slice(1)}`
    if (digits.length <= 10) return `${digits[0]}-${digits.slice(1, 5)}-${digits.slice(5)}`
    if (digits.length <= 12) return `${digits[0]}-${digits.slice(1, 5)}-${digits.slice(5, 10)}-${digits.slice(10)}`
    return `${digits[0]}-${digits.slice(1, 5)}-${digits.slice(5, 10)}-${digits.slice(10, 12)}-${digits[12]}`
}

/**
 * IdCardInputField — Thai National ID
 * - รับตัวเลขเท่านั้น (auto strip)
 * - Auto-format X-XXXX-XXXXX-XX-X ขณะพิมพ์
 * - Error ถ้ากรอกไม่ครบ 13 หลัก
 * - ✓ เมื่อครบ 13 หลัก
 */
export function IdCardInputField({
    id = 'id_card_number',
    value,
    onChange,
    className,
    disabled = false,
}: IdCardInputProps) {
    const [touched, setTouched] = useState(false)

    const displayValue = formatIdCard(value)
    const showError = touched && value.length > 0 && value.length < 13
    const isComplete = value.length === 13

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value.replace(/\D/g, '').slice(0, 13)
        onChange(raw)
    }

    return (
        <div className="space-y-1">
            <div className="relative">
                <CreditCard className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                    id={id}
                    inputMode="numeric"
                    disabled={disabled}
                    value={displayValue}
                    onChange={handleChange}
                    onBlur={() => setTouched(true)}
                    placeholder="X-XXXX-XXXXX-XX-X"
                    maxLength={17}
                    className={cn(
                        'pl-9 font-mono tracking-widest',
                        showError && 'border-red-500 focus-visible:ring-red-500',
                        className
                    )}
                    aria-describedby={`${id}-hint`}
                />
            </div>

            {showError && (
                <p id={`${id}-hint`} className="text-xs text-red-500 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3 shrink-0" />
                    เลขบัตรประชาชนต้องมี 13 หลัก
                </p>
            )}
            {isComplete && !showError && (
                <p id={`${id}-hint`} className="text-xs text-green-600">
                    ✓ รูปแบบถูกต้อง
                </p>
            )}
        </div>
    )
}
