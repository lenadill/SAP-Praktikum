content = """(function() {
    const tableBody = document.querySelector('.transactions-table tbody');
    const modal = document.getElementById('transactionModal');
    const btnAdd = document.getElementById('btnAddRecipt');
    const btnCancel = document.getElementById('btnCancel');
    const form = document.getElementById('transactionForm');

    function loadTransactions() {
        fetch('/api/transactions')
            .then(res => res.json())
            .then(data => {
                renderTable(data.eintraege);
            })
            .catch(err => console.error("Fehler beim Laden:", err));
    }

    function renderTable(entries) {
        if (!entries || entries.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="4" class="empty">Keine Einträge</td></tr>';
            return;
        }

        entries.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        tableBody.innerHTML = '';
        entries.forEach(e => {
            const tr = document.createElement('tr');
            const wertNum = parseFloat(e.wert);
            const color = wertNum >= 0 ? '#28a745' : '#dc3545';
            const symbol = wertNum >= 0 ? '+' : '';

            tr.innerHTML = `
                <td>${e.kategorie}</td>
                <td style="color:${color}; font-weight:bold">${symbol}${wertNum.toFixed(2)}€</td>
                <td>${new Date(e.timestamp).toLocaleDateString('de-DE')}</td>
                <td style="text-align:right">
                    <button class="delete-btn" style="background:none; border:none; cursor:pointer; color:#ff4d4d; font-size:1.2em">×</button>
                </td>
            `;

            tr.querySelector('.delete-btn').addEventListener('click', function() {
                if (confirm('Diese Transaktion löschen?')) {
                    deleteTransaction(e.id, tr);
                }
            });

            tableBody.appendChild(tr);
        });
    }

    form.addEventListener('submit', function(e) {
        e.preventDefault();
        const payload = {
            name: document.getElementById('tName').value,
            kategorie: document.getElementById('tKategorie').value,
            wert: parseFloat(document.getElementById('tWert').value)
        };

        fetch('/api/transactions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })
        .then(() => {
            modal.style.display = 'none';
            form.reset();
            loadTransactions();
            document.dispatchEvent(new Event('dataUpdated'));
        });
    });

    function deleteTransaction(id, rowElement) {
        fetch('/api/transactions/' + id, { method: 'DELETE' })
            .then(() => {
                rowElement.remove();
                loadTransactions();
                document.dispatchEvent(new Event('dataUpdated'));
            });
    }

    btnAdd.addEventListener('click', () => modal.style.display = 'block');
    btnCancel.addEventListener('click', () => modal.style.display = 'none');

    // Initiales Laden (auch wenn DOMContentLoaded schon vorbei sein könnte)
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadTransactions);
    } else {
        loadTransactions();
    }
})();"""

with open("../App/static/js/transactions.js", "w", encoding="utf-8") as f:
    f.write(content)
