import { test, describe } from 'node:test'
import assert from 'node:assert'
import { transactionSchema, transactionItemSchema, paymentSchema } from './transaction.ts'

describe('transactionItemSchema', () => {
    test('should validate a valid item with product_id', () => {
        const data = {
            product_id: 1,
            qty: 2,
            unit_price: 100,
            subtotal: 200
        }
        const result = transactionItemSchema.safeParse(data)
        assert.strictEqual(result.success, true)
    })

    test('should validate a valid item with course_id', () => {
        const data = {
            course_id: 5,
            qty: 1,
            unit_price: 500,
            subtotal: 500
        }
        const result = transactionItemSchema.safeParse(data)
        assert.strictEqual(result.success, true)
    })

    test('should validate a valid item with both product_id and course_id as null', () => {
        const data = {
            product_id: null,
            course_id: null,
            qty: 1,
            unit_price: 100,
            subtotal: 100
        }
        const result = transactionItemSchema.safeParse(data)
        assert.strictEqual(result.success, true)
    })

    test('should fail if qty is less than 1', () => {
        const data = {
            product_id: 1,
            qty: 0,
            unit_price: 100,
            subtotal: 0
        }
        const result = transactionItemSchema.safeParse(data)
        assert.strictEqual(result.success, false)
        if (!result.success) {
            assert.ok(result.error.errors.some(e => e.message === 'จำนวนต้องมากกว่า 0'))
        }
    })

    test('should fail if unit_price is negative', () => {
        const data = {
            product_id: 1,
            qty: 1,
            unit_price: -10,
            subtotal: -10
        }
        const result = transactionItemSchema.safeParse(data)
        assert.strictEqual(result.success, false)
    })

    test('should fail if subtotal is negative', () => {
        const data = {
            product_id: 1,
            qty: 1,
            unit_price: 10,
            subtotal: -1
        }
        const result = transactionItemSchema.safeParse(data)
        assert.strictEqual(result.success, false)
    })
})

describe('transactionSchema', () => {
    const validItems = [
        { product_id: 1, qty: 1, unit_price: 100, subtotal: 100 }
    ]

    test('should validate a valid transaction', () => {
        const data = {
            customer_id: 1,
            discount: 10,
            items: validItems
        }
        const result = transactionSchema.safeParse(data)
        assert.strictEqual(result.success, true)
    })

    test('should default discount to 0 if omitted', () => {
        const data = {
            customer_id: 1,
            items: validItems
        }
        const result = transactionSchema.safeParse(data)
        assert.strictEqual(result.success, true)
        if (result.success) {
            assert.strictEqual(result.data.discount, 0)
        }
    })

    test('should fail if customer_id is missing', () => {
        const data = {
            discount: 0,
            items: validItems
        }
        const result = transactionSchema.safeParse(data)
        assert.strictEqual(result.success, false)
    })

    test('should fail if customer_id is less than 1', () => {
        const data = {
            customer_id: 0,
            discount: 0,
            items: validItems
        }
        const result = transactionSchema.safeParse(data)
        assert.strictEqual(result.success, false)
        if (!result.success) {
            assert.ok(result.error.errors.some(e => e.message === 'กรุณาเลือกลูกค้า'))
        }
    })

    test('should fail if discount is negative', () => {
        const data = {
            customer_id: 1,
            discount: -1,
            items: validItems
        }
        const result = transactionSchema.safeParse(data)
        assert.strictEqual(result.success, false)
        if (!result.success) {
            assert.ok(result.error.errors.some(e => e.message === 'ส่วนลดต้องไม่ติดลบ'))
        }
    })

    test('should fail if items array is empty', () => {
        const data = {
            customer_id: 1,
            discount: 0,
            items: []
        }
        const result = transactionSchema.safeParse(data)
        assert.strictEqual(result.success, false)
        if (!result.success) {
            assert.ok(result.error.errors.some(e => e.message === 'กรุณาเพิ่มสินค้าอย่างน้อย 1 รายการ'))
        }
    })
})

describe('paymentSchema', () => {
    test('should validate valid payments', () => {
        const methods = ['CASH', 'TRANSFER', 'CREDIT'] as const
        for (const method of methods) {
            const data = {
                transaction_id: 1,
                amount_paid: 100,
                payment_method: method
            }
            const result = paymentSchema.safeParse(data)
            assert.strictEqual(result.success, true, `Failed for method ${method}`)
        }
    })

    test('should fail if transaction_id is less than 1', () => {
        const data = {
            transaction_id: 0,
            amount_paid: 100,
            payment_method: 'CASH'
        }
        const result = paymentSchema.safeParse(data)
        assert.strictEqual(result.success, false)
    })

    test('should fail if amount_paid is less than 0.01', () => {
        const data = {
            transaction_id: 1,
            amount_paid: 0,
            payment_method: 'CASH'
        }
        const result = paymentSchema.safeParse(data)
        assert.strictEqual(result.success, false)
        if (!result.success) {
            assert.ok(result.error.errors.some(e => e.message === 'จำนวนเงินต้องมากกว่า 0'))
        }
    })

    test('should fail for invalid payment method', () => {
        const data = {
            transaction_id: 1,
            amount_paid: 100,
            payment_method: 'INVALID'
        }
        const result = paymentSchema.safeParse(data as any)
        assert.strictEqual(result.success, false)
        if (!result.success) {
            assert.ok(result.error.errors.some(e => e.message === 'กรุณาเลือกวิธีชำระเงิน'))
        }
    })
})
