const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { verifyToken: authenticateToken } = require('../middleware/authMiddleware');

// Create Transaction (POS)
router.post('/', authenticateToken, async (req, res) => {
    const { customer_id, staff_id, items, total_amount, discount, net_amount, payments, channel } = req.body;
    // items: [{ product_id, qty_used, unit_price, doctor_id, therapist_id }]
    // payments: [{ amount, method }]

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // Calculate total paid
        const amount_paid = payments.reduce((sum, p) => sum + Number(p.amount), 0);
        const remaining_balance = net_amount - amount_paid;
        const payment_status = remaining_balance <= 0 ? 'PAID' : (amount_paid > 0 ? 'PARTIAL' : 'UNPAID');

        // 1. Create Header
        const [headerRes] = await connection.query(`
            INSERT INTO Transaction_Header 
            (customer_id, staff_id, total_amount, discount, net_amount, remaining_balance, payment_status, channel)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [customer_id, staff_id, total_amount, discount, net_amount, remaining_balance > 0 ? remaining_balance : 0, payment_status, channel || 'WALK_IN']);

        const transactionId = headerRes.insertId;

        // 2. Process Items & Deduct Stock
        for (const item of items) {
            // Insert Item with Staff IDs
            await connection.query(`
                INSERT INTO Transaction_Item (transaction_id, product_id, qty_used, unit_price, subtotal_price, doctor_id, therapist_id)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `, [transactionId, item.product_id, item.qty_used, item.unit_price, item.qty_used * item.unit_price, item.doctor_id || null, item.therapist_id || null]);

            // Deduct Stock (Complex Logic: Opened vs Full)
            const [product] = await connection.query('SELECT pack_size, full_qty, opened_qty FROM Inventory WHERE product_id = ?', [item.product_id]);
            if (product.length > 0) {
                let { full_qty, opened_qty, pack_size } = product[0];
                let qtyToDeduct = item.qty_used;

                // Deduct from opened first
                if (opened_qty >= qtyToDeduct) {
                    opened_qty -= qtyToDeduct;
                } else {
                    qtyToDeduct -= opened_qty;
                    opened_qty = 0;
                    // Deduct from full
                    const fullDeduct = Math.ceil(qtyToDeduct / pack_size);
                    full_qty -= fullDeduct;
                    opened_qty += (fullDeduct * pack_size) - qtyToDeduct;
                }

                await connection.query('UPDATE Inventory SET full_qty = ?, opened_qty = ? WHERE product_id = ?', [full_qty, opened_qty, item.product_id]);

                // Log Movement
                await connection.query(`
                    INSERT INTO Stock_Movement (product_id, staff_id, action_type, qty_sub, note)
                    VALUES (?, ?, 'OUT', ?, ?)
                `, [item.product_id, staff_id, -item.qty_used, `Sale Tx #${transactionId}`]);
            }
        }

        // 3. Log Payments (Split Payment Support)
        for (const payment of payments) {
            if (payment.amount > 0) {
                await connection.query(`
                    INSERT INTO Payment_Log (transaction_id, staff_id, amount_paid, payment_method)
                    VALUES (?, ?, ?, ?)
                `, [transactionId, staff_id, payment.amount, payment.method]);
            }
        }

        await connection.commit();
        res.json({ message: 'Transaction created', transactionId });

    } catch (error) {
        await connection.rollback();
        console.error('Transaction Error:', error);
        res.status(500).json({ message: 'Transaction failed' });
    } finally {
        connection.release();
    }
});

