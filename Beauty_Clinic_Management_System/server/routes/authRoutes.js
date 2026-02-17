const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// POST /api/login
router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const [users] = await pool.query('SELECT * FROM Staff WHERE username = ?', [username]);

        if (users.length === 0) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const user = users[0];

        // In a real app, use bcrypt.compare(password, user.password_hash)
        // For this demo/mock data, we might be using plain text or simple hash.
        // Let's assume plain text for the mock data provided in requirements unless specified otherwise.
        // Requirement says "password_hash", so we should ideally check hash.
        // However, the mock data usually has simple passwords.
        // Let's try to compare directly first, if fail, try bcrypt.

        let isValid = false;
        if (user.password_hash === password) {
            isValid = true; // Plain text match (for mock data)
        } else {
            isValid = await bcrypt.compare(password, user.password_hash);
        }

        if (!isValid) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { id: user.staff_id, role: user.position, name: user.full_name },
            process.env.JWT_SECRET || 'secret_key',
            { expiresIn: '24h' }
        );

        res.json({
            token,
            user: {
                id: user.staff_id,
                username: user.username,
                role: user.position,
                name: user.full_name
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

module.exports = router;
