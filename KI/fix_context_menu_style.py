path = "../App/templates/dashboard.html"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

# Kompaktes, robustes CSS für das Kontextmenü
style_block = """
<style>
    .context-menu {
        display: none;
        position: fixed;
        z-index: 10000;
        background: white;
        border: 1px solid #ddd;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        min-width: 140px;
        overflow: hidden;
        padding: 5px 0;
        font-family: sans-serif;
    }
    .context-menu-list {
        list-style: none !important;
        margin: 0 !important;
        padding: 0 !important;
    }
    .context-menu-list li {
        padding: 10px 15px;
        cursor: pointer;
        font-size: 14px;
        color: #333;
        transition: background 0.2s;
        list-style-type: none !important;
    }
    .context-menu-list li:hover {
        background: #f0f7ff;
        color: #0070d2;
    }
    .context-menu-list li.delete-opt {
        color: #d32f2f;
        border-top: 1px solid #eee;
    }
    .context-menu-list li.delete-opt:hover {
        background: #fff0f0;
        color: #b71c1c;
    }
</style>
"""

# HTML-Element säubern (inline styles entfernen, die stören könnten)
old_menu = '<div id="contextMenu" class="context-menu" style="display:none; position:fixed; z-index:9999;">'
new_menu = '<div id="contextMenu" class="context-menu">'

if old_menu in content:
    content = content.replace(old_header, filter_html) # Wait, logic error in my draft. Let's do it cleaner.
    
# Ersetze den alten Block komplett
import re
content = re.sub(r'<div id="contextMenu".*?</div>', 
                '<div id="contextMenu" class="context-menu"><ul class="context-menu-list"><li id="cmEdit">Edit</li><li id="cmDelete" class="delete-opt">Delete</li></ul></div>', 
                content, flags=re.DOTALL)

# CSS in den Head einfügen
if "</head>" in content:
    content = content.replace("</head>", style_block + "</head>")

with open(path, "w", encoding="utf-8") as f:
    f.write(content)
print("✅ Kontextmenü-Styling in HTML fixiert.")
