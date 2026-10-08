// routes/quotes.js
// CRUD endpoints for quotes. Calculation only happens here (not stored),
// per the spec's recommendation to keep pricing logic in one place.

const express = require("express");
const db = require("../db");
const { validateQuoteInput, calculateQuote } = require("../calculations");

const router = express.Router();

// Normalise a raw request body into the shape the DB / calculator expect.
function normaliseInput(body) {
  const needsApplicant2 = body.cover_type === "Couple" || body.cover_type === "Family";
  return {
    customer_name: body.customer_name ?? "",
    cover_type: body.cover_type ?? "",
    applicant1_age: body.applicant1_age,
    applicant1_cover_history: body.applicant1_cover_history,
    applicant2_age: needsApplicant2 ? body.applicant2_age : null,
    applicant2_cover_history: needsApplicant2 ? body.applicant2_cover_history : null,
    hospital_cover: body.hospital_cover ?? "",
    extras_cover: body.extras_cover ?? "",
    payment_frequency: body.payment_frequency ?? "",
    annual_discount:
      body.payment_frequency === "Yearly" ? Number(body.annual_discount || 0) : 0,
    notes: body.notes ?? null,
  };
}

// GET /api/quotes - list quotes (id + summary fields only)
// Supports optional ?customer_name= filter so each user only sees their own quotes.
router.get("/", (req, res) => {
  const { customer_name } = req.query;

  if (customer_name) {
    const rows = db
      .prepare(
        `SELECT id, customer_name, cover_type, hospital_cover, extras_cover,
                payment_frequency, created_at
         FROM quotes
         WHERE LOWER(customer_name) = LOWER(?)
         ORDER BY created_at DESC, id DESC`
      )
      .all(customer_name);
    return res.json(rows);
  }

  const rows = db
    .prepare(
      `SELECT id, customer_name, cover_type, hospital_cover, extras_cover,
              payment_frequency, created_at
       FROM quotes ORDER BY created_at DESC, id DESC`
    )
    .all();
  res.json(rows);
});

// GET /api/quotes/:id - single quote, WITH the calculated explanation sheet
router.get("/:id", (req, res) => {
  const row = db.prepare(`SELECT * FROM quotes WHERE id = ?`).get(req.params.id);
  if (!row) return res.status(404).json({ error: "Quote not found." });

  const { valid, errors } = validateQuoteInput(row);
  if (!valid) {
    // Stored data somehow invalid (shouldn't happen if API is used correctly)
    return res.status(200).json({ ...row, calculationError: errors });
  }

  const breakdown = calculateQuote(row);
  res.json({ ...row, breakdown });
});

// POST /api/quotes - create a new quote
router.post("/", (req, res) => {
  const input = normaliseInput(req.body);
  const { valid, errors } = validateQuoteInput(input);
  if (!valid) {
    return res.status(400).json({ error: "Validation failed.", details: errors });
  }

  const stmt = db.prepare(`
    INSERT INTO quotes (
      customer_name, cover_type,
      applicant1_age, applicant1_cover_history,
      applicant2_age, applicant2_cover_history,
      hospital_cover, extras_cover,
      payment_frequency, annual_discount, notes
    ) VALUES (
      @customer_name, @cover_type,
      @applicant1_age, @applicant1_cover_history,
      @applicant2_age, @applicant2_cover_history,
      @hospital_cover, @extras_cover,
      @payment_frequency, @annual_discount, @notes
    )
  `);
  const result = stmt.run(input);

  const row = db.prepare(`SELECT * FROM quotes WHERE id = ?`).get(result.lastInsertRowid);
  const breakdown = calculateQuote(row);
  res.status(201).json({ ...row, breakdown });
});

// PUT /api/quotes/:id - update an existing quote
router.put("/:id", (req, res) => {
  const existing = db.prepare(`SELECT * FROM quotes WHERE id = ?`).get(req.params.id);
  if (!existing) return res.status(404).json({ error: "Quote not found." });

  const input = normaliseInput(req.body);
  const { valid, errors } = validateQuoteInput(input);
  if (!valid) {
    return res.status(400).json({ error: "Validation failed.", details: errors });
  }

  db.prepare(`
    UPDATE quotes SET
      customer_name = @customer_name,
      cover_type = @cover_type,
      applicant1_age = @applicant1_age,
      applicant1_cover_history = @applicant1_cover_history,
      applicant2_age = @applicant2_age,
      applicant2_cover_history = @applicant2_cover_history,
      hospital_cover = @hospital_cover,
      extras_cover = @extras_cover,
      payment_frequency = @payment_frequency,
      annual_discount = @annual_discount,
      notes = @notes
    WHERE id = @id
  `).run({ ...input, id: req.params.id });

  const row = db.prepare(`SELECT * FROM quotes WHERE id = ?`).get(req.params.id);
  const breakdown = calculateQuote(row);
  res.json({ ...row, breakdown });
});

// DELETE /api/quotes/:id
router.delete("/:id", (req, res) => {
  const existing = db.prepare(`SELECT * FROM quotes WHERE id = ?`).get(req.params.id);
  if (!existing) return res.status(404).json({ error: "Quote not found." });

  db.prepare(`DELETE FROM quotes WHERE id = ?`).run(req.params.id);
  res.status(204).send();
});

module.exports = router;
