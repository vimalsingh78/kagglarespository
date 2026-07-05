// Local development entry point. On Vercel, api/[...path].js imports app.js
// directly instead of this file (Vercel manages the HTTP listener itself).
const app = require("./app");

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Cost Tracker API running on http://localhost:${PORT}`);
});
