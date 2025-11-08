require('dotenv').config();
const express = require('express');
const flightRoute = require('./routes/getFlight');

const app = express();

// Middleware to parse JSON bodies
app.use(express.json());

const API_KEY = process.env.API_KEY;
const PORT = process.env.PORT || 3000;
console.log('Loaded API Key:', API_KEY);

app.use('/flight', flightRoute);

app.listen(PORT, () => {
  console.log('Server running on PORT:', PORT);
});