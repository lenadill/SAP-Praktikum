import os

server_js_path = "../server.js"

with open(server_js_path, "r", encoding="utf-8") as f:
    content = f.read()

# Neue Funktionen und Logik
new_logic = """
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

        let summary = "Aktuelle Finanzübersicht:\\n";
        summary += "- Gesamtsaldo: " + totalBalance.toFixed(2) + "€\\n";
        summary += "- Kategorien (Summen):\\n";
        for (const cat in categories) {
            summary += "  * " + cat + ": " + categories[cat].toFixed(2) + "€\\n";
        }
        summary += "- Letzte 10 Transaktionen:\\n";
        recent.forEach(r => {
            summary += "  * " + r.timestamp.split('T')[0] + ": " + r.name + " (" + r.wert + "€)\\n";
        });
        return summary;
    } catch (err) {
        console.error("DB Summary Error:", err);
        return "Fehler beim Lesen der Finanzdaten.";
    }
}
"""

# 1. Sicherstellen, dass fs und DB_FILE da sind
if 'const fs = require' not in content:
    content = content.replace("const path    = require('path');", "const path    = require('path');\\nconst fs      = require('fs');")
if 'const DB_FILE' not in content:
    content = content.replace("const APP_DIR = path.join(__dirname, 'App');", "const APP_DIR = path.join(__dirname, 'App');\\nconst DB_FILE = path.join(__dirname, 'database.json');")

# 2. Funktion einfügen
if 'function getDatabaseSummary()' not in content:
    content = content.replace("app.use(express.json());", new_logic + "\\napp.use(express.json());")

# 3. Chat Endpoint aktualisieren
old_endpoint = """app.post('/api/chat', async (req, res) => {
  try {
    if (!GROQ_KEY) return res.status(500).json({ error: 'Server missing GROQ_API_KEY' });

    const resp = await fetchFn('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_KEY}`,
        'User-Agent':    'node-groq-proxy/1.0'
      },
      body: JSON.stringify({ model: GROQ_MODEL, messages: req.body.messages })
    });"""

new_endpoint = """app.post('/api/chat', async (req, res) => {
  try {
    if (!GROQ_KEY) return res.status(500).json({ error: 'Server missing GROQ_API_KEY' });

    const summary = getDatabaseSummary();
    const clientMessages = req.body.messages || [];
    const systemContent = "Du bist Joule, ein SAP-Finanz-Assistent. " +
                         "Hier sind die aktuellen Finanzdaten des Nutzers:\\n" + summary +
                         "\\nBeantworte Fragen basierend auf diesen Daten. Sei präzise und freundlich.";
    
    const messages = [{ role: "system", content: systemContent }, ...clientMessages.filter(m => m.role !== 'system')];

    const resp = await fetchFn('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_KEY}`,
        'User-Agent':    'node-groq-proxy/1.0'
      },
      body: JSON.stringify({ model: GROQ_MODEL, messages })
    });"""

if 'const summary = getDatabaseSummary();' not in content:
    content = content.replace(old_endpoint, new_endpoint)

with open(server_js_path, "w", encoding="utf-8") as f:
    f.write(content)

print("✅ server.js erfolgreich aktualisiert.")
