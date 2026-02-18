js_path = "../App/static/js/transactions.js"
with open(js_path, "r", encoding="utf-8") as f:
    content = f.read()

old_load = """        function loadTransactions() {
            fetch('/api/transactions')
                .then(res => res.json())
                .then(data => {
                    renderTable(data.eintraege);
                })
                .catch(err => console.error("Error loading transactions:", err));
        }"""

new_load = """        let allEntries = [];
        const catFilter = document.getElementById('catFilter');

        function loadTransactions() {
            fetch('/api/transactions')
                .then(res => res.json())
                .then(data => {
                    allEntries = data.eintraege || [];
                    applyFilter();
                })
                .catch(err => console.error("Error loading transactions:", err));
        }

        function applyFilter() {
            const selectedCat = catFilter ? catFilter.value : 'all';
            const filtered = selectedCat === 'all' 
                ? allEntries 
                : allEntries.filter(e => e.kategorie === selectedCat);
            renderTable(filtered);
        }

        if (catFilter) {
            catFilter.addEventListener('change', applyFilter);
        }"""

if old_load in content:
    content = content.replace(old_load, new_load)
    with open(js_path, "w", encoding="utf-8") as f:
        f.write(content)
    print("✅ Filter-Logik erfolgreich in transactions.js integriert.")
