const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { verifyToken: authenticateToken } = require('../middleware/authMiddleware');

// 1. Financial Report
router.get('/financial', authenticateToken, async (req, res) => {
  try {
    // Net Profit = Sales - Cost - Fees
    // Note: This is a simplified calculation. Real-world needs more detailed cost tracking.
    const [sales] = await pool.query(`
            SELECT 
                DATE(transaction_date) as date,
                SUM(net_amount) as total_sales,
                COUNT(*) as tx_count
            FROM Transaction_Header
            WHERE status = 'COMPLETED'
            GROUP BY DATE(transaction_date)
            ORDER BY date DESC
            LIMIT 30
        `);

    // Sales by Channel
    const [channels] = await pool.query(`
            SELECT channel, COUNT(*) as count, SUM(net_amount) as total
            FROM Transaction_Header
            WHERE status = 'COMPLETED'
            GROUP BY channel
        `);

    res.json({ sales, channels });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 2. Staff Performance
router.get('/staff', authenticateToken, async (req, res) => {
  try {
    // Top Doctor (by Revenue) - Assuming 'Doctor' role handled transaction or was assigned
    // Currently, staff_id in Header is Cashier. We need Fee_Log or Transaction_Item staff_ids (not fully implemented in DB yet for multi-staff per item).
    // For now, let's use Fee_Log if available, or just count Cashier performance as placeholder.

    // Let's use Fee_Log for Commissions to find Top Earners
    const [commissions] = await pool.query(`
            SELECT s.full_name, SUM(f.amount) as total_commission
            FROM Fee_Log f
            JOIN Staff s ON f.staff_id = s.staff_id
            GROUP BY s.staff_id
            ORDER BY total_commission DESC
            LIMIT 5
        `);

    res.json({ top_staff: commissions });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 3. Customer Retention
router.get('/retention', authenticateToken, async (req, res) => {
  try {
    // Lost Customers (> 90 days since last visit)
    const [lost] = await pool.query(`
            SELECT c.full_name, c.phone_number, MAX(t.transaction_date) as last_visit
            FROM Customer c
            JOIN Transaction_Header t ON c.customer_id = t.customer_id
            GROUP BY c.customer_id
            HAVING DATEDIFF(NOW(), last_visit) > 90
            ORDER BY last_visit ASC
            LIMIT 20
        `);

    // Top Spenders
    const [vip] = await pool.query(`
            SELECT c.full_name, SUM(t.net_amount) as total_spent
            FROM Customer c
            JOIN Transaction_Header t ON c.customer_id = t.customer_id
            WHERE t.status = 'COMPLETED'
            GROUP BY c.customer_id
            ORDER BY total_spent DESC
            LIMIT 10
        `);

    res.json({ lost_customers: lost, top_spenders: vip });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
