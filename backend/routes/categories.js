const express = require("express");
const db = require("../db");

const router = express.Router();
// Open to the public — no login required (judge-facing demo deployment).

router.get("/", async (req, res, next) => {
  try {
    const result = await db.query("SELECT * FROM categories ORDER BY name");
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const { name, monthly_budget } = req.body;
    if (!name) return res.status(400).json({ error: "name is required" });
    const result = await db.query(
      "INSERT INTO categories (name, monthly_budget) VALUES ($1, $2) RETURNING id",
      [name, monthly_budget || 0]
    );
    res.status(201).json({ id: result.rows[0].id, name, monthly_budget: monthly_budget || 0 });
  } catch (err) {
    if (err.code === "23505") return res.status(409).json({ error: "Category already exists" });
    next(err);
  }
});

router.put("/:id", async (req, res, next) => {
  try {
    const { name, monthly_budget } = req.body;
    const existing = await db.query("SELECT * FROM categories WHERE id = $1", [req.params.id]);
    if (!existing.rows.length) return res.status(404).json({ error: "Category not found" });
    const current = existing.rows[0];

    const finalName = name ?? current.name;
    const finalBudget = monthly_budget ?? current.monthly_budget;
    await db.query("UPDATE categories SET name = $1, monthly_budget = $2 WHERE id = $3", [
      finalName,
      finalBudget,
      req.params.id,
    ]);
    res.json({ id: Number(req.params.id), name: finalName, monthly_budget: finalBudget });
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    await db.query("DELETE FROM categories WHERE id = $1", [req.params.id]);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
