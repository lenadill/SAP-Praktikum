const fs = require('fs').promises;
const readline = require('readline');

const DB_PATH = 'Datenbank-Test/test-db.json';

// ─── DB Funktionen ────────────────────────────────────────────────────────────

async function loadDB() {
    try {
        const text = await fs.readFile(DB_PATH, 'utf8');
        return JSON.parse(text);
    } catch {
        // Datei existiert noch nicht → leere DB
        return { eintraege: [] };
    }
}

async function saveDB(db) {
    await fs.writeFile(DB_PATH, JSON.stringify(db, null, 2), 'utf8');
}

// ─── Eingabe Hilfsfunktion ────────────────────────────────────────────────────

function frage(rl, text) {
    return new Promise(resolve => rl.question(text, resolve));
}

// ─── Hauptprogramm ────────────────────────────────────────────────────────────

async function main() {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

    console.log('\n=== Datenbank Test ===\n');

    // Daten eingeben
    const name = await frage(rl, 'Name: ');
    const kategorie = await frage(rl, 'Kategorie: ');
    const wert = await frage(rl, 'Wert: ');

    rl.close();

    // Neuen Eintrag erstellen
    const neuerEintrag = {
        id: Date.now(),
        name,
        kategorie,
        wert: isNaN(wert) ? wert : Number(wert),
        timestamp: new Date().toISOString()
    };

    // Laden → Hinzufügen → Speichern
    const db = await loadDB();
    db.eintraege.push(neuerEintrag);
    await saveDB(db);

    console.log('\n✓ Gespeichert in', DB_PATH);

    // Alles wieder laden und anzeigen
    const geladen = await loadDB();
    console.log('\n--- Alle Einträge ---');
    geladen.eintraege.forEach((e, i) => {
        console.log(`\n[${i + 1}] ${e.name} (${e.kategorie})`);
        console.log(`    Wert: ${e.wert}`);
        console.log(`    Zeit: ${e.timestamp}`);
    });
    console.log('\n─────────────────────');
}

main().catch(console.error);
