import os

dashboard_path = "../App/templates/dashboard.html"
with open(dashboard_path, "r", encoding="utf-8") as f:
    content = f.read()

# CSS für das Formular-Popup
popup_css = """
    <style>
        .modal {
            display: none;
            position: fixed;
            z-index: 1000;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0,0,0,0.5);
        }
        .modal-content {
            background-color: white;
            margin: 10% auto;
            padding: 30px;
            border-radius: 15px;
            width: 350px;
            box-shadow: 0 10px 25px rgba(0,0,0,0.2);
            position: relative;
        }
        .modal-header {
            margin-bottom: 20px;
            color: #0070d2;
            font-size: 1.5em;
            font-weight: bold;
        }
        .form-group {
            margin-bottom: 15px;
        }
        .form-group label {
            display: block;
            margin-bottom: 5px;
            font-weight: bold;
            font-size: 0.9em;
        }
        .form-group input, .form-group select {
            width: 100%;
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 5px;
            box-sizing: border-box;
        }
        .modal-footer {
            margin-top: 20px;
            display: flex;
            justify-content: flex-end;
            gap: 10px;
        }
        .btn {
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            border: none;
            font-weight: bold;
        }
        .btn-cancel { background: #eee; }
        .btn-submit { background: #0070d2; color: white; }
    </style>
"""

# Das Formular-HTML
form_html = """
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

# Einfügen in den Head (CSS)
if '<style>' not in content:
    content = content.replace("</head>", popup_css + "\n</head>")

# Einfügen in den Body (Formular)
if 'id="transactionModal"' not in content:
    content = content.replace("</body>", form_html + "\n</body>")

# Script einbinden
if 'src="../static/js/transactions.js"' not in content:
    content = content.replace('<script src="../static/js/cards-data.js"></script>', 
                            '<script src="../static/js/cards-data.js"></script>\n    <script src="../static/js/transactions.js"></script>')

# Add-Btn Klasse anpassen
content = content.replace('<button class="add-btn">Add Recipt</button>', '<button class="add-btn" id="btnAddRecipt">Add Recipt</button>')

with open(dashboard_path, "w", encoding="utf-8") as f:
    f.write(content)
print("✅ Dashboard Template aktualisiert.")
