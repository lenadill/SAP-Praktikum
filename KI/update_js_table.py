js_path = "../App/static/js/transactions.js"
with open(js_path, "r", encoding="utf-8") as f:
    content = f.read()

# Neues HTML für jede Tabellenzeile
old_tr = r"""                tr.innerHTML = `
                    <td>${e.kategorie}</td>
                    <td style="color:${color}; font-weight:bold">${symbol}${wertNum.toFixed(2)}€</td>
                    <td>${new Date(e.timestamp).toLocaleDateString('en-US')}</td>
                `;"""

new_tr = r"""                tr.innerHTML = `
                    <td>${e.kategorie}</td>
                    <td>${e.sender || '-'}</td>
                    <td>${e.empfaenger || '-'}</td>
                    <td style="color:${color}; font-weight:bold">${symbol}${wertNum.toFixed(2)}€</td>
                    <td>${new Date(e.timestamp).toLocaleDateString('de-DE')}</td>
                `;"""

if old_tr in content:
    content = content.replace(old_tr, new_tr)
    # Spaltenanzahl im Empty-Zustand korrigieren
    content = content.replace('colspan="4"', 'colspan="6"')
    content = content.replace('colspan="3"', 'colspan="6"')

    with open(js_path, "w", encoding="utf-8") as f:
        f.write(content)
    print("✅ Tabellen-Rendering in transactions.js aktualisiert.")
else:
    print("❌ Konnte tr.innerHTML in transactions.js nicht finden.")
