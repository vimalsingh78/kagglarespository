const express = require("express");
const db = require("../db");

const router = express.Router();
// Open to the public — no login required (judge-facing demo deployment).

// GET /api/expenses?category=&vendor=&from=&to=&page=&pageSize=
router.get("/", async (req, res, next) => {
  try {
    const { category, vendor, from, to, page = 1, pageSize = 50 } = req.query;
    const clauses = [];
    const params = [];

    if (category) {
      params.push(category);
      clauses.push(`c.name = $${params.length}`);
    }
    if (vendor) {
      params.push(`%${vendor}%`);
      clauses.push(`e.vendor ILIKE $${params.length}`);
    }
    if (from) {
      params.push(from);
      clauses.push(`e.date >= $${params.length}`);
    }
    if (to) {
      params.push(to);
      clauses.push(`e.date <= $${params.length}`);
    }

    const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
    const limit = Number(pageSize);
    const offset = (Number(page) - 1) * limit;

    const dataParams = [...params, limit, offset];
    const rowsResult = await db.query(
      `SELECT e.id, to_char(e.date, 'YYYY-MM-DD') AS date, c.name AS category, e.vendor,
              e.amount::float AS amount, e.description
       FROM expenses e JOIN categories c ON c.id = e.category_id
       ${where}
       ORDER BY e.date DESC
       LIMIT $${dataParams.length - 1} OFFSET $${dataParams.length}`,
      dataParams
    );

    const totalResult = await db.query(
      `SELECT COUNT(*)::int AS count FROM expenses e JOIN categories c ON c.id = e.category_id ${where}`,
      params
    );

    res.json({
      data: rowsResult.rows,
      total: totalResult.rows[0].count,
      page: Number(page),
      pageSize: limit,
    });
  } catch (err) {
    next(err);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const { category, vendor, amount, date, description } = req.body;
    if (!category || !vendor || !amount || !date) {
      return res.status(400).json({ error: "category, vendor, amount, date are required" });
    }
    const catResult = await db.query("SELECT id FROM categories WHERE name = $1", [category]);
    if (!catResult.rows.length) return res.status(400).json({ error: "Unknown category" });

    const result = await db.query(
      "INSERT INTO expenses (category_id, vendor, amount, date, description, created_by) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id",
      [catResult.rows[0].id, vendor, amount, date, description || null, null]
    );

    res.status(201).json({ id: result.rows[0].id, category, vendor, amount, date, description });
  } catch (err) {
    next(err);
  }
});

router.put("/:id", async (req, res, next) => {
  try {
    const existing = await db.query("SELECT * FROM expenses WHERE id = $1", [req.params.id]);
    if (!existing.rows.length) return res.status(404).json({ error: "Expense not found" });
    const current = existing.rows[0];

    const { category, vendor, amount, date, description } = req.body;
    let categoryId = current.category_id;
    if (category) {
      const catResult = await db.query("SELECT id FROM categories WHERE name = $1", [category]);
      if (!catResult.rows.length) return res.status(400).json({ error: "Unknown category" });
      categoryId = catResult.rows[0].id;
    }

    await db.query(
      "UPDATE expenses SET category_id = $1, vendor = $2, amount = $3, date = $4, description = $5 WHERE id = $6",
      [
        categoryId,
        vendor ?? current.vendor,
        amount ?? current.amount,
        date ?? current.date,
        description ?? current.description,
        req.params.id,
      ]
    );

    res.json({ id: Number(req.params.id), updated: true });
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    await db.query("DELETE FROM expenses WHERE id = $1", [req.params.id]);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
