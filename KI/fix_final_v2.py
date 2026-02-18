import re

path = "../App/templates/dashboard.html"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Altes Menü-HTML finden und durch sauberes ersetzen
content = re.sub(r'<div id="contextMenu".*?</div>', '', content, flags=re.DOTALL)
new_menu_html = """
    <!-- Context Menu -->
    <div id="contextMenu" class="context-menu">
        <ul class="context-menu-list">
            <li id="cmEdit">Edit</li>
            <li id="cmDelete" class="delete-opt">Delete</li>
        </ul>
    </div>
"""
content = content.replace("</body>", new_menu_html + "</body>")

# 2. CSS Block in den Head
style_block = """
<style>
    .context-menu {
        display: none;
        position: fixed;
        z-index: 10000;
        background: white !important;
        border: 1px solid #ddd !important;
        border-radius: 8px !important;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15) !important;
        min-width: 140px;
        padding: 5px 0 !important;
    }
    .context-menu-list {
        list-style: none !important;
        margin: 0 !important;
        padding: 0 !important;
    }
    .context-menu-list li {
        padding: 10px 15px !important;
        cursor: pointer !important;
        font-size: 14px !important;
        color: #333 !important;
        list-style-type: none !important;
        transition: background 0.2s;
    }
    .context-menu-list li:hover {
        background: #f0f7ff !important;
        color: #0070d2 !important;
    }
    .context-menu-list li.delete-opt {
        color: #d32f2f !important;
        border-top: 1px solid #eee !important;
    }
    .context-menu-list li.delete-opt:hover {
        background: #fff0f0 !important;
    }
</style>
"""
if "</head>" in content:
    content = content.replace("</head>", style_block + "</head>")

with open(path, "w", encoding="utf-8") as f:
    f.write(content)
print("✅ Dashboard HTML Style final korrigiert.")
