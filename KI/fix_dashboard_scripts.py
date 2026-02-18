import os

dashboard_path = "../App/templates/dashboard.html"

with open(dashboard_path, "r", encoding="utf-8") as f:
    content = f.read()

# Sicherstellen, dass die Skripte am Ende stehen
scripts = """
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <script src="../static/js/dashboard.js"></script>
    <script src="../static/js/ai-chat.js"></script>
    <script src="../static/js/graph.js"></script>
    <script src="../static/js/cards-data.js"></script>
    <script src="../static/js/transactions.js"></script>
    <button class="diamond-btn" title="KI-Assistent öffnen" aria-label="KI-Chat öffnen">
        <img src="../assets/icons/joule_logo.png" alt="KI-Assistent">
    </button>
</body>
"""

if "</body>" in content and "transactions.js" not in content:
    content = content.replace("</body>", scripts)
elif "transactions.js" in content:
    # Falls Skripte doppelt sind oder falsch platziert, bereinigen wir sie hier nicht, 
    # sondern stellen sicher, dass sie da sind.
    pass

with open(dashboard_path, "w", encoding="utf-8") as f:
    f.write(content)

print("✅ Dashboard-Skripte wurden repariert.")
