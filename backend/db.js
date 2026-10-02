// db.js
// Opens (and if necessary creates) the SQLite database, applying init.sql.
// Import { db } from this file anywhere you need to run a query.

const path = require("path");
const fs = require("fs");
const Database = require("better-sqlite3");

const DB_PATH = path.join(__dirname, "healthcoversim.db");
const SCHEMA_PATH = path.join(__dirname, "init.sql");

const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

// Apply schema every start-up; CREATE TABLE IF NOT EXISTS makes this safe
// to re-run without wiping existing data.
const schema = fs.readFileSync(SCHEMA_PATH, "utf8");
db.exec(schema);

// Allow `npm run initdb` to just set up the file and exit.
if (require.main === module) {
  console.log(`Database ready at ${DB_PATH}`);
  process.exit(0);
}

module.exports = db;
