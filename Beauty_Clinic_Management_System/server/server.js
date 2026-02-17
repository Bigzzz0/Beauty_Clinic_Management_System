const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const db = require('./config/db');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const inventoryRoutes = require('./routes/inventoryRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const authRoutes = require('./routes/authRoutes');
const patientRoutes = require('./routes/patientRoutes');
const reportRoutes = require('./routes/reportRoutes');

app.use('/api', inventoryRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api', dashboardRoutes);
app.use('/api', authRoutes);
app.use('/api', patientRoutes);
app.use('/api/reports', reportRoutes);

// Test database connection
db.getConnection()
    .then(connection => {
        console.log('Successfully connected to database');
        connection.release();
    })
    .catch(err => {
        console.error('Error connecting to database:', err);
    });

app.get('/', (req, res) => {
    res.send('Beauty Clinic API is running');
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
