const express = require("express");
const cors = require("cors");
const path = require("path");

const authRoutes = require("./routes/auth");
const categoryRoutes = require("./routes/categories");
const expenseRoutes = require("./routes/expenses");
const analyticsRoutes = require("./routes/analytics");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/analytics", analyticsRoutes);

app.get("/health", (req, res) => res.json({ status: "ok" }));

// Serve the frontend when running locally (on Vercel, the /public folder at the
// project root is served automatically and this line is a harmless no-op there).
app.use(express.static(path.join(__dirname, "..", "public")));

// Centralized error handler so every route's `next(err)` lands here.
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: err.message || "Internal server error" });
});

module.exports = app;
