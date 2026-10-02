-- HealthCoverSim database schema
-- Run automatically by db.js, or manually with:
--   sqlite3 healthcoversim.db < init.sql

CREATE TABLE IF NOT EXISTS quotes (
  id                        INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_name             TEXT    NOT NULL,
  cover_type                TEXT    NOT NULL CHECK (cover_type IN ('Single', 'Couple', 'Family')),

  applicant1_age            INTEGER NOT NULL,
  applicant1_cover_history  TEXT    NOT NULL CHECK (applicant1_cover_history IN ('Yes', 'No', 'Not sure')),

  applicant2_age            INTEGER,                 -- NULL for Single cover
  applicant2_cover_history  TEXT,                    -- NULL for Single cover

  hospital_cover            TEXT    NOT NULL CHECK (hospital_cover IN ('None', 'Basic', 'Bronze', 'Silver', 'Gold')),
  extras_cover              TEXT    NOT NULL CHECK (extras_cover IN ('None', 'Basic', 'Standard', 'Premium')),

  payment_frequency         TEXT    NOT NULL CHECK (payment_frequency IN ('Monthly', 'Yearly')),
  annual_discount           REAL    NOT NULL DEFAULT 0,   -- 0-10, only meaningful when Yearly

  notes                     TEXT,

  created_at                TEXT    NOT NULL DEFAULT (datetime('now'))
);
