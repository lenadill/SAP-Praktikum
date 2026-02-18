import os

path = "../server.js"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

put_endpoint = """
app.put('/api/transactions/:id', (req, res) => {
    const { name, kategorie, wert } = req.body;
    db.run("UPDATE transactions SET name = ?, kategorie = ?, wert = ? WHERE id = ?",
        [name, kategorie, parseFloat(wert), req.params.id],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true });
        }
    );
});
"""

if "app.put('/api/transactions/:id'" not in content:
    content = content.replace("app.delete('/api/transactions/:id'", put_endpoint + "\napp.delete('/api/transactions/:id'")

with open(path, "w", encoding="utf-8") as f:
    f.write(content)
print("✅ Server um PUT-Endpunkt erweitert.")
