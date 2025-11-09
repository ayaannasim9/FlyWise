require("dotenv").config();
const express = require("express");
const cors = require("cors");

const getFlight = require("./routes/getFlight");
const getSingle = require("./routes/getSingle");
const flightTracking = require("./routes/flightTracking");
const phraseGuide = require("./routes/phraseGuide");
const { getTopRoutes, isConfigured: snowflakeConfigured } = require("./snowflakeClient");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/", getFlight);
app.use("/", getSingle);
app.use("/", flightTracking);
app.use("/", phraseGuide);

app.get("/analytics/routes", async (req, res) => {
  if (!snowflakeConfigured) {
    return res.json({ enabled: false, routes: [] });
  }
  const rows = await getTopRoutes(5);
  res.json({
    enabled: true,
    routes: rows.map((row) => ({
      route: row.ROUTE,
      tripType: row.TRIP_TYPE,
      searches: Number(row.SEARCHES),
    })),
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("✅ Server running on PORT:", PORT));
