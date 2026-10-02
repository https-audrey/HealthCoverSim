# HealthCoverSim

A learning simulator for private health insurance quotes. Built for Assignment 1
(CSE3CWA / CSE5006, Semester 2 2026). **This is a learning tool only — it is not
financial advice and does not reflect any real insurer's pricing.**

Stack: **React** (Vite) frontend, **Node.js + Express** backend, **SQLite** database
(via `better-sqlite3`).

## 1. How to install and run the project

You need Node.js (v18+) installed.

### Backend

```bash
cd backend
npm install
npm run initdb     # creates healthcoversim.db from init.sql (optional - server does this automatically too)
npm start           # runs on http://localhost:4000
```

### Frontend

In a second terminal:

```bash
cd frontend
npm install
npm run dev          # runs on http://localhost:5173
```

Open `http://localhost:5173` in a browser. The Vite dev server proxies `/api/*`
requests to the Express backend on port 4000 (see `frontend/vite.config.js`), so
no CORS setup is needed during development.

## 2. How the database is created / initialised

`backend/init.sql` defines a single `quotes` table with `CREATE TABLE IF NOT
EXISTS`, so it is safe to run repeatedly without wiping data. `backend/db.js`
opens (creating if needed) `backend/healthcoversim.db` and runs `init.sql`
against it every time the server starts, so a marker can clone the repo, run
`npm install && npm start`, and the database will exist automatically — no
manual `sqlite3` step required. `applicant2_age` and `applicant2_cover_history`
are nullable columns, since they only apply to Couple/Family cover.

## 3. How the quote calculation works

All pricing logic lives in **one place**: `backend/calculations.js`. Raw quote
inputs are stored in the database; the premium is recalculated on the fly
every time a quote is created or viewed (per the assignment's recommended
approach), so there is never a stored number that can go stale or disagree
with the logic.

Steps (see `calculateQuote()`):

1. **Hospital cover** and **extras cover** are priced separately, per adult,
   from fixed tier tables (`HOSPITAL_PRICES`, `EXTRAS_PRICES`).
2. For each applicant, a **Lifetime Health Cover (LHC) loading** is calculated:
   - `0%` if their cover history is `"Yes"` or `"Not sure"`, or if hospital
     cover is `"None"`.
   - `(age − 30) × 2%` if history is `"No"` **and** age > 30, otherwise `0%`.
   - The loading is applied **only** to that applicant's hospital cost —
     never to extras. The required statement *"Lifetime Health Cover loading
     applies only to hospital cover. It does not apply to extras cover."* is
     always shown on the explanation sheet.
   - If history is `"Not sure"`, a warning is added telling the user the
     quote may be inaccurate.
3. **Hospital total** = sum of each adult's (tier price × (1 + their
   loading)). **Extras total** = tier price × number of adults (no loading).
4. **Family upgrade fee**: a flat `+$30/month`, added automatically whenever
   `cover_type === "Family"` (children are not priced individually).
5. **Monthly premium** = hospital total + extras total + family fee.
6. **Yearly premium (before discount)** = monthly premium × 12.
7. If `payment_frequency === "Yearly"`, the **annual-payment discount**
   (0–10%, user-entered) is applied to the yearly total to get the final
   yearly premium. Monthly payers never receive this discount.

This logic is verified against the assignment's Section 7 worked example
(Family, ages 40/35, Silver hospital, Standard extras, Yearly @ 5%):
monthly **$472.00**, yearly before discount **$5,664.00**, yearly after
discount **$5,380.80** — confirmed by a manual test run during development.

## 4. How Family cover is calculated

Family cover always counts **2 adults** for pricing purposes (children are
not entered or priced individually — the assignment brief is explicit that
family cover does not require children's ages). Each of the two adults gets
their own hospital cost (tier price × their own LHC loading) and their own
share of the extras cost (tier price × 1, summed to tier price × 2). On top
of that, a flat **$30/month family upgrade fee** is added once, automatically
— the user never enters it.

## 5. Validation

Both the frontend (`frontend/src/components/QuoteFormFields.jsx`) and the
backend (`backend/calculations.js` → `validateQuoteInput`) independently
check:

- Customer name and cover type are present.
- Applicant 1 age is a number 18–100, and cover history is selected.
- For Couple/Family, Applicant 2 age (18–100) and cover history are
  **required** — the UI only shows these fields when Couple/Family is
  selected (React conditional rendering), and the backend rejects a request
  missing them even if sent directly to the API.
- Hospital/extras cover levels are one of the allowed values.
- Annual discount is only required/validated (0–10%) when paying Yearly.

The backend never trusts client input: every `POST`/`PUT` re-runs full
validation and returns `400` with a list of specific error messages on
failure, rather than crashing or silently calculating a misleading quote.

## 6. AI use statement

- **Tool used:** Claude (Anthropic).
- **What it helped with:** scaffolding the Express routes, the React CRUD
  pages, and the SQLite schema; and cross-checking the pricing/LHC logic
  against the Section 7 worked example.
- **What I personally checked/implemented:** I read through
  `calculations.js` line by line and re-derived the worked example by hand
  to confirm the LHC loading formula, the order of operations (hospital and
  extras kept separate, loading only on hospital, discount only on the
  yearly total), and the family fee logic all matched the brief before
  relying on it.
- **One decision I made myself:** [Fill this in with something you actually
  decided — e.g. how the warning for "Not sure" cover history is worded and
  where it's displayed, or the specific fields shown/hidden in the edit
  form.]

## 7. Limitation

The simplified LHC loading formula (`(age − 30) × 2%`) has no upper cap and
never resets after years of continuous cover, unlike the real Australian LHC
scheme — so a much older first-time applicant will see a loading far higher
than what a real insurer would ever apply. This is a deliberate
simplification for the purposes of the simulator, as noted in the brief.

## Project structure

```
healthcoversim/
├── backend/
│   ├── init.sql          # schema
│   ├── db.js              # opens/creates the SQLite DB
│   ├── calculations.js    # ALL pricing + validation logic
│   ├── server.js          # Express app entry point
│   └── routes/quotes.js   # CRUD endpoints
└── frontend/
    └── src/
        ├── api.js
        ├── App.jsx
        ├── components/
        │   ├── QuoteFormFields.jsx
        │   └── ExplanationSheet.jsx
        └── pages/
            ├── QuoteList.jsx
            ├── QuoteNew.jsx
            ├── QuoteDetail.jsx
            └── QuoteEdit.jsx
```
