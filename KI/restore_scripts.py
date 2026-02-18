import os

def restore_in_file(file_path, is_dashboard=False):
    if not os.path.exists(file_path):
        return
    
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    # Wir stellen sicher, dass alle notwendigen Skripte da sind
    scripts_base = """
    <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
    <script src="../static/js/dashboard.js"></script>
    <script src="../static/js/ai-chat.js"></script>
    """
    
    dashboard_extras = """
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <script src="../static/js/graph.js"></script>
    <script src="../static/js/cards-data.js"></script>
    <script src="../static/js/transactions.js"></script>
    """
    
    button_html = """
    <button class="diamond-btn" title="KI-Assistent öffnen" aria-label="KI-Chat öffnen">
        <img src="../assets/icons/joule_logo.png" alt="KI-Assistent">
    </button>
    """

    # Falls der Button fehlt
    if "diamond-btn" not in content:
        content = content.replace("</body>", button_html + "</body>")
    
    # Skripte sammeln
    all_scripts = scripts_base
    if is_dashboard:
        all_scripts += dashboard_extras
    
    # Prüfen welche Skripte fehlen und am Ende einfügen (vor dem Button)
    # Um Duplikate zu vermeiden, prüfen wir einzeln
    missing_scripts = ""
    for line in all_scripts.strip().split('\n'):
        if line.strip() and line.strip() not in content:
            missing_scripts += "    " + line.strip() + "\n"
    
    if missing_scripts:
        content = content.replace("</body>", missing_scripts + "</body>")

    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"✅ Skripte in {file_path} wiederhergestellt.")

restore_in_file("../App/templates/dashboard.html", True)
restore_in_file("../App/templates/index.html", False)
restore_in_file("../App/templates/support.html", False)
