js_path = "../App/static/js/transactions.js"
with open(js_path, "r", encoding="utf-8") as f:
    content = f.read()

# Neue Infinite-Scroll Logik
new_logic = r"""(function() {
    function init() {
        console.log("Transactions JS init mit Infinite Scroll");
        const tableBody = document.querySelector('.transactions-table tbody');
        const modal = document.getElementById('transactionModal');
        const btnAdd = document.getElementById('btnAddRecipt');
        const btnCancel = document.getElementById('btnCancel');
        const form = document.getElementById('transactionForm');
        
        const contextMenu = document.getElementById('contextMenu');
        const cmEdit = document.getElementById('cmEdit');
        const cmDelete = document.getElementById('cmDelete');
        const catFilter = document.getElementById('catFilter');

        let allEntries = []; // Für den Cache, falls nötig (Filter-Logik)
        let selectedTransactionId = null;
        
        let limit = 25;
        let offset = 0;
        let isLoading = false;
        let hasMore = true;

        // Wir nutzen eine separate Variable für die Anzeige
        let displayedEntries = [];

        function loadTransactions(reset = false) {
            if (isLoading || (!hasMore && !reset)) return;
            isLoading = true;

            if (reset) {
                offset = 0;
                hasMore = true;
                tableBody.innerHTML = '';
                displayedEntries = [];
            }

            const selectedCat = catFilter ? catFilter.value : 'all';
            const url = `/api/transactions?limit=${limit}&offset=${offset}`;

            fetch(url)
                .then(res => res.json())
                .then(data => {
                    const entries = data.eintraege || [];
                    if (entries.length < limit) {
                        hasMore = false;
                    }
                    
                    displayedEntries = displayedEntries.concat(entries);
                    renderNewEntries(entries);
                    
                    offset += limit;
                    isLoading = false;
                    
                    // Falls wir noch nicht genug haben, um zu scrollen (sehr seltene Fälle), 
                    // könnten wir hier prüfen, ob wir noch mehr brauchen.
                })
                .catch(err => {
                    console.error("Error loading transactions:", err);
                    isLoading = false;
                });
        }

        function renderNewEntries(entries) {
            if (offset === 0 && entries.length === 0) {
                tableBody.innerHTML = '<tr><td colspan="6" class="empty">Keine Einträge gefunden</td></tr>';
                return;
            }

            entries.forEach(e => {
                const tr = document.createElement('tr');
                tr.dataset.id = e.id;
                tr.dataset.raw = JSON.stringify(e);
                
                const wertNum = parseFloat(e.wert);
                const color = wertNum >= 0 ? '#28a745' : '#dc3545';
                const symbol = wertNum >= 0 ? '+' : '';

                tr.innerHTML = `
                    <td>${e.kategorie}</td>
                    <td>${e.sender || '-'}</td>
                    <td>${e.empfaenger || '-'}</td>
                    <td style="color:${color}; font-weight:bold">${symbol}${wertNum.toFixed(2)}€</td>
                    <td>${new Date(e.timestamp).toLocaleDateString('de-DE')}</td>
                `;

                tr.addEventListener('contextmenu', (event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    selectedTransactionId = e.id;
                    contextMenu.style.display = 'block';
                    contextMenu.style.left = event.pageX + 'px';
                    contextMenu.style.top = event.pageY + 'px';
                });

                tableBody.appendChild(tr);
            });
        }

        // Filter: Bei Infinite Scroll ist lokales Filtern schwer, 
        // wir laden beim Filter-Wechsel einfach neu (da wir nur 25 zeigen)
        if (catFilter) {
            catFilter.addEventListener('change', () => loadTransactions(true));
        }

        // Scroll Event Listener
        window.addEventListener('scroll', () => {
            if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 200) {
                loadTransactions();
            }
        });

        // Kontextmenü Logik (bleibt gleich)
        window.addEventListener('click', () => { contextMenu.style.display = 'none'; });

        cmDelete.addEventListener('click', () => {
            if (selectedTransactionId && confirm('Wirklich löschen?')) {
                fetch('/api/transactions/' + selectedTransactionId, { method: 'DELETE' })
                    .then(() => {
                        loadTransactions(true);
                        document.dispatchEvent(new Event('dataUpdated'));
                    });
            }
        });

        cmEdit.addEventListener('click', () => {
            if (!selectedTransactionId) return;
            const row = document.querySelector(`tr[data-id="${selectedTransactionId}"]`);
            const data = JSON.parse(row.dataset.raw);
            document.getElementById('tName').value = data.name;
            document.getElementById('tKategorie').value = data.kategorie;
            document.getElementById('tWert').value = Math.abs(data.wert);
            document.getElementById('tType').value = data.wert >= 0 ? 'income' : 'expense';
            document.getElementById('tSender').value = data.sender || '';
            document.getElementById('tEmpfaenger').value = data.empfaenger || '';
            form.dataset.editId = selectedTransactionId;
            document.querySelector('.modal-header').textContent = 'Eintrag bearbeiten';
            modal.style.display = 'block';
        });

        form.addEventListener('submit', function(e) {
            e.preventDefault();
            const editId = form.dataset.editId;
            let wert = parseFloat(document.getElementById('tWert').value);
            if (document.getElementById('tType').value === 'expense') wert = -Math.abs(wert);
            else wert = Math.abs(wert);
            
            const payload = {
                name: document.getElementById('tName').value,
                kategorie: document.getElementById('tKategorie').value,
                wert: wert,
                sender: document.getElementById('tSender').value,
                empfaenger: document.getElementById('tEmpfaenger').value
            };

            fetch(editId ? '/api/transactions/' + editId : '/api/transactions', {
                method: editId ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })
            .then(() => {
                modal.style.display = 'none';
                form.reset();
                delete form.dataset.editId;
                document.querySelector('.modal-header').textContent = 'Neue Transaktion';
                loadTransactions(true);
                document.dispatchEvent(new Event('dataUpdated'));
            });
        });

        btnAdd.addEventListener('click', function() {
            form.reset();
            delete form.dataset.editId;
            document.querySelector('.modal-header').textContent = 'Neue Transaktion';
            modal.style.display = 'block';
        });
        if (btnCancel) btnCancel.addEventListener('click', () => modal.style.display = 'none');
        window.addEventListener('click', (e) => { if (e.target == modal) modal.style.display = 'none'; });

        loadTransactions(true);
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();"""

with open(js_path, "w", encoding="utf-8") as f:
    f.write(new_logic)
