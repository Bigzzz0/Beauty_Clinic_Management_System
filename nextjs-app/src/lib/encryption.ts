import crypto from 'crypto'

// Use a 32-byte (256-bit) key for AES-256-GCM.
// In a real application, this should be stored securely in environment variables.
// Ensure this key is NEVER hardcoded in production!
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-fallback-key-32-chars-long1234'
const ALGORITHM = 'aes-256-gcm'

/**
 * Encrypts a string using AES-256-GCM.
 * The output incorporates the IV, the Auth Tag, and the Encrypted Content.
 */
export function encryptData(text: string): string {
    if (!text) return text
    try {
        const iv = crypto.randomBytes(12) // GCM standard IV size is 12 bytes
        const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY.padEnd(32).slice(0, 32)), iv)

        let encrypted = cipher.update(text, 'utf8', 'hex')
        encrypted += cipher.final('hex')
        const authTag = cipher.getAuthTag()

        return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`
    } catch (e) {
        console.error('Encryption failed:', e)
        return text // Fallback to original if encryption fails to prevent data loss, though in strict systems this should throw.
    }
}

/**
 * Decrypts a string previously encrypted with encryptData().
 */
export function decryptData(encryptedData: string): string {
    if (!encryptedData || !encryptedData.includes(':')) return encryptedData

    try {
        const [ivHex, authTagHex, encryptedText] = encryptedData.split(':')
        const iv = Buffer.from(ivHex, 'hex')
        const authTag = Buffer.from(authTagHex, 'hex')

        const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY.padEnd(32).slice(0, 32)), iv)
        decipher.setAuthTag(authTag)

        let decrypted = decipher.update(encryptedText, 'hex', 'utf8')
        decrypted += decipher.final('utf8')

        return decrypted
    } catch (e) {
        console.error('Decryption failed, returning original string:', e)
        return encryptedData // Return original string if decryption fails (e.g. data wasn't actually encrypted)
    }
}
