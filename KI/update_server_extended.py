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
        db.all("SELECT id, name, sender, empfaenger, kategorie, wert, timestamp FROM transactions ORDER BY timestamp DESC", [], (err, rows) => {
            if (err) return resolve("Fehler beim Lesen der Finanzdaten.");
            if (!rows || rows.length === 0) return resolve("Keine Transaktionen gefunden.");

            // 1. Einfache Summen
            let totalIncome = 0;
            let totalExpenses = 0;
            const categorySums = {};

            rows.forEach(e => {
                if (e.wert >= 0) totalIncome += e.wert;
                else totalExpenses += Math.abs(e.wert);
                
                categorySums[e.kategorie] = (categorySums[e.kategorie] || 0) + e.wert;
            });
            
            const totalBalance = totalIncome - totalExpenses;

            // 2. Zeitliche Analyse (Q4, letzter Monat, Jahr) vorbereiten
            // Wir geben Joule einfach die Rohdaten der letzten ~50 Transaktionen
            // sowie aggregierte Monats-Daten, damit er rechnen kann.
            
            const recent = rows.slice(0, 15); // Mehr Details für die neuesten

            let summary = "### Finanz-Übersicht ###\n";
            summary += `- Aktueller Kontostand: ${totalBalance.toFixed(2)}€\n`;
            summary += `- Gesamteinnahmen (Historie): ${totalIncome.toFixed(2)}€\n`;
            summary += `- Gesamtausgaben (Historie): ${totalExpenses.toFixed(2)}€\n\n`;
            
            summary += "### Umsätze nach Kategorie ###\n";
            for (const [cat, sum] of Object.entries(categorySums)) {
                summary += `- ${cat}: ${sum.toFixed(2)}€\n`;
            }

            summary += "\n### Letzte 15 Transaktionen (Detail) ###\n";
            recent.forEach(r => {
                const date = r.timestamp.split('T')[0];
                const type = r.wert >= 0 ? "Einnahme" : "Ausgabe";
                const details = r.sender ? `(Von: ${r.sender} -> An: ${r.empfaenger})` : "";
                summary += `- [${date}] ${type} ${r.wert.toFixed(2)}€ | Kat: ${r.kategorie} | ${r.name} ${details}\n`;
            });
            
            // Für ältere Daten: Monats-Aggregate
            // Wir gruppieren die Transaktionen nach Jahr-Monat für Joule
            const monthlyStats = {};
            rows.forEach(r => {
                const yyyymm = r.timestamp.substring(0, 7); // "2025-02"
                if (!monthlyStats[yyyymm]) monthlyStats[yyyymm] = { in: 0, out: 0 };
                if (r.wert >= 0) monthlyStats[yyyymm].in += r.wert;
                else monthlyStats[yyyymm].out += Math.abs(r.wert);
            });
            
            summary += "\n### Monats-Statistiken (Historie) ###\n";
            const sortedMonths = Object.keys(monthlyStats).sort().reverse().slice(0, 12); // Letzte 12 Monate
            for (const m of sortedMonths) {
                summary += `- ${m}: Einnahmen ${monthlyStats[m].in.toFixed(2)}€, Ausgaben ${monthlyStats[m].out.toFixed(2)}€\n`;
            }

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
    const { name, kategorie, wert, sender, empfaenger } = req.body;
    const timestamp = new Date().toISOString();
    const id = Date.now();
    
    db.run(
        "INSERT INTO transactions (id, name, kategorie, wert, timestamp, sender, empfaenger) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [id, name || "Unbenannt", kategorie || "Sonstiges", parseFloat(wert || 0), timestamp, sender || "", empfaenger || ""],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id, name, kategorie, wert, timestamp, sender, empfaenger });
        }
    );
});

app.put('/api/transactions/:id', (req, res) => {
    const { name, kategorie, wert, sender, empfaenger } = req.body;
    db.run(
        "UPDATE transactions SET name = ?, kategorie = ?, wert = ?, sender = ?, empfaenger = ? WHERE id = ?",
        [name, kategorie, parseFloat(wert), sender, empfaenger, req.params.id],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true });
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
    
    // System Prompt für Joule mit erweitertem Kontext
    const systemContent = "Du bist Joule, ein intelligenter SAP-Finanz-Assistent. " +
                         "Du hast Zugriff auf die vollständigen Finanzdaten des Nutzers.\n\n" +
                         summary + 
                         "\n\nDeine Aufgaben:" +
                         "\n1. Analysiere die Daten präzise (Summen, Trends, Vergleiche)." +
                         "\n2. Beantworte Fragen wie 'Wie lief Q4 2024?' indem du die Monats-Statistiken kombinierst." +
                         "\n3. Wenn nach Details gefragt wird (z.B. 'Wer hat mir Geld überwiesen?'), nutze die Transaktions-Liste." +
                         "\n4. Formatiere deine Antworten übersichtlich (Markdown, Listen, fettgedruckte Zahlen)." +
                         "\nBeantworte Fragen basierend auf diesen Daten. Sei hilfreich, präzise und freundlich.";
    
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
