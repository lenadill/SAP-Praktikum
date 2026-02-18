path = "../App/templates/dashboard.html"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

old_selector = """                    <select class="chart-select" id="chartTimeframeSelect">
                        <option value="week">Week</option>
                        <option value="month">Month</option>
                        <option value="year" selected>Year</option>
                        <option value="2025Q1">2025 - Q1</option>
                        <option value="2025Q2">2025 - Q2</option>
                        <option value="2025Q3">2025 - Q3</option>
                        <option value="2025Q4">2025 - Q4</option>
                    </select>"""

new_selector = """                    <select class="chart-select" id="chartTimeframeSelect">
                        <option value="week">Woche</option>
                        <option value="month">Monat</option>
                        <option value="2025">Jahr 2025</option>
                        <option value="2026" selected>Jahr 2026</option>
                        <option value="2025Q1">2025 - Q1</option>
                        <option value="2025Q2">2025 - Q2</option>
                        <option value="2025Q3">2025 - Q3</option>
                        <option value="2025Q4">2025 - Q4</option>
                    </select>"""

if old_selector in content:
    content = content.replace(old_selector, new_selector)

with open(path, "w", encoding="utf-8") as f:
    f.write(content)
print("✅ Dashboard Selector aktualisiert.")
