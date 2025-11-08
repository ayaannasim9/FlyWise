require("dotenv").config();
const express = require("express");
const roundWayRoute = require("./routes/getFlight");
const oneWayRoute = require("./routes/getSingle");
const flightTracker = require("./routes/flightTracking");

const app = express();

// Middleware to parse JSON bodies
app.use(express.json());

const PORT = process.env.PORT || 3000;

app.use("/", roundWayRoute);
app.use("/", oneWayRoute);
app.use("/", flightTracker);

app.listen(PORT, () => {
  console.log("Server running on PORT:", PORT);
});
