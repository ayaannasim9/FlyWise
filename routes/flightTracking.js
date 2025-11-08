const express = require("express");
const router = express.Router();

const API_KEY = process.env.API_KEY;
const BASE_URL = "https://api.flightapi.io/";

router.get("/trackFlight", async (req, res) => {
  const endpoint = "airline";

  try {
    const { num, name, date } = req.query;

    if (!num || !name || !date) {
      console.log("missing data when asking for tracking flight");
      return res.status(400).json({ error: "missing required data" });
    }

    const url = new URL(`${BASE_URL}${endpoint}/${API_KEY}`);
    url.searchParams.set("num", num);
    url.searchParams.set("name", name);
    url.searchParams.set("date", date);

    console.log("fetching", url.toString());

    const response = await fetch(url.toString());
    if (!response.ok) {
      const errBody = await response.text();
      return res.status(response.status).json({ error: errBody });
    }

    const data = await response.json();

    //making sure it's an array
    const list = Array.isArray(data) ? data : [data];
    const simplified = list.map((item) => {
      const departure = item.departure || {};
      const arrival = item.arrival || {};
      return {
        departure: {
          airport: departure.airport,
          code: departure.airportCode,
          time: departure.departureDateTime,
          scheduled: departure.scheduledTime,
          terminal: departure.terminal,
          gate: departure.gate,
        },
        arrival: {
          airport: arrival.airport,
          code: arrival.airportCode,
          time: arrival.arrivalDateTime,
          estimated: arrival.estimatedTime,
          terminal: arrival.terminal,
          gate: arrival.gate,
        },
      };
    });

    res.json(simplified);
  } catch (e) {
    console.error("FLIGHT TRACKING API ERROR:", e);
    res.status(500).json({ error: "Server error while tracking flight" });
  }
});

module.exports = router;
