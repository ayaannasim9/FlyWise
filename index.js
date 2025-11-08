require("dotenv").config();
const express = require("express");
const roundWayRoute = require("./routes/getFlight");
const oneWayRoute = require("./routes/getSingle");

const app = express();

// Middleware to parse JSON bodies
app.use(express.json());

const API_KEY = process.env.API_KEY;
const PORT = process.env.PORT || 3000;

app.use("/", roundWayRoute);
app.use("/", oneWayRoute);

app.listen(PORT, () => {
  console.log("Server running on PORT:", PORT);
});
