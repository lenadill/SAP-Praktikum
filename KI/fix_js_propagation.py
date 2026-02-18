js_path = "../App/static/js/transactions.js"
with open(js_path, "r", encoding="utf-8") as f:
    content = f.read()

old_event = """                // Right-click event
                tr.addEventListener('contextmenu', (event) => {
                    event.preventDefault();
                    selectedTransactionId = e.id;
                    
                    contextMenu.style.display = 'block';
                    contextMenu.style.left = event.pageX + 'px';
                    contextMenu.style.top = event.pageY + 'px';
                });"""

new_event = """                // Right-click event
                tr.addEventListener('contextmenu', (event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    selectedTransactionId = e.id;
                    
                    contextMenu.style.display = 'block';
                    contextMenu.style.left = event.pageX + 'px';
                    contextMenu.style.top = event.pageY + 'px';
                });"""

if old_event in content:
    content = content.replace(old_event, new_event)
    with open(js_path, "w", encoding="utf-8") as f:
        f.write(content)
    print("✅ Kontextmenü Event-Propagation gefixt.")
