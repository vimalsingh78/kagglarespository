# Business Cost Tracker Dashboard

*A lightweight, self-hosted alternative to bloated expense software — built for teams who just want to see where their money is going.*

## Inspiration

Every small business or team eventually hits the same wall: expenses are scattered across spreadsheets, receipts, and someone's memory, and by the time a manager notices a budget is blown, the money's already spent. Enterprise tools like QuickBooks or SAP solve this, but they're expensive, slow to set up, and overkill for a team that just wants a clear picture of category spend versus budget. We wanted something a small team could stand up in minutes and actually understand at a glance.

## What it does

Business Cost Tracker Dashboard lets a team log expenses, organize them into budgeted categories, and see the full financial picture on one screen. Users log in, add an expense (vendor, amount, category, date, notes), and immediately see it reflected across the dashboard: total spend, a monthly trend line broken out by category, a spend-by-category breakdown, a budget-vs-actual comparison for the current month, and a leaderboard of top vendors by spend. The expense table supports filtering by category, vendor, and date range, with pagination for larger datasets.

## How we built it

The app is a three-tier web application: a single-page dashboard frontend, a REST API backend, and a relational database.

- **Frontend:** A single HTML file using vanilla JavaScript and Chart.js — no build step, no framework overhead. It covers login, the dashboard views (doughnut, line, and bar charts), and the expense management UI.
- **Backend:** Node.js and Express, with JWT-based authentication and bcrypt password hashing. Routes are split cleanly into auth, expenses, categories, and analytics, with the analytics endpoints doing the aggregation work (spend by category, monthly trend, budget vs. actual) so the frontend stays simple.
- **Database:** SQLite, accessed through Node's built-in `node:sqlite` module rather than a third-party driver. This was a deliberate choice — it means the project runs with zero native compilation, no build toolchain requirements, and no platform-specific binaries, which matters a lot when you're trying to get a project running quickly on judges' or teammates' machines.
- **Data:** Since real company financial data isn't something you can hand out for a demo, we built a synthetic data generator in Python that produces a year of realistic expense records across eight categories (payroll, rent & utilities, software, marketing, travel, office supplies, professional services, equipment) and roughly two dozen vendors — with seasonal variation baked in, so marketing spend rises in Q4, utilities peak in summer and winter, and the charts tell an actual story rather than looking like random noise.

## Challenges we ran into

The biggest technical challenge was database portability. Our first instinct was a popular native SQLite driver, but native compilation is fragile across different machines and CI environments — exactly the kind of thing that breaks a live demo. Switching to Node's built-in SQLite support solved that cleanly, at the cost of adapting our transaction-handling code, since the built-in module's API differs subtly from the third-party driver we started with (no built-in `.transaction()` helper, stricter handling of `undefined` values in bound parameters). We also hit a subtle CSV-parsing bug where Windows-style line endings in our generated dataset silently corrupted the last column of every row — a good reminder to always validate parsed data end-to-end rather than trusting a green checkmark on the parser.

## Accomplishments we're proud of

A fully working, self-contained full-stack app with real authentication, a properly normalized data model, and dashboards that update live as data changes — all with zero external services, paid APIs, or complex deployment requirements. The synthetic data generator was also more fun than expected: getting the seasonality right so the charts actually look like a real business was its own small design problem.

## What we learned

That "boring" infrastructure decisions — like which SQLite binding to use — can make or break a demo-day experience, and that synthetic data is a discipline of its own: realistic-looking fake data requires actually modeling the domain (seasonality, category-specific spend patterns), not just generating random numbers.

## What's next

CSV/PDF export of filtered reports, budget-threshold alerts, simple forecasting (moving average or linear trend) for next month's projected spend per category, multi-user/department support with role-based views, and a one-click deploy so the dashboard can go live in under a minute.

## Try it

```bash
cd backend
npm install
npm run seed
npm start
```

Then visit `localhost:4000` — demo login: `admin@costtracker.local` / `password123`.
