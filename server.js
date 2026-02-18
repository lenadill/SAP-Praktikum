require('dotenv').config();
const express = require('express');
const path    = require('path');
const fs      = require('fs');
const app = express();

const APP_DIR = path.join(__dirname, 'App');
const DB_FILE = path.join(__dirname, 'database.json');

app.use('/static',    express.static(path.join(APP_DIR, 'static')));
app.use('/assets',    express.static(path.join(APP_DIR, 'assets')));
app.use('/templates', express.static(path.join(APP_DIR, 'templates')));
app.get('/', (req, res) => res.redirect('/templates/index.html'));

let fetchFn = globalThis.fetch;
try { if (!fetchFn) fetchFn = require('node-fetch'); } catch (e) {}

const GROQ_KEY   = process.env.GROQ_API_KEY;
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

// --- Finanzdaten-Aggregation ---
function getDatabaseSummary() {
    try {
        if (!fs.existsSync(DB_FILE)) return "Keine Finanzdaten verfügbar.";
        const db = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
        const entries = db.eintraege || [];
        if (entries.length === 0) return "Keine Transaktionen gefunden.";

        let totalBalance = 0;
        const categories = {};
        const recent = entries.slice(-10).reverse();

        entries.forEach(e => {
            const wert = parseFloat(e.wert || 0);
            totalBalance += wert;
            const cat = e.kategorie || "Unbekannt";
            categories[cat] = (categories[cat] || 0) + wert;
        });

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
        return summary;
    } catch (err) {
        console.error("DB Summary Error:", err);
        return "Fehler beim Lesen der Finanzdaten.";
    }
}

app.use(express.json());

app.get('/health', (req, res) => res.json({ ok: true }));

app.post('/api/chat', async (req, res) => {
  try {
    if (!GROQ_KEY) return res.status(500).json({ error: 'Server missing GROQ_API_KEY' });

    const summary = getDatabaseSummary();
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
