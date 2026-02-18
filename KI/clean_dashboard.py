import os

dashboard_path = "../App/templates/dashboard.html"
with open(dashboard_path, "r", encoding="utf-8") as f:
    content = f.read()

# Alles zwischen <style> und </style> entfernen (falls es mein Popup-CSS ist)
import re
new_content = re.sub(r'<style>.*?</style>', '', content, flags=re.DOTALL)

with open(dashboard_path, "w", encoding="utf-8") as f:
    f.write(new_content)
