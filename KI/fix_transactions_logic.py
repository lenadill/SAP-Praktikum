import os

js_path = "../App/static/js/transactions.js"
with open(js_path, "r", encoding="utf-8") as f:
    content = f.read()

# Neue Logik für das Absenden des Formulars (mit Betrags-Vorzeichen)
old_payload = """                const payload = {
                    name: document.getElementById('tName').value,
                    kategorie: document.getElementById('tKategorie').value,
                    wert: parseFloat(document.getElementById('tWert').value)
                };"""

new_payload = """                let wert = parseFloat(document.getElementById('tWert').value);
                const type = document.getElementById('tType').value;
                if (type === 'expense') {
                    wert = -Math.abs(wert);
                } else {
                    wert = Math.abs(wert);
                }
                
                const payload = {
                    name: document.getElementById('tName').value,
                    kategorie: document.getElementById('tKategorie').value,
                    wert: wert
                };"""

if old_payload in content:
    content = content.replace(old_payload, new_payload)
    with open(js_path, "w", encoding="utf-8") as f:
        f.write(content)
    print("✅ Transaktions-Logik (Einnahme/Ausgabe) aktualisiert.")
else:
    print("❌ Konnte Payload-Sektion in transactions.js nicht finden.")
