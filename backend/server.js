const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    project: "Emergency Railway Journey Assistant",
    version: "1.0.0",
    status: "Backend Running Successfully"
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚆 ERJA Backend running on http://localhost:${PORT}`);
});