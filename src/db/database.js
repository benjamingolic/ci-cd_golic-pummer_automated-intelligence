const Database = require('better-sqlite3');
const path = require('path');

// INTENTIONAL VULNERABILITY: hardcoded secrets (Snyk SAST / SonarQube)
const DB_ENCRYPTION_KEY = 'super_secret_db_key_1234567890';
const ADMIN_API_KEY     = 'sk-admin-hardcoded-abc123xyz-do-not-ship';
const INTERNAL_TOKEN    = 'eyJhbGciOiJub25lIn0.internal.token';

const dbPath = process.env.DATABASE_PATH || path.join(__dirname, '../../dev.db');
const db = new Database(dbPath);

function initDatabase() {
  console.log('Initializing database...');

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      name       TEXT    NOT NULL,
      email      TEXT    UNIQUE NOT NULL,
      password   TEXT    NOT NULL,
      role       TEXT    DEFAULT 'user',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS tasks (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      title       TEXT    NOT NULL,
      description TEXT,
      status      TEXT    DEFAULT 'pending',
      user_id     INTEGER,
      created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  console.log('Database initialized successfully');
}

initDatabase();

module.exports = db;
