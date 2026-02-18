js_path = "../App/static/js/transactions.js"
with open(js_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Felder im Payload hinzufügen
old_payload = """            const payload = {
                name: document.getElementById('tName').value,
                kategorie: document.getElementById('tKategorie').value,
                wert: wert
            };"""

new_payload = """            const payload = {
                name: document.getElementById('tName').value,
                kategorie: document.getElementById('tKategorie').value,
                wert: wert,
                sender: document.getElementById('tSender').value,
                empfaenger: document.getElementById('tEmpfaenger').value
            };"""

# 2. Felder beim Bearbeiten füllen
old_fill = """            document.getElementById('tName').value = data.name;
            document.getElementById('tKategorie').value = data.kategorie;
            document.getElementById('tWert').value = Math.abs(data.wert);"""

new_fill = """            document.getElementById('tName').value = data.name;
            document.getElementById('tKategorie').value = data.kategorie;
            document.getElementById('tWert').value = Math.abs(data.wert);
            document.getElementById('tSender').value = data.sender || '';
            document.getElementById('tEmpfaenger').value = data.empfaenger || '';"""

if old_payload in content:
    content = content.replace(old_payload, new_payload)
if old_fill in content:
    content = content.replace(old_fill, new_fill)

with open(js_path, "w", encoding="utf-8") as f:
    f.write(content)
print("✅ JS für Sender/Empfänger Felder aktualisiert.")
