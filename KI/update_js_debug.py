js_path = "../App/static/js/transactions.js"
with open(js_path, "r", encoding="utf-8") as f:
    content = f.read()

debug_log = """
    console.log("Transactions JS geladen");
    console.log("Button Add:", btnAdd);
    console.log("Modal:", modal);
"""

content = content.replace("const form = document.getElementById('transactionForm');", 
                         "const form = document.getElementById('transactionForm');" + debug_log)

with open(js_path, "w", encoding="utf-8") as f:
    f.write(content)
