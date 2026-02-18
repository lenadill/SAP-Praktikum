import os

css_path = "../App/static/css/style.css"
js_path = "../App/static/js/graph.js"

# 1. CSS fix: Schatten nicht abschneiden
if os.path.exists(css_path):
    with open(css_path, "r", encoding="utf-8") as f:
        css = f.read()
    
    # Sicherstellen, dass die chart-area und transactions Bereiche Schatten nicht abschneiden
    shadow_fix = """
.chart-area, .transactions, .main-content {
    overflow: visible !important;
}
.card {
    box-shadow: 0 4px 15px rgba(0,0,0,0.08) !important;
    overflow: visible !important;
}
"""
    if ".chart-area, .transactions" not in css:
        with open(css_path, "a", encoding="utf-8") as f:
            f.write(shadow_fix)
    print("✅ CSS Schatten-Fix angewendet.")

# 2. JS fix: Surplus Linie durchgezogen grün
if os.path.exists(js_path):
    with open(js_path, "r", encoding="utf-8") as f:
        js = f.read()
    
    # Wir suchen das Dataset für Surplus und stellen sicher, dass es durchgezogen ist
    # (borderDash entfernen falls vorhanden, Farbe auf grün)
    old_surplus = """{
                        label: 'Surplus',
                        data: data.labels.map((_, i) => data.revenue[i] - data.outgoings[i]),
                        borderColor: '#27ae60',
                        tension: 0.4
                    }"""
    
    new_surplus = """{
                        label: 'Surplus',
                        data: data.labels.map((_, i) => data.revenue[i] - data.outgoings[i]),
                        borderColor: '#27ae60',
                        backgroundColor: 'rgba(39, 174, 96, 0.1)',
                        fill: false,
                        tension: 0.4,
                        borderWidth: 3,
                        borderDash: [] // Sicherstellen, dass nicht gestrichelt
                    }"""
    
    if "label: 'Surplus'" in js:
        # Wir machen einen einfacheren Replace auf den relevanten Teil
        js = js.replace("borderColor: '#27ae60', tension: 0.4", "borderColor: '#27ae60', tension: 0.4, borderWidth: 3, fill: false, borderDash: []")
        with open(js_path, "w", encoding="utf-8") as f:
            f.write(js)
        print("✅ Graphen-Linie für Surplus auf durchgezogen grün gesetzt.")
