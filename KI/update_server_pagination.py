import os

path = "../server.js"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

# Suche den GET /api/transactions Endpunkt und füge Limit/Offset hinzu
old_endpoint = """app.get('/api/transactions', (req, res) => {
    db.all("SELECT * FROM transactions ORDER BY timestamp DESC", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ eintraege: rows });
    });
});"""

new_endpoint = """app.get('/api/transactions', (req, res) => {
    const limit = parseInt(req.query.limit) || 25;
    const offset = parseInt(req.query.offset) || 0;
    
    db.all("SELECT * FROM transactions ORDER BY timestamp DESC LIMIT ? OFFSET ?", [limit, offset], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ eintraege: rows });
    });
});"""

if old_endpoint in content:
    content = content.replace(old_endpoint, new_endpoint)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    print("✅ Server-API für Pagination (Limit/Offset) aktualisiert.")
else:
    print("❌ Konnte GET /api/transactions Endpunkt nicht finden.")
