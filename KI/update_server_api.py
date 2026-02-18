import os

server_path = "../server.js"
with open(server_path, "r", encoding="utf-8") as f:
    content = f.read()

new_api_endpoints = """
// --- API für Transaktionen ---
app.get('/api/transactions', (req, res) => {
    try {
        if (!fs.existsSync(DB_FILE)) return res.json({ eintraege: [] });
        const db = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
        res.json(db);
    } catch (err) {
        res.status(500).json({ error: "Fehler beim Lesen der Datenbank" });
    }
});

app.post('/api/transactions', (req, res) => {
    try {
        let db = { eintraege: [] };
        if (fs.existsSync(DB_FILE)) {
            db = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
        }
        
        const newEntry = {
            id: Date.now(),
            name: req.body.name || "Unbenannt",
            kategorie: req.body.kategorie || "Sonstiges",
            wert: parseFloat(req.body.wert || 0),
            timestamp: new Date().toISOString()
        };
        
        db.eintraege.push(newEntry);
        fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
        res.json(newEntry);
    } catch (err) {
        res.status(500).json({ error: "Fehler beim Speichern" });
    }
});

app.delete('/api/transactions/:id', (req, res) => {
    try {
        if (!fs.existsSync(DB_FILE)) return res.status(404).json({ error: "Nicht gefunden" });
        let db = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
        const id = parseInt(req.params.id);
        db.eintraege = db.eintraege.filter(e => e.id !== id);
        fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: "Fehler beim Löschen" });
    }
});
"""

# Füge die neuen Endpoints vor dem Listen-Aufruf ein
if 'app.get(\'/api/transactions\'' not in content:
    content = content.replace("app.get('/health', (req, res) => res.json({ ok: true }));", new_api_endpoints + "\napp.get('/health', (req, res) => res.json({ ok: true }));")

with open(server_path, "w", encoding="utf-8") as f:
    f.write(content)
print("✅ Server API für Transaktionen hinzugefügt.")
