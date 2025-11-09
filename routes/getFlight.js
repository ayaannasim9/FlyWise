const express = require("express");
const router = express.Router();
const { logSearch } = require("../snowflakeClient");

const API_KEY = process.env.API_KEY || "690faab4ca6c7ad1653fad49";
const BASE_URL = "https://api.flightapi.io/";

router.get("/roundtrip", async (req, res) => {
  const endpoint = "roundtrip";

  try {
    const {
      departure_airport_code,
      arrival_airport_code,
      departure_date,
      arrival_date,
      number_of_adults = 1,
      number_of_children = 0,
      number_of_infants = 0,
      cabin_class = "Economy",
      currency = "EUR",
    } = req.query;

    // Validate required params
    if (
      !departure_airport_code ||
      !arrival_airport_code ||
      !departure_date ||
      !arrival_date
    ) {
      console.log(" Missing required airport or date info");
      return res
        .status(400)
        .json({ error: "Missing required airport or date info" });
    }

    // Build request URL correctly
    const url = `${BASE_URL}${endpoint}/${API_KEY}/${departure_airport_code}/${arrival_airport_code}/${departure_date}/${arrival_date}/${number_of_adults}/${number_of_children}/${number_of_infants}/${cabin_class}/${currency}`;

    console.log("Fetching:", url);

    const response = await fetch(url);

    if (!response.ok) {
      const errBody = await response.text();
      return res.status(response.status).json({ error: errBody });
    }

    const data = await response.json();
    // res.json(data);

    //extracting the data from the json sent back
    const itineraries = data.itineraries || [];
    const legs = data.legs || [];
    const places = data.places || [];

    // 2) make lookup maps so we can go from id -> object
    const legsById = Object.fromEntries(legs.map((l) => [l.id, l]));
    const placesById = Object.fromEntries(places.map((p) => [p.id, p]));

    // 3) pick a few flights (say top 5)
    const simplified = itineraries.slice(0, 5).map((it) => {
      const priceInfo = it.cheapest_price ?? it.pricing_options?.[0]?.price ?? {};
      const price =
        typeof priceInfo.amount === "number"
          ? priceInfo.amount
          : Number(priceInfo.amount ?? NaN);
      const currency =
        priceInfo.currency_code || priceInfo.currency || data.currency || "EUR";

      // get legs (usually 2 for round trip)
      const legsForThisItinerary = (it.leg_ids || [])
        .map((legId) => {
          const leg = legsById[legId];
          if (!leg) return null;

          // try to resolve airport codes/names if places are present
          const origin = placesById[leg.origin_place_id];
          const destination = placesById[leg.destination_place_id];
          const carrierList =
            leg.marketing_carriers ||
            leg.operating_carriers ||
            leg.marketing_carrier_codes ||
            leg.operating_carrier_codes ||
            [];
          const normalizedCarrier = Array.isArray(carrierList)
            ? carrierList[0]
            : carrierList;

          return {
            leg_id: leg.id,
            departure: leg.departure,
            arrival: leg.arrival,
            from: origin ? origin.code || origin.name : leg.origin_place_id,
            to: destination
              ? destination.code || destination.name
              : leg.destination_place_id,
            stops: leg.stop_count,
            duration_mins: leg.duration_mins ?? leg.duration,
            airline:
              normalizedCarrier?.name ||
              normalizedCarrier?.code ||
              normalizedCarrier ||
              "Multiple airlines",
          };
        })
        .filter(Boolean);

      const totalDuration = legsForThisItinerary.reduce(
        (sum, leg) => sum + (leg.duration_mins || 0),
        0
      );

      return {
        id: it.id,
        price,
        currency,
        legs: legsForThisItinerary,
        total_duration_mins: totalDuration,
      };
    });

    const sorted = simplified.sort((a, b) => {
      const priceA = a.price ?? Infinity;
      const priceB = b.price ?? Infinity;
      return priceA - priceB;
    });

    logSearch({
      route: `${departure_airport_code}->${arrival_airport_code}`,
      tripType: "roundtrip",
      departDate: departure_date,
      returnDate: arrival_date,
      currency,
      travelers:
        Number(number_of_adults) +
        Number(number_of_children) +
        Number(number_of_infants),
    }).catch(() => {});

    res.json(sorted.slice(0, 5));
  } catch (err) {
    console.error("FLIGHT API ERROR:", err);
    res.status(500).json({ error: "Server error while fetching flight data" });
  }
});

module.exports = router;
