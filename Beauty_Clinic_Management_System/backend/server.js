const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const db = require('./config/db');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Test database connection
db.getConnection((err, connection) => {
  if (err) {
    console.error('Error connecting to database:', err);
  } else {
    console.log('Successfully connected to database');
    connection.release();
  }
});

app.get('/', (req, res) => {
  res.send('Beauty Clinic API is running');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
