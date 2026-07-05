# Deploying to Vercel

The project is structured for Vercel: a serverless function at
`api/[...path].js` handles every `/api/*` request (it wraps the same Express
app used locally), and the `public/` folder is served automatically as static
assets by Vercel. The database is Postgres, provisioned through Vercel's own
Storage tab — no separate signup needed.

## Step 1 — Push the project to GitHub

```bash
cd business-cost-tracker
git init
git add .
git commit -m "Business Cost Tracker Dashboard"
git remote add origin https://github.com/<your-username>/<repo-name>.git
git branch -M main
git push -u origin main
```

## Step 2 — Import the project into Vercel

1. Go to **vercel.com**, sign up / log in (GitHub login is easiest).
2. Click **Add New → Project**, select your repository, and click **Import**.
3. Leave the framework preset as **Other** (this isn't a Next.js/React-build project — it's a plain Node backend + static HTML). Vercel will pick up `api/` and `public/` automatically.
4. Don't deploy yet — first add a database (next step), so the environment variable exists before the first build tries to use it.

## Step 3 — Add a Postgres database

1. In your new Vercel project, open the **Storage** tab.
2. Click **Create Database** → choose **Postgres** (powered by Neon) → follow the prompts to create it and connect it to this project.
3. Vercel automatically injects `POSTGRES_URL` (and a few related variables) into your project's environment variables — you don't need to copy/paste anything.

## Step 4 — Add the JWT secret

In **Settings → Environment Variables**, add:

- `JWT_SECRET` — any long random string (e.g., generate one with `openssl rand -hex 32`)

## Step 5 — Deploy

Go to the **Deployments** tab and trigger a deploy (or push a new commit — Vercel deploys automatically on every push to `main`). Once it's live, note the URL Vercel gives you (e.g., `https://your-project.vercel.app`).

## Step 6 — Seed the database (one-time)

Pull the same environment variables Vercel just created, then seed:

```bash
npm install -g vercel     # if you don't already have the CLI
vercel login
cd business-cost-tracker
vercel link                # links this folder to your Vercel project
vercel env pull .env.local # downloads POSTGRES_URL etc. into .env.local
cd backend
npm install
export $(grep POSTGRES_URL ../.env.local | xargs)
npm run seed
```

You should see `Seeded 8 categories and 513 expenses.`

## Step 7 — Visit your app

Open your Vercel URL. Log in with `admin@costtracker.local` / `password123`, or register a new account. Data now persists properly — Vercel Postgres is a real, always-on database, not an ephemeral filesystem.

## Notes

- Serverless functions have a request timeout (`vercel.json` sets it to 15s here, generous for this app's simple queries).
- If you ever want to reset the demo data, just re-run the seed step — it clears and reloads the sample dataset.
- Local development without any Vercel/Postgres account: `USE_PGLITE=1 npm run dev:pglite` inside `backend/` runs the whole app against an embedded, file-free Postgres-compatible engine — no signup required.
