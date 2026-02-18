path = "../App/templates/dashboard.html"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

# Sender/Empfänger Felder
new_fields = """
                <div class="form-group">
                    <label>Sender</label>
                    <input type="text" id="tSender" placeholder="Wer sendet das Geld?">
                </div>
                <div class="form-group">
                    <label>Empfänger</label>
                    <input type="text" id="tEmpfaenger" placeholder="Wer erhält das Geld?">
                </div>"""

# Einfügen vor dem Betrag (tWert)
if 'id="tWert"' in content and 'id="tSender"' not in content:
    content = content.replace('<div class="form-group">\n                    <label>Amount (€)</label>', 
                            new_fields + '\n                <div class="form-group">\n                    <label>Amount (€)</label>')

with open(path, "w", encoding="utf-8") as f:
    f.write(content)
print("✅ Sender/Empfänger Felder im Modal hinzugefügt.")
