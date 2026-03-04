const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const DB_PATH = path.join(__dirname, '..', 'App', 'db', 'system.db');

// Ensure directory exists
const dir = path.dirname(DB_PATH);
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

const db = new sqlite3.Database(DB_PATH);

db.serialize(() => {
    // 1. Companies Table
    db.run(`CREATE TABLE IF NOT EXISTS companies (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        domain TEXT UNIQUE NOT NULL
    )`);

    // 2. Users Table
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        full_name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT DEFAULT 'user',
        company_id INTEGER,
        FOREIGN KEY (company_id) REFERENCES companies(id)
    )`);

    // 3. Invites Table
    db.run(`CREATE TABLE IF NOT EXISTS invites (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT UNIQUE NOT NULL,
        company_id INTEGER NOT NULL,
        used BOOLEAN DEFAULT 0,
        expires_at TEXT,
        FOREIGN KEY (company_id) REFERENCES companies(id)
    )`);

    console.log("System database reset and initialized successfully.");
});

db.close();