// Get Transactions (History)
router.get('/', authenticateToken, async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT t.*, c.full_name as customer_name, s.full_name as staff_name 
            FROM Transaction_Header t
            JOIN Customer c ON t.customer_id = c.customer_id
            JOIN Staff s ON t.staff_id = s.staff_id
            ORDER BY t.transaction_date DESC
            LIMIT 100
        `);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Void Transaction
router.post('/:id/void', authenticateToken, async (req, res) => {
    const transactionId = req.params.id;
    const { reason, staff_id } = req.body; // reason: 'BOOKING_CANCEL' or 'CLAIM'

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // 1. Check Status
        const [tx] = await connection.query('SELECT status FROM Transaction_Header WHERE transaction_id = ?', [transactionId]);
        if (tx.length === 0) throw new Error('Transaction not found');
        if (tx[0].status === 'VOIDED') throw new Error('Transaction already voided');

        // 2. Update Status
        await connection.query('UPDATE Transaction_Header SET status = "VOIDED" WHERE transaction_id = ?', [transactionId]);

        // 3. Handle Stock Reversal
        if (reason === 'BOOKING_CANCEL') {
            // Revert Stock (Add back)
            const [items] = await connection.query('SELECT product_id, qty_used FROM Transaction_Item WHERE transaction_id = ?', [transactionId]);

            for (const item of items) {
                // Simple reversal: Add back to opened_qty (or intelligent logic to pack back to full)
                // For simplicity, adding to opened_qty. 
                // Ideally, we should check pack_size and convert back to full_qty if possible.

                const [prod] = await connection.query('SELECT pack_size FROM Product WHERE product_id = ?', [item.product_id]);
                const pack_size = prod[0].pack_size;

                let addFull = Math.floor(item.qty_used / pack_size);
                let addOpened = item.qty_used % pack_size;

                await connection.query('UPDATE Inventory SET full_qty = full_qty + ?, opened_qty = opened_qty + ? WHERE product_id = ?',
                    [addFull, addOpened, item.product_id]);

                // Log Movement
                await connection.query(`
                    INSERT INTO Stock_Movement (product_id, staff_id, action_type, qty_main, qty_sub, note, related_transaction_id)
                    VALUES (?, ?, 'IN', ?, ?, ?, ?)
                `, [item.product_id, staff_id, 'IN', addFull, addOpened, 'Void: Booking Cancel', transactionId]);
            }
        } else if (reason === 'CLAIM') {
            // Do NOT revert stock. Log 'ADJUST_CLAIM'
            const [items] = await connection.query('SELECT product_id, qty_used FROM Transaction_Item WHERE transaction_id = ?', [transactionId]);
            for (const item of items) {
                await connection.query(`
                    INSERT INTO Stock_Movement (product_id, staff_id, action_type, qty_sub, note, related_transaction_id)
                    VALUES (?, ?, 'ADJUST_CLAIM', ?, ?, ?)
                `, [item.product_id, staff_id, -item.qty_used, 'Void: Customer Claim', transactionId]);
            }
        }

        await connection.commit();
        res.json({ message: 'Transaction voided successfully' });

    } catch (error) {
        await connection.rollback();
        console.error('Void Error:', error);
        res.status(500).json({ message: error.message });
    } finally {
        connection.release();
    }
});

// Get Debtors
router.get('/debtors', authenticateToken, async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT t.*, c.full_name as customer_name, c.phone_number
            FROM Transaction_Header t
            JOIN Customer c ON t.customer_id = c.customer_id
            WHERE t.remaining_balance > 0 AND t.status != 'VOIDED'
            ORDER BY t.remaining_balance DESC
        `);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Pay Debt
router.post('/debtors/pay', authenticateToken, async (req, res) => {
    const { transaction_id, amount, payment_method, staff_id } = req.body;

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // 1. Get Transaction
        const [tx] = await connection.query('SELECT remaining_balance, total_amount FROM Transaction_Header WHERE transaction_id = ? FOR UPDATE', [transaction_id]);
        if (tx.length === 0) throw new Error('Transaction not found');

        const currentBalance = Number(tx[0].remaining_balance);
        if (amount > currentBalance) throw new Error('Payment amount exceeds remaining balance');

        const newBalance = currentBalance - amount;
        const newStatus = newBalance <= 0 ? 'PAID' : 'PARTIAL';

        // 2. Update Header
        await connection.query('UPDATE Transaction_Header SET remaining_balance = ?, payment_status = ? WHERE transaction_id = ?',
            [newBalance, newStatus, transaction_id]);

        // 3. Log Payment
        await connection.query(`
            INSERT INTO Payment_Log (transaction_id, staff_id, amount_paid, payment_method)
            VALUES (?, ?, ?, ?)
        `, [transaction_id, staff_id, amount, payment_method]);

        await connection.commit();
        res.json({ message: 'Payment recorded successfully', newBalance });

    } catch (error) {
        await connection.rollback();
        console.error('Debt Payment Error:', error);
        res.status(500).json({ message: error.message });
    } finally {
        connection.release();
    }
});

module.exports = router;
