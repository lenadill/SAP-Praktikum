path = "../App/templates/dashboard.html"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

# Header erweitern
old_header = """                        <tr>
                            <th>Category</th>
                            <th>Amount</th>
                            <th>Date</th>
                        </tr>"""

new_header = """                        <tr>
                            <th>Category</th>
                            <th>Sender</th>
                            <th>Empfänger</th>
                            <th>Amount</th>
                            <th>Date</th>
                        </tr>"""

if old_header in content:
    content = content.replace(old_header, new_header)

with open(path, "w", encoding="utf-8") as f:
    f.write(content)
print("✅ Tabellen-Header im Dashboard erweitert.")
