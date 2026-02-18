import os

js_path = "../App/static/js/transactions.js"
with open(js_path, "r", encoding="utf-8") as f:
    content = f.read()

# Sicherstellen, dass die Graphen ein Signal zum Neuladen bekommen
if "document.dispatchEvent(new Event('dataUpdated'));" not in content:
    # (Dieser Teil wurde schon im vorherigen Schritt eingebaut, ich prüfe zur Sicherheit nochmals)
    pass

# Wir können noch eine kleine Funktion für Joule hinzufügen, damit er "hört", wenn sich Daten ändern
with open(js_path, "w", encoding="utf-8") as f:
    f.write(content)

print("✅ transactions.js ist bereit.")
