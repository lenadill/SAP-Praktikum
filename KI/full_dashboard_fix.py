import os

path = "../App/templates/dashboard.html"
with open(path, "r", encoding="utf-8") as f:
    lines = f.readlines()

# Wir bauen die Datei sauber auf
new_lines = []
modal_html = """
    <!-- Modal für neue Transaktion -->
    <div id="transactionModal" class="modal">
        <div class="modal-content">
            <div class="modal-header">Neue Transaktion</div>
            <form id="transactionForm">
                <div class="form-group">
                    <label>Name</label>
                    <input type="text" id="tName" placeholder="z.B. Supermarkt" required>
                </div>
                <div class="form-group">
                    <label>Kategorie</label>
                    <select id="tKategorie">
                        <option value="Einkommen">Einkommen</option>
                        <option value="Wohnen">Wohnen</option>
                        <option value="Verkehr">Verkehr</option>
                        <option value="Lebensmittel" selected>Lebensmittel</option>
                        <option value="Freizeit">Freizeit</option>
                        <option value="Shopping">Shopping</option>
                        <option value="Sonstiges">Sonstiges</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Betrag (€)</label>
                    <input type="number" id="tWert" step="0.01" placeholder="z.B. 12.50" required>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-cancel" id="btnCancel">Abbrechen</button>
                    <button type="submit" class="btn btn-submit">Hinzufügen</button>
                </div>
            </form>
        </div>
    </div>
"""

scripts = """
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <script src="../static/js/dashboard.js"></script>
    <script src="../static/js/ai-chat.js"></script>
    <script src="../static/js/graph.js"></script>
    <script src="../static/js/cards-data.js"></script>
    <script src="../static/js/transactions.js"></script>
    <button class="diamond-btn" title="KI-Assistent öffnen" aria-label="KI-Chat öffnen">
        <img src="../assets/icons/joule_logo.png" alt="KI-Assistent">
    </button>
"""

found_modal = False
found_scripts = False

for line in lines:
    if "id=\"transactionModal\"" in line: found_modal = True
    if "src=\"../static/js/transactions.js\"" in line: found_scripts = True
    
    if "</body>" in line:
        if not found_modal: new_lines.append(modal_html)
        if not found_scripts: new_lines.append(scripts)
        new_lines.append(line)
    else:
        new_lines.append(line)

with open(path, "w", encoding="utf-8") as f:
    f.writelines(new_lines)
print("✅ Dashboard HTML wurde final bereinigt.")
