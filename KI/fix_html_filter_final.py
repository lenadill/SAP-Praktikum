path = "../App/templates/dashboard.html"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

# Stellen wir sicher, dass alle Kategorien im Filter sind
filter_html = """
                <div class="transactions-header">
                    <h2 class="transactions-title">Transactions</h2>
                    <div class="filter-controls" style="display:flex; gap:10px; align-items:center;">
                        <select id="catFilter" class="chart-select" style="margin-bottom:0; min-width:150px;">
                            <option value="all">Alle Kategorien</option>
                            <option value="Income">Income</option>
                            <option value="Housing">Housing</option>
                            <option value="Transportation">Transportation</option>
                            <option value="Food">Food</option>
                            <option value="Leisure">Leisure</option>
                            <option value="Shopping">Shopping</option>
                            <option value="Miscellaneous">Miscellaneous</option>
                        </select>
                        <button class="add-btn" id="btnAddRecipt">Add Recipt</button>
                    </div>
                </div>"""

# Suche den Container und ersetze ihn
import re
pattern = r'<div class="transactions-header">.*?<button class="add-btn" id="btnAddRecipt">Add Recipt</button>.*?</div>'
content = re.sub(pattern, filter_html, content, flags=re.DOTALL)

with open(path, "w", encoding="utf-8") as f:
    f.write(content)
print("✅ Dashboard HTML Filter final korrigiert.")
