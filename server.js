require('dotenv').config();
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
app.get('/', (req, res) => res.redirect('/templates/login.html'));

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

            let totalIncome = 0;
            let totalExpenses = 0;
            const categorySums = {};
            const monthlyStats = {};

            rows.forEach(e => {
                const val = parseFloat(e.wert) || 0;
                if (val >= 0) totalIncome += val;
                else totalExpenses += Math.abs(val);
                
                categorySums[e.kategorie] = (categorySums[e.kategorie] || 0) + val;
                
                const month = e.timestamp.substring(0, 7); // YYYY-MM
                if (!monthlyStats[month]) monthlyStats[month] = { in: 0, out: 0 };
                if (val >= 0) monthlyStats[month].in += val;
                else monthlyStats[month].out += Math.abs(val);
            });
            
            const totalBalance = totalIncome - totalExpenses;
            const recent = rows.slice(0, 20);

            let summary = "### FINANZ-DASHBOARD ZUSAMMENFASSUNG ###\n";
            summary += `- Kontostand: ${totalBalance.toFixed(2)}€\n`;
            summary += `- Einnahmen: +${totalIncome.toFixed(2)}€\n`;
            summary += `- Ausgaben: -${totalExpenses.toFixed(2)}€\n\n`;
            
            summary += "### TOP KATEGORIEN ###\n";
            const sortedCats = Object.entries(categorySums).sort((a, b) => a[1] - b[1]); // Absteigend (Ausgaben sind negativ)
            sortedCats.slice(0, 5).forEach(([cat, sum]) => {
                summary += `- ${cat}: ${sum.toFixed(2)}€\n`;
            });

            summary += "\n### MONATS-TREND (LETZTE 3 MONATE) ###\n";
            const sortedMonths = Object.keys(monthlyStats).sort().reverse().slice(0, 3);
            sortedMonths.forEach(m => {
                summary += `- ${m}: +${monthlyStats[m].in.toFixed(2)}€ / -${monthlyStats[m].out.toFixed(2)}€\n`;
            });

            summary += "\n### LETZTE 20 TRANSAKTIONEN (PRÄZISE) ###\n";
            recent.forEach(r => {
                const date = r.timestamp.split('T')[0];
                const senderInfo = r.sender && r.sender !== 'SAP' ? ` von ${r.sender}` : "";
                const receiverInfo = r.empfaenger && r.empfaenger !== 'SAP' ? ` an ${r.empfaenger}` : "";
                summary += `- [${date}] ${r.name}: ${r.wert.toFixed(2)}€ (${r.kategorie})${senderInfo}${receiverInfo}\n`;
            });

            resolve(summary);
        });
    });
}

app.use(express.json());

// API endpoints...
app.get("/api/transactions", (req, res) => {
    const limit = parseInt(req.query.limit) || 25;
    const offset = parseInt(req.query.offset) || 0;
    const category = req.query.category;
    const search = req.query.search;
    const date = req.query.date;
    const sortBy = req.query.sort || "timestamp";
    const order = req.query.order || "DESC";
    const allowedColumns = ["kategorie", "sender", "empfaenger", "wert", "timestamp", "name"];
    const finalSort = allowedColumns.includes(sortBy) ? sortBy : "timestamp";
    const finalOrder = (order.toUpperCase() === "ASC") ? "ASC" : "DESC";

    let query = "SELECT * FROM transactions";
    let whereClauses = [];
    let params = [];
    if (category && category !== "all") { whereClauses.push("kategorie = ?"); params.push(category); }
    if (date) { whereClauses.push("timestamp LIKE ?"); params.push(`${date}%`); }
    if (search) {
        whereClauses.push("(name LIKE ? OR sender LIKE ? OR empfaenger LIKE ? OR kategorie LIKE ? OR timestamp LIKE ? OR CAST(wert AS TEXT) LIKE ?)");
        const sp = `%${search}%`; params.push(sp, sp, sp, sp, sp, sp);
    }
    if (whereClauses.length > 0) query += " WHERE " + whereClauses.join(" AND ");
    query += ` ORDER BY ${finalSort} ${finalOrder} LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    db.all(query, params, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ eintraege: rows });
    });
});

app.post('/api/transactions', (req, res) => {
    const { name, kategorie, wert, sender, empfaenger } = req.body;
    const timestamp = new Date().toISOString();
    const id = Date.now();
    db.run("INSERT INTO transactions (id, name, kategorie, wert, timestamp, sender, empfaenger) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [id, name || "Unbenannt", kategorie || "Sonstiges", parseFloat(wert || 0), timestamp, sender || "", empfaenger || ""],
        function(err) { if (err) return res.status(500).json({ error: err.message }); res.json({ id, name, kategorie, wert, timestamp, sender, empfaenger }); }
    );
});

app.put('/api/transactions/:id', (req, res) => {
    const { name, kategorie, wert, sender, empfaenger } = req.body;
    db.run("UPDATE transactions SET name = ?, kategorie = ?, wert = ?, sender = ?, empfaenger = ? WHERE id = ?",
        [name, kategorie, parseFloat(wert), sender, empfaenger, req.params.id],
        function(err) { if (err) return res.status(500).json({ error: err.message }); res.json({ success: true }); }
    );
});

app.delete('/api/transactions/:id', (req, res) => {
    db.run("DELETE FROM transactions WHERE id = ?", req.params.id, function(err) { if (err) return res.status(500).json({ error: err.message }); res.json({ success: true }); });
});

app.get('/health', (req, res) => res.json({ ok: true }));

app.post('/api/chat', async (req, res) => {
  try {
    if (!GROQ_KEY) return res.status(500).json({ error: 'Server missing GROQ_API_KEY' });

    const summary = await getDatabaseSummary();
    const clientMessages = req.body.messages || [];
    
    // Bereinige Nachrichten für Groq
    const cleanMessages = clientMessages.map(m => {
        const { attachment, ...rest } = m;
        return rest;
    }).filter(m => m.role !== 'system');

    const systemContent = `Du bist Joule, ein professioneller SAP-Finanz-Assistent für "Clarity".
Du hilfst dem Nutzer, seine Finanzen zu verstehen und Transaktionen zu verwalten.

${summary}

### AKTIONEN:
Nutze Tools NUR, wenn die Information NICHT oben in der Zusammenfassung steht:
- QUERY:{"category": "...", "name": "...", "date": "YYYY-MM-DD"} -> Suche (nutze "all" für alle Kategorien)
- ADD_TRANSACTION:{"name": "...", "kategorie": "...", "wert": -10.0, "sender": "...", "empfaenger": "..."} -> Neu speichern

### STRIKTE REGELN:
1. Wenn du ein Tool nutzt, antworte NUR mit dem Befehl. Absolut KEIN Text davor oder danach.
2. Sei professionell, freundlich und extrem präzise.
3. Beantworte Finanzfragen (z.B. "Wie viel für Essen?") direkt mit den oben genannten Daten.
4. Heutiges Datum: ${new Date().toISOString().split('T')[0]}.`;

    const messages = [{ role: "system", content: systemContent }, ...cleanMessages];

    const resp = await fetchFn("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": "Bearer " + GROQ_KEY, "User-Agent": "node-groq-proxy/1.0" },
        body: JSON.stringify({ model: GROQ_MODEL, messages })
    });

    const data = await resp.json();
    if (data.error) {
        console.error("Groq API Error:", data.error);
        return res.status(500).json(data);
    }
    res.status(resp.status).json(data);
  } catch (err) {
    console.error('Proxy error', err);
    res.status(500).json({ error: 'Proxy error' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Proxy server listening on ' + PORT));
