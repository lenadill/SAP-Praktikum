path = "../App/templates/dashboard.html"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

old_header = """                    <thead>
                        <tr>
                            <th>Category</th>
                            <th>Amount</th>
                            <th>Date</th>
                        </tr>
                    </thead>"""

new_header = """                    <thead>
                        <tr>
                            <th>Category</th>
                            <th>Amount</th>
                            <th>Date</th>
                            <th></th>
                        </tr>
                    </thead>"""

if old_header in content:
    content = content.replace(old_header, new_header)

with open(path, "w", encoding="utf-8") as f:
    f.write(content)
