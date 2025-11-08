const express = require('express');
const router = express.Router();

const API_KEY = process.env.API_KEY;
const BASE_URL = 'https://api.flightapi.io/';

router.get('/departure', async (req, res) => {
  const endpoint = 'roundtrip';

  try {
    const {
      departure_airport_code,
      arrival_airport_code,
      departure_date,
      arrival_date,
      number_of_adults = 1,
      number_of_children = 0,
      number_of_infants = 0,
      cabin_class = 'Economy',
      currency = 'EUR'
    } = req.query;

    // Validate required params
    if (!departure_airport_code || !arrival_airport_code || !departure_date || !arrival_date) {
      console.log(' Missing required airport or date info');
      return res.status(400).json({ error: 'Missing required airport or date info' });
    }

    // Build request URL correctly
    const url = `${BASE_URL}${endpoint}/${API_KEY}/${departure_airport_code}/${arrival_airport_code}/${departure_date}/${arrival_date}/${number_of_adults}/${number_of_children}/${number_of_infants}/${cabin_class}/${currency}`;

    console.log('Fetching:', url);

    const response = await fetch(url);

    if (!response.ok) {
      const errBody = await response.text();
      return res.status(response.status).json({ error: errBody });
    }

    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error('FLIGHT API ERROR:', err);
    res.status(500).json({ error: 'Server error while fetching flight data' });
  }
});

module.exports = router;