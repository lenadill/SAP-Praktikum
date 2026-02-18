import os

path = "../App/templates/dashboard.html"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

# Neues HTML für das Typ-Feld
type_field = """
                <div class="form-group">
                    <label>Typ</label>
                    <select id="tType">
                        <option value="expense" selected>Ausgabe</option>
                        <option value="income">Einnahme</option>
                    </select>
                </div>"""

# Einfügen vor der Kategorie
if '<div class="form-group">' in content and 'id="tType"' not in content:
    content = content.replace('<div class="form-group">', type_field + '\n                <div class="form-group">', 1)

with open(path, "w", encoding="utf-8") as f:
    f.write(content)
print("✅ Formular um Typ-Auswahl erweitert.")
