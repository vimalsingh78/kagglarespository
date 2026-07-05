// Vercel serverless entry point. vercel.json rewrites every request under
// /api/* to this single function, which delegates to the same Express app
// used for local development.
const app = require("../backend/app");

module.exports = app;
