const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// GET /api/dashboard/stats
router.get('/dashboard/stats', async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];

        // 1. Daily Sales
        const [dailySales] = await pool.query(`
      SELECT SUM(net_amount) as total 
      FROM Transaction_Header 
      WHERE DATE(created_at) = ?
    `, [today]);

        // 2. Transaction Count
        const [txCount] = await pool.query(`
      SELECT COUNT(*) as count 
      FROM Transaction_Header 
      WHERE DATE(created_at) = ?
    `, [today]);

        // 3. Low Stock Count
        const [lowStock] = await pool.query(`
      SELECT COUNT(*) as count 
      FROM Inventory 
      WHERE full_qty <= 5
    `);

        res.json({
            daily_sales: dailySales[0].total || 0,
            transaction_count: txCount[0].count || 0,
            low_stock_count: lowStock[0].count || 0
        });
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// GET /api/dashboard/low-stock
router.get('/dashboard/low-stock', async (req, res) => {
    try {
        const [rows] = await pool.query(`
      SELECT p.product_name, i.full_qty, i.opened_qty, p.main_unit
      FROM Product p
      JOIN Inventory i ON p.product_id = i.product_id
      WHERE i.full_qty <= 5
      ORDER BY i.full_qty ASC
    `);
        res.json(rows);
    } catch (error) {
        console.error('Error fetching low stock:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

module.exports = router;
