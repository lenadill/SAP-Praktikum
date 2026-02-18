import os

js_path = "../App/static/js/data-manager.js"
with open(js_path, "r", encoding="utf-8") as f:
    content = f.read()

# Wir erweitern die Logik, um beliebige Jahreszahlen zu verarbeiten
# Wir suchen den Block für 'year' und machen ihn dynamisch
old_year_block = """        if (timeframe === 'year') {
            labels = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];
            revenue = new Array(12).fill(0);
            outgoings = new Array(12).fill(0);
            
            transactions.forEach(t => {
                const d = new Date(t.timestamp);
                if (d.getFullYear() === nowYear) {
                    const month = d.getMonth();
                    revenue[month] += Math.max(0, t.wert);
                    outgoings[month] += Math.abs(Math.min(0, t.wert));
                }
            });
        }"""

new_year_block = """        let targetYear = nowYear;
        if (/^\\d{4}$/.test(timeframe)) {
            targetYear = parseInt(timeframe);
        }

        if (timeframe === 'year' || /^\\d{4}$/.test(timeframe)) {
            labels = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];
            revenue = new Array(12).fill(0);
            outgoings = new Array(12).fill(0);
            
            transactions.forEach(t => {
                const d = new Date(t.timestamp);
                if (d.getFullYear() === targetYear) {
                    const month = d.getMonth();
                    revenue[month] += Math.max(0, t.wert);
                    outgoings[month] += Math.abs(Math.min(0, t.wert));
                }
            });
        }"""

content = content.replace(old_year_block, new_year_block)

with open(js_path, "w", encoding="utf-8") as f:
    f.write(content)
print("✅ data-manager.js für dynamische Jahreswahl aktualisiert.")
