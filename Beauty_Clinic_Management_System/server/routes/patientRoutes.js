const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { verifyToken } = require('../middleware/authMiddleware');

// GET /api/patients - Search/List Patients
router.get('/patients', verifyToken, async (req, res) => {
    const { search, member_level, has_debt } = req.query;
    try {
        let query = `
      SELECT c.*, 
      (SELECT SUM(remaining_balance) FROM Transaction_Header t WHERE t.customer_id = c.customer_id AND t.payment_status != 'PAID') as total_debt
      FROM Customer c
    `;
        let params = [];
        let conditions = [];

        if (search) {
            conditions.push('(c.full_name LIKE ? OR c.nickname LIKE ? OR c.hn_code LIKE ? OR c.phone_number LIKE ?)');
            const term = `%${search}%`;
            params.push(term, term, term, term);
        }

        if (member_level) {
            conditions.push('c.member_level = ?');
            params.push(member_level);
        }

        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }

        // Filter by debt (post-query or having clause? HAVING is better for calculated field)
        if (has_debt === 'true') {
            query += ' HAVING total_debt > 0';
        }

        query += ' ORDER BY c.updated_at DESC LIMIT 50';

        const [rows] = await pool.query(query, params);
        res.json(rows);
    } catch (error) {
        console.error('Error fetching patients:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// GET /api/patients/:id - Get Single Patient with History & Gallery
router.get('/patients/:id', verifyToken, async (req, res) => {
    const { id } = req.params;
    try {
        // 1. Get Patient Info with Debt
        const [patients] = await pool.query(`
      SELECT c.*, 
      (SELECT SUM(remaining_balance) FROM Transaction_Header t WHERE t.customer_id = c.customer_id AND t.payment_status != 'PAID') as total_debt
      FROM Customer c 
      WHERE c.customer_id = ?
    `, [id]);

        if (patients.length === 0) {
            return res.status(404).json({ message: 'Patient not found' });
        }
        const patient = patients[0];

        // 2. Get Treatment History
        const [history] = await pool.query(`
      SELECT 
        h.transaction_id, 
        h.transaction_date, 
        h.total_amount, 
        s.full_name as doctor_name,
        GROUP_CONCAT(p.product_name SEPARATOR ', ') as treatments
      FROM Transaction_Header h
      JOIN Staff s ON h.staff_id = s.staff_id
      LEFT JOIN Transaction_Item ti ON h.transaction_id = ti.transaction_id
      LEFT JOIN Product p ON ti.product_id = p.product_id
      WHERE h.customer_id = ?
      GROUP BY h.transaction_id
      ORDER BY h.transaction_date DESC
    `, [id]);

        // 3. Get Gallery
        const [gallery] = await pool.query(`
      SELECT * FROM Patient_Gallery WHERE customer_id = ? ORDER BY taken_date DESC, created_at DESC
    `, [id]);

        res.json({ ...patient, history, gallery });
    } catch (error) {
        console.error('Error fetching patient details:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// POST /api/patients - Create New Patient
router.post('/patients', verifyToken, async (req, res) => {
    const { hn_code, full_name, phone_number, birth_date, drug_allergy, underlying_disease } = req.body;

    try {
        // Check duplicate HN
        const [existing] = await pool.query('SELECT customer_id FROM Customer WHERE hn_code = ?', [hn_code]);
        if (existing.length > 0) {
            return res.status(400).json({ message: 'HN Code already exists' });
        }

        const [result] = await pool.query(`
      INSERT INTO Customer (hn_code, full_name, phone_number, birth_date, drug_allergy, underlying_disease)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [hn_code, full_name, phone_number, birth_date, drug_allergy, underlying_disease]);

        res.status(201).json({ message: 'Patient created', customer_id: result.insertId });
    } catch (error) {
        console.error('Error creating patient:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// PUT /api/patients/:id - Update Patient Profile
router.put('/patients/:id', verifyToken, async (req, res) => {
    const { id } = req.params;
    const {
        first_name, last_name, nickname, phone_number, birth_date,
        drug_allergy, underlying_disease, address, member_level, personal_consult
    } = req.body;

    try {
        await pool.query(`
      UPDATE Customer 
      SET first_name = ?, last_name = ?, nickname = ?, phone_number = ?, 
          birth_date = ?, drug_allergy = ?, underlying_disease = ?, 
          address = ?, member_level = ?, personal_consult = ?
      WHERE customer_id = ?
    `, [first_name, last_name, nickname, phone_number, birth_date, drug_allergy, underlying_disease, address, member_level, personal_consult, id]);

        res.json({ message: 'Patient updated successfully' });
    } catch (error) {
        console.error('Error updating patient:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// POST /api/patients/:id/gallery - Add Image to Gallery
router.post('/patients/:id/gallery', verifyToken, async (req, res) => {
    const { id } = req.params;
    const { image_path, image_type, taken_date, notes } = req.body;
    // Note: In a real app, image_path would come from multer file upload. 
    // Here we accept a path string (or base64 if we were processing it) for simplicity in this environment.

    try {
        await pool.query(`
      INSERT INTO Patient_Gallery (customer_id, image_path, image_type, taken_date, notes)
      VALUES (?, ?, ?, ?, ?)
    `, [id, image_path, image_type || 'Before', taken_date || new Date(), notes]);

        res.status(201).json({ message: 'Image added to gallery' });
    } catch (error) {
        console.error('Error adding to gallery:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

module.exports = router;
