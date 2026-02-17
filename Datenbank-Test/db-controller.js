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

function clearCache() {
    db = null;
}

fetchDB().then(d => {
    console.log(d);
}).catch(() => {});
