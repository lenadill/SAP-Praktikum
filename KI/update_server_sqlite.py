import os

path = "../server.js"
server_content = r"""require('dotenv').config();
const express = require('express');
const path    = require('path');
const sqlite3 = require('sqlite3').verbose();
const app = express();

const APP_DIR = path.join(__dirname, 'App');
const DB_PATH = path.join(APP_DIR, 'db', 'transactions.db');

// DB Verbindung
const db = new sqlite3.Database(DB_PATH);

app.use('/static',    express.static(path.join(APP_DIR, 'static')));
app.use('/assets',    express.static(path.join(APP_DIR, 'assets')));
app.use('/templates', express.static(path.join(APP_DIR, 'templates')));
app.get('/', (req, res) => res.redirect('/templates/index.html'));

let fetchFn = globalThis.fetch;
try { if (!fetchFn) fetchFn = require('node-fetch'); } catch (e) {}

const GROQ_KEY   = process.env.GROQ_API_KEY;
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

// --- Finanzdaten-Aggregation für Joule ---
async function getDatabaseSummary() {
    return new Promise((resolve, reject) => {
        db.all("SELECT kategorie, wert, timestamp, name FROM transactions", [], (err, rows) => {
            if (err) return resolve("Fehler beim Lesen der Finanzdaten.");
            if (!rows || rows.length === 0) return resolve("Keine Transaktionen gefunden.");

            let totalBalance = 0;
            const categories = {};
            
            rows.forEach(e => {
                totalBalance += e.wert;
                categories[e.kategorie] = (categories[e.kategorie] || 0) + e.wert;
            });

            // Letzte 10 Transaktionen
            const recent = [...rows].sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 10);

            let summary = "Aktuelle Finanzübersicht:\n";
            summary += "- Gesamtsaldo: " + totalBalance.toFixed(2) + "€\n";
            summary += "- Kategorien (Summen):\n";
            for (const cat in categories) {
                summary += "  * " + cat + ": " + categories[cat].toFixed(2) + "€\n";
            }
            summary += "- Letzte 10 Transaktionen:\n";
            recent.forEach(r => {
                summary += "  * " + r.timestamp.split('T')[0] + ": " + r.name + " (" + r.wert + "€)\n";
            });
            resolve(summary);
        });
    });
}

app.use(express.json());

// --- API für Transaktionen ---
app.get('/api/transactions', (req, res) => {
    db.all("SELECT * FROM transactions ORDER BY timestamp DESC", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ eintraege: rows });
    });
});

app.post('/api/transactions', (req, res) => {
    const { name, kategorie, wert } = req.body;
    const timestamp = new Date().toISOString();
    const id = Date.now();
    
    db.run("INSERT INTO transactions (id, name, kategorie, wert, timestamp) VALUES (?, ?, ?, ?, ?)",
        [id, name || "Unbenannt", kategorie || "Sonstiges", parseFloat(wert || 0), timestamp],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id, name, kategorie, wert, timestamp });
        }
    );
});

app.delete('/api/transactions/:id', (req, res) => {
    db.run("DELETE FROM transactions WHERE id = ?", req.params.id, function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

app.get('/health', (req, res) => res.json({ ok: true }));

app.post('/api/chat', async (req, res) => {
  try {
    if (!GROQ_KEY) return res.status(500).json({ error: 'Server missing GROQ_API_KEY' });

    const summary = await getDatabaseSummary();
    const clientMessages = req.body.messages || [];
    const systemContent = "Du bist Joule, ein SAP-Finanz-Assistent und Support-Spezialist. " +
                         "Hier sind die aktuellen Finanzdaten des Nutzers:\n" + summary +
                         "\nZusätzlich zum Finanz-Kontext bist du Experte für den Support: " +
                         "\n- Bei Fragen zur Datensicherheit: Betone SAP-Verschlüsselungsstandards." +
                         "\n- Bei Fragen zu Reports: Erkläre, dass diese im Dashboard exportiert werden können." +
                         "\n- Bei technischen Problemen: Verweise auf das Kontaktformular auf der Support-Seite." +
                         "\nBeantworte Fragen basierend auf diesen Daten. Sei präzise und freundlich.";
    
    const messages = [{ role: "system", content: systemContent }, ...clientMessages.filter(m => m.role !== 'system')];

    const resp = await fetchFn('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + GROQ_KEY,
            'User-Agent':    'node-groq-proxy/1.0'
        },
        body: JSON.stringify({ model: GROQ_MODEL, messages })
    });

    const data = await resp.json();
    res.status(resp.status).json(data);
  } catch (err) {
    console.error('Proxy error', err);
    res.status(500).json({ error: 'Proxy error' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Proxy server listening on ' + PORT));
"""

with open(path, "w", encoding="utf-8") as f:
    f.write(server_content)
