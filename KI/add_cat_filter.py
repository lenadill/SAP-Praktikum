path = "../App/templates/dashboard.html"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

filter_html = """
                <div class="transactions-header">
                    <h2 class="transactions-title">Transactions</h2>
                    <div class="filter-controls" style="display:flex; gap:10px; align-items:center;">
                        <select id="catFilter" class="chart-select" style="margin-bottom:0;">
                            <option value="all">Alle Kategorien</option>
                            <option value="Einkommen">Einkommen</option>
                            <option value="Wohnen">Wohnen</option>
                            <option value="Verkehr">Verkehr</option>
                            <option value="Lebensmittel">Lebensmittel</option>
                            <option value="Freizeit">Freizeit</option>
                            <option value="Shopping">Shopping</option>
                            <option value="Sonstiges">Sonstiges</option>
                        </select>
                        <button class="add-btn" id="btnAddRecipt">Add Recipt</button>
                    </div>
                </div>"""

# Ersetze den alten Header
old_header = """                <div class="transactions-header">
                    <h2 class="transactions-title">Transactions</h2>
                    <button class="add-btn" id="btnAddRecipt">Add Recipt</button>
                </div>"""

if old_header in content:
    content = content.replace(old_header, filter_html)

with open(path, "w", encoding="utf-8") as f:
    f.write(content)
print("✅ Kategorie-Filter im HTML hinzugefügt.")
