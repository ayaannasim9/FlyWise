require("dotenv").config();
const express = require("express");
const cors = require("cors");

const getFlight = require("./routes/getFlight");
const getSingle = require("./routes/getSingle");
const flightTracking = require("./routes/flightTracking");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/", getFlight);
app.use("/", getSingle);
app.use("/", flightTracking);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("✅ Server running on PORT:", PORT));
