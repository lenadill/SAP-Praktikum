import os

files = ["../App/templates/index.html", "../App/templates/dashboard.html"]
script_tag = '    <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>\n'

for file_path in files:
    if os.path.exists(file_path):
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()
        
        if "marked.min.js" not in content:
            if "</head>" in content:
                content = content.replace("</head>", script_tag + "</head>")
                with open(file_path, "w", encoding="utf-8") as f:
                    f.write(content)
                print(f"✅ marked.js zu {file_path} hinzugefügt.")
            else:
                print(f"⚠️  </head> nicht gefunden in {file_path}")
        else:
            print(f"ℹ️  marked.js bereits vorhanden in {file_path}")
