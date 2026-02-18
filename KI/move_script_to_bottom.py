import re

path = "../App/templates/dashboard.html"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

# Script tag finden
script_tag = '<script src="../static/js/transactions.js"></script>'

if script_tag in content:
    content = content.replace(script_tag, "")
    content = content.replace("</body>", script_tag + "\n</body>")

with open(path, "w", encoding="utf-8") as f:
    f.write(content)
