# Deploying to Render (free tier)

The backend now runs on Postgres (see "Why Postgres" below), so this deployment
gives you a real, persistent database — expenses added through the live app
stick around across restarts and redeploys, unlike the earlier SQLite-based
version.

## Step 1 — Push the project to GitHub

```bash
cd business-cost-tracker
git init
git add .
git commit -m "Business Cost Tracker Dashboard"
```

Create a new empty repository on github.com, then:

```bash
git remote add origin https://github.com/<your-username>/<repo-name>.git
git branch -M main
git push -u origin main
```

## Step 2 — Deploy on Render

1. Go to **render.com** and sign up / log in (GitHub login is easiest).
2. Click **New +** → **Blueprint**, connect your GitHub account if prompted, and select the repository you just pushed.
3. Render will detect `render.yaml`, which defines both a free Postgres database (`cost-tracker-db`) and the web service, wired together automatically via the `POSTGRES_URL` environment variable. Click **Apply** / **Create**.
4. Wait for the database and web service to finish provisioning (a few minutes the first time).

## Step 3 — Seed the database (one-time)

The blueprint does **not** auto-seed on every boot anymore (so your data doesn't get wiped on redeploy). Seed it once after the first deploy:

1. In the Render dashboard, open the `cost-tracker-db` database and copy its **External Connection String**.
2. On your own machine:
   ```bash
   cd backend
   npm install
   POSTGRES_URL="<paste the external connection string>" npm run seed
   ```
3. You should see `Seeded 8 categories and 513 expenses.`

## Step 4 — Visit your app

Open the URL shown on your web service's page (something like `https://business-cost-tracker.onrender.com`). Log in with `admin@costtracker.local` / `password123`, or register a new account.

## Why Postgres instead of the original SQLite file?

The first version of this app used a local SQLite file for simplicity. That works
fine on a traditional server, but breaks down on serverless platforms (like
Vercel) that don't have a persistent filesystem, and is unreliable even on
some traditional hosts' free tiers. Postgres works identically across Render,
Railway, Vercel, or any other host — one codebase, several deploy targets.

## Local development

```bash
cd backend
npm install
npm run seed   # requires POSTGRES_URL, or use USE_PGLITE=1 npm run seed:pglite for no-setup local testing
npm start       # or: npm run dev:pglite
```

`USE_PGLITE=1` runs against an embedded, file-free Postgres-compatible engine
with zero setup — handy for trying the app out before connecting a real database.
