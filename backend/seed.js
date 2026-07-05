// Loads categories.csv and expenses.csv (synthetic data) into the Postgres database.
// Run against a real database with POSTGRES_URL / DATABASE_URL set, or against the
// local embedded engine with USE_PGLITE=1.
const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");
const db = require("./db");

function parseCsv(filePath) {
  const text = fs.readFileSync(filePath, "utf8").trim();
  const lines = text.split(/\r\n|\r|\n/).filter((l) => l.length > 0);
  const [headerLine, ...rows] = lines;
  const headers = headerLine.split(",").map((h) => h.trim());
  return rows.map((line) => {
    const values = line.split(",");
    const row = {};
    headers.forEach((h, i) => (row[h] = values[i] !== undefined ? values[i].trim() : ""));
    return row;
  });
}

async function seed() {
  await db.initSchema();

  const categoriesPath = path.join(__dirname, "data", "categories.csv");
  const expensesPath = path.join(__dirname, "data", "expenses.csv");
  const categories = parseCsv(categoriesPath);
  const expenses = parseCsv(expensesPath);

  await db.query("DELETE FROM expenses");
  await db.query("DELETE FROM categories");
  await db.query("DELETE FROM users");

  const categoryIds = {};
  for (const c of categories) {
    const res = await db.query(
      "INSERT INTO categories (name, monthly_budget) VALUES ($1, $2) ON CONFLICT (name) DO UPDATE SET monthly_budget = EXCLUDED.monthly_budget RETURNING id",
      [c.category, parseFloat(c.monthly_budget)]
    );
    categoryIds[c.category] = res.rows[0].id;
  }

  let insertedCount = 0;
  for (const e of expenses) {
    const catId = categoryIds[e.category];
    if (!catId) continue;
    await db.query(
      "INSERT INTO expenses (category_id, vendor, amount, date, description) VALUES ($1, $2, $3, $4, $5)",
      [catId, e.vendor || "", parseFloat(e.amount), e.date, e.description || ""]
    );
    insertedCount++;
  }

  const hash = bcrypt.hashSync("password123", 10);
  await db.query(
    "INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4) ON CONFLICT (email) DO NOTHING",
    ["Demo Admin", "admin@costtracker.local", hash, "admin"]
  );

  console.log(`Seeded ${categories.length} categories and ${insertedCount} expenses.`);
  console.log("Demo login -> email: admin@costtracker.local  password: password123");
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
