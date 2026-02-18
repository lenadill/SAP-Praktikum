path = "../App/templates/dashboard.html"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

dm_script = '<script src="../static/js/data-manager.js"></script>'

if dm_script not in content:
    # Füge es vor graph.js ein
    content = content.replace('<script src="../static/js/graph.js"></script>', 
                             dm_script + '\n    <script src="../static/js/graph.js"></script>')

with open(path, "w", encoding="utf-8") as f:
    f.write(content)
