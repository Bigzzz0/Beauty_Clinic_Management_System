const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { deductStock } = require('../utils/inventoryUtils');

// GET /api/products
router.get('/products', async (req, res) => {
    try {
        const [rows] = await pool.query(`
      SELECT 
        p.*,
        i.full_qty,
        i.opened_qty
      FROM Product p
      LEFT JOIN Inventory i ON p.product_id = i.product_id
    `);
        res.json(rows);
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// POST /api/stock-in
router.post('/stock-in', async (req, res) => {
    const { items, staff_id, evidence_image, supplier, note } = req.body;
    // items: [{ product_id, qty_main, lot_number, expiry_date }]

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        for (const item of items) {
            // 1. Update Inventory (Add to full_qty)
            await connection.query(`
              UPDATE Inventory 
              SET full_qty = full_qty + ? 
              WHERE product_id = ?
            `, [item.qty_main, item.product_id]);

            // 2. Log Movement
            await connection.query(`
              INSERT INTO Stock_Movement 
              (product_id, staff_id, action_type, qty_main, qty_sub, lot_number, expiry_date, evidence_image, note)
              VALUES (?, ?, 'IN', ?, 0, ?, ?, ?, ?)
            `, [item.product_id, staff_id, item.qty_main, item.lot_number, item.expiry_date, evidence_image, `Supplier: ${supplier || '-'} | ${note || ''}`]);
        }

        await connection.commit();
        res.json({ message: 'Stock received successfully' });
    } catch (error) {
        await connection.rollback();
        console.error('Error receiving stock:', error);
        res.status(500).json({ message: 'Internal server error' });
    } finally {
        connection.release();
    }
});

// POST /api/stock-deduct
router.post('/stock-deduct', async (req, res) => {
    const { product_id, qty_used, staff_id, note } = req.body;
    // qty_used is in sub_unit (e.g., Units, CC, ML)

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const current_stock = await deductStock(connection, product_id, qty_used, staff_id, note);

        await connection.commit();
        res.json({ message: 'Stock deducted successfully', current_stock });

    } catch (error) {
        await connection.rollback();
        console.error('Error deducting stock:', error);
        res.status(400).json({ message: error.message });
    } finally {
        connection.release();
    }
});

router.post('/stock-adjust', async (req, res) => {
    const { product_id, qty_main, qty_sub, reason, evidence_image, note, staff_id, related_transaction_id } = req.body;

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // 1. Get Current Stock
        const [inventory] = await connection.query(
            'SELECT full_qty, opened_qty, pack_size FROM Inventory WHERE product_id = ? FOR UPDATE',
            [product_id]
        );

        if (inventory.length === 0) throw new Error('Product not found');
        const current = inventory[0];

        // 2. Calculate Deduction
        let newFull = current.full_qty - qty_main;
        let newOpened = current.opened_qty - qty_sub;

        await connection.query(
            'UPDATE Inventory SET full_qty = full_qty - ?, opened_qty = opened_qty - ? WHERE product_id = ?',
            [qty_main, qty_sub, product_id]
        );

        // 3. Log Movement
        await connection.query(`
            INSERT INTO Stock_Movement 
            (product_id, staff_id, action_type, qty_main, qty_sub, evidence_image, note, related_transaction_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [product_id, staff_id, reason, -qty_main, -qty_sub, evidence_image, note, related_transaction_id || null]);

        await connection.commit();
        res.json({ message: 'Stock adjusted successfully' });

    } catch (error) {
        await connection.rollback();
        console.error('Error adjusting stock:', error);
        res.status(500).json({ message: 'Internal server error' });
    } finally {
        connection.release();
    }
});

module.exports = router;
