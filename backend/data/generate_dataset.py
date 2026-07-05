"""
Generates synthetic business expense data for the Cost Tracker Dashboard capstone.
Produces: categories.csv, expenses.csv (12 months of realistic, seasonally-varied spend).
"""
import csv
import random
from datetime import date, timedelta

random.seed(42)

CATEGORIES = [
    ("Payroll", 45000),
    ("Rent & Utilities", 12000),
    ("Software & Subscriptions", 5000),
    ("Marketing", 8000),
    ("Travel", 4000),
    ("Office Supplies", 1500),
    ("Professional Services", 6000),
    ("Equipment", 5000),
]

VENDORS = {
    "Payroll": ["Gusto Payroll", "ADP"],
    "Rent & Utilities": ["Skyline Properties", "Metro Electric", "CityWater Co", "Comcast Business"],
    "Software & Subscriptions": ["AWS", "Slack", "Salesforce", "Adobe", "Zoom", "GitHub"],
    "Marketing": ["Meta Ads", "Google Ads", "Mailchimp", "LinkedIn Ads", "Canva"],
    "Travel": ["Delta Airlines", "Marriott", "Uber for Business", "United Airlines"],
    "Office Supplies": ["Staples", "Amazon Business", "Office Depot"],
    "Professional Services": ["Deloitte Consulting", "Local Law Partners", "TaxPro CPA"],
    "Equipment": ["Dell", "Apple Business", "Herman Miller"],
}

# seasonal multipliers by month (1=Jan ... 12=Dec) per category
SEASONALITY = {
    "Payroll": [1.0]*11 + [1.15],  # year-end bonus bump
    "Rent & Utilities": [1.15, 1.1, 1.0, 0.95, 0.9, 1.05, 1.15, 1.15, 0.95, 0.9, 1.0, 1.1],
    "Software & Subscriptions": [1.0]*12,
    "Marketing": [0.8, 0.8, 0.9, 1.0, 1.0, 0.9, 0.8, 0.9, 1.1, 1.2, 1.4, 1.5],  # Q4 push
    "Travel": [0.7, 0.8, 1.0, 1.1, 1.0, 1.1, 0.6, 0.6, 1.1, 1.2, 1.3, 0.8],
    "Office Supplies": [1.2, 0.9, 0.9, 1.0, 1.0, 0.9, 0.9, 1.1, 1.2, 1.0, 1.0, 1.1],
    "Professional Services": [1.3, 1.0, 1.4, 1.0, 0.9, 0.9, 0.9, 0.9, 1.0, 1.0, 1.0, 1.2],
    "Equipment": [1.1, 0.8, 0.8, 0.9, 0.8, 0.8, 0.8, 1.0, 1.0, 0.9, 0.9, 1.3],
}

START = date(2025, 7, 1)
MONTHS = 12

def month_range(start, n):
    y, m = start.year, start.month
    out = []
    for i in range(n):
        out.append((y, m))
        m += 1
        if m > 12:
            m = 1
            y += 1
    return out

def random_date_in_month(y, m):
    if m == 12:
        next_m = date(y + 1, 1, 1)
    else:
        next_m = date(y, m + 1, 1)
    days_in_month = (next_m - date(y, m, 1)).days
    return date(y, m, random.randint(1, days_in_month))

rows = []
expense_id = 1
categories_out = []

for cat_name, monthly_budget in CATEGORIES:
    categories_out.append({"category": cat_name, "monthly_budget": monthly_budget})

for (y, m) in month_range(START, MONTHS):
    month_idx = (m - 1)
    for cat_name, monthly_budget in CATEGORIES:
        mult = SEASONALITY[cat_name][month_idx]
        target_spend = monthly_budget * mult * random.uniform(0.85, 1.15)
        # split target spend into 3-8 line-item transactions
        n_txns = random.randint(3, 8)
        weights = [random.random() for _ in range(n_txns)]
        wsum = sum(weights)
        for w in weights:
            amount = round(target_spend * (w / wsum), 2)
            vendor = random.choice(VENDORS[cat_name])
            rows.append({
                "id": expense_id,
                "date": random_date_in_month(y, m).isoformat(),
                "category": cat_name,
                "vendor": vendor,
                "amount": amount,
                "description": f"{cat_name} expense - {vendor}",
            })
            expense_id += 1

rows.sort(key=lambda r: r["date"])

with open("expenses.csv", "w", newline="") as f:
    writer = csv.DictWriter(f, fieldnames=["id", "date", "category", "vendor", "amount", "description"])
    writer.writeheader()
    writer.writerows(rows)

with open("categories.csv", "w", newline="") as f:
    writer = csv.DictWriter(f, fieldnames=["category", "monthly_budget"])
    writer.writeheader()
    writer.writerows(categories_out)

print(f"Generated {len(rows)} expense rows across {len(CATEGORIES)} categories over {MONTHS} months.")
