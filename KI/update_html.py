path = "../App/templates/dashboard.html"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

context_menu_html = """
    <!-- Kontextmenü -->
    <div id="contextMenu" class="context-menu" style="display:none; position:fixed; z-index:2000;">
        <ul class="context-menu-list">
            <li id="cmEdit">Bearbeiten</li>
            <li id="cmDelete" class="delete-opt" style="color:red; border-top:1px solid #eee;">Löschen</li>
        </ul>
    </div>
"""
if 'id="contextMenu"' not in content:
    content = content.replace("</body>", context_menu_html + "\n</body>")

# Lösch-Spalte im Header entfernen
content = content.replace("<th>Date</th>\n                            <th></th>", "<th>Date</th>")
content = content.replace("<th>Date</th>\r\n                            <th></th>", "<th>Date</th>")

with open(path, "w", encoding="utf-8") as f:
    f.write(content)
