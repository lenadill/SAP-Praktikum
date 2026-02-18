const fs = require('fs').promises;

let db = null;
let db_path = "Datenbank-Test/db-sample.json";

async function fetchDB() {
    if (db) return db;
    try {
        const text = await fs.readFile(db_path, 'utf8');
        db = JSON.parse(text);
        return db;
    } catch (err) {
        console.error(err);
        throw err;
    }
}

async function saveDB() {
    if (!db) throw new Error("Keine Daten geladen");
    try {
        await fs.writeFile(db_path, JSON.stringify(db, null, 2), 'utf8');
    } catch (err) {
        console.error(err);
        throw err;
    }
}

function clearCache() {
    db = null;
}

// Eintrag zu einem Array-Feld hinzufügen (z.B. "incomes" oder "expenses")
async function addEntry(field, entry) {
    const data = await fetchDB();
    if (!Array.isArray(data[field])) {
        data[field] = [];
    }
    data[field].push(entry);
    await saveDB();
}

// Alle Einträge eines Feldes lesen
async function getEntries(field) {
    const data = await fetchDB();
    return data[field] ?? [];
}

module.exports = { fetchDB, saveDB, clearCache, addEntry, getEntries };
