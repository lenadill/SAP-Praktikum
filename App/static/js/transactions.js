(function() {
    function init() {
        console.log("Transactions JS init with context menu");
        const tableBody = document.querySelector('.transactions-table tbody');
        const modal = document.getElementById('transactionModal');
        const btnAdd = document.getElementById('btnAddRecipt');
        const btnCancel = document.getElementById('btnCancel');
        const form = document.getElementById('transactionForm');
        
        const contextMenu = document.getElementById('contextMenu');
        const cmEdit = document.getElementById('cmEdit');
        const cmDelete = document.getElementById('cmDelete');

        let selectedTransactionId = null;

        let allEntries = [];
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
        }

        function renderTable(entries) {
            if (!entries || entries.length === 0) {
                tableBody.innerHTML = '<tr><td colspan="3" class="empty">No entries found</td></tr>';
                return;
            }

            entries.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

            tableBody.innerHTML = '';
            entries.forEach(e => {
                const tr = document.createElement('tr');
                tr.dataset.id = e.id;
                tr.dataset.raw = JSON.stringify(e);
                
                const wertNum = parseFloat(e.wert);
                const color = wertNum >= 0 ? '#28a745' : '#dc3545';
                const symbol = wertNum >= 0 ? '+' : '';

                tr.innerHTML = `
                    <td>${e.kategorie}</td>
                    <td style="color:${color}; font-weight:bold">${symbol}${wertNum.toFixed(2)}€</td>
                    <td>${new Date(e.timestamp).toLocaleDateString('en-US')}</td>
                `;

                // Right-click event
                tr.addEventListener('contextmenu', (event) => {
                    event.preventDefault();
                    selectedTransactionId = e.id;
                    
                    contextMenu.style.display = 'block';
                    contextMenu.style.left = event.pageX + 'px';
                    contextMenu.style.top = event.pageY + 'px';
                });

                tableBody.appendChild(tr);
            });
        }

        // Click outside closes context menu
        window.addEventListener('click', () => {
            contextMenu.style.display = 'none';
        });

        // Delete via context menu
        cmDelete.addEventListener('click', () => {
            if (selectedTransactionId && confirm('Really delete this transaction?')) {
                deleteTransaction(selectedTransactionId);
            }
        });

        // Edit via context menu
        cmEdit.addEventListener('click', () => {
            if (!selectedTransactionId) return;
            
            const row = document.querySelector(`tr[data-id="${selectedTransactionId}"]`);
            const data = JSON.parse(row.dataset.raw);
            
            // Fill modal
            document.getElementById('tName').value = data.name;
            document.getElementById('tKategorie').value = data.kategorie;
            document.getElementById('tWert').value = Math.abs(data.wert);
            document.getElementById('tType').value = data.wert >= 0 ? 'income' : 'expense';
            
            // Store ID in form to know if it's an update
            form.dataset.editId = selectedTransactionId;
            document.querySelector('.modal-header').textContent = 'Edit Entry';
            
            modal.style.display = 'block';
        });

        form.addEventListener('submit', function(e) {
            e.preventDefault();
            const editId = form.dataset.editId;
            
            let wert = parseFloat(document.getElementById('tWert').value);
            const type = document.getElementById('tType').value;
            if (type === 'expense') wert = -Math.abs(wert);
            else wert = Math.abs(wert);
            
            const payload = {
                name: document.getElementById('tName').value,
                kategorie: document.getElementById('tKategorie').value,
                wert: wert
            };

            const method = editId ? 'PUT' : 'POST';
            const url = editId ? '/api/transactions/' + editId : '/api/transactions';

            fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })
            .then(() => {
                modal.style.display = 'none';
                form.reset();
                delete form.dataset.editId;
                document.querySelector('.modal-header').textContent = 'New Transaction';
                loadTransactions();
                document.dispatchEvent(new Event('dataUpdated'));
            });
        });

        function deleteTransaction(id) {
            fetch('/api/transactions/' + id, { method: 'DELETE' })
                .then(() => {
                    loadTransactions();
                    document.dispatchEvent(new Event('dataUpdated'));
                });
        }

        btnAdd.addEventListener('click', function() {
            form.reset();
            delete form.dataset.editId;
            document.querySelector('.modal-header').textContent = 'New Transaction';
            modal.style.display = 'block';
        });
        
        if (btnCancel) {
            btnCancel.addEventListener('click', () => modal.style.display = 'none');
        }

        window.addEventListener('click', (e) => {
            if (e.target == modal) modal.style.display = 'none';
        });

        loadTransactions();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();