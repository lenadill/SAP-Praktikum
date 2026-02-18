js_path = "../App/static/js/graph.js"
with open(js_path, "r", encoding="utf-8") as f:
    js = f.read()

# Im "else" Block (chart.update) fehlten die Linien-Eigenschaften
old_update_block = """            chart.data.datasets[1].data = data.outgoings;
            chart.data.datasets[2].data = data.labels.map((_, i) => data.revenue[i] - data.outgoings[i]);
            chart.update();"""

new_update_block = """            chart.data.datasets[1].data = data.outgoings;
            chart.data.datasets[2].data = data.labels.map((_, i) => data.revenue[i] - data.outgoings[i]);
            
            // Surplus Style forcieren
            chart.data.datasets[2].borderColor = '#27ae60';
            chart.data.datasets[2].borderWidth = 3;
            chart.data.datasets[2].borderDash = [];
            chart.data.datasets[2].fill = false;

            chart.update();"""

if old_update_block in js:
    js = js.replace(old_update_block, new_update_block)
    with open(js_path, "w", encoding="utf-8") as f:
        f.write(js)
    print("✅ Graphen-Update-Logik für Surplus-Linie fixiert.")
else:
    print("❌ Konnte Update-Block nicht finden.")
