/**
 * Checks if the given role should have data masked.
 * Only 'Admin' and 'Doctor' can see unmasked data.
 */
export function shouldMask(role?: string | null): boolean {
    if (!role) return true
    const r = role.toLowerCase()
    return r !== 'admin' && r !== 'doctor'
}

/**
 * Masks a Thai ID Card number (e.g. 1-2345-67890-12-3 -> 1-XXXX-XXXXX-XX-3)
 */
export function maskIdCard(idCard?: string | null): string {
    if (!idCard) return ''
    const cleanId = idCard.replace(/\D/g, '')
    if (cleanId.length === 13) {
        return `${cleanId.slice(0, 1)}-XXXX-XXXXX-XX-${cleanId.slice(-1)}`
    }
    return 'XXX-XXXX-XXXX' // Fallback for invalid formats
}

/**
 * Masks a phone number (e.g. 0891234567 -> 089-XXX-XX67)
 */
export function maskPhoneNumber(phone?: string | null): string {
    if (!phone) return ''
    const cleanPhone = phone.replace(/\D/g, '')
    if (cleanPhone.length >= 9) {
        return `${cleanPhone.slice(0, 3)}-XXX-XX${cleanPhone.slice(-2)}`
    }
    return cleanPhone.slice(0, 3) + '-XXX-XXXX'
}

/**
 * Masks a name (e.g. John Doe -> J*** D***)
 */
export function maskName(name?: string | null): string {
    if (!name) return ''
    if (name.length <= 2) return name[0] + '*'
    return name[0] + '*'.repeat(name.length - 2) + name[name.length - 1]
}
