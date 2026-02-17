// Beispiel-Daten (später mit Felix Formular verbinden)
let entries = [
    { date: '2026-02-17', amount: 500, category: 'Fixkosten' },
    { date: '2026-02-16', amount: 2000, category: 'Gehaltabrechnung' },
    { date: '2026-02-15', amount: 150, category: 'Fixkosten' },
    { date: '2026-02-14', amount: 2500, category: 'Gehaltabrechnung' },
    { date: '2026-02-13', amount: 300, category: 'Fixkosten' },
    { date: '2026-02-12', amount: 1800, category: 'Gehaltabrechnung' },
    { date: '2026-02-11', amount: 100, category: 'Fixkosten' },
    { date: '2026-02-10', amount: 2200, category: 'Gehaltabrechnung' },
    { date: '2026-02-09', amount: 80, category: 'Fixkosten' },
    { date: '2026-02-08', amount: 2000, category: 'Gehaltabrechnung' },
    { date: '2026-02-07', amount: 50, category: 'Fixkosten' }
];


let currentSort = 'date';


function capitalize(str) {
    if (!str) return "";
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function renderTable() {
    const tbody = document.getElementById('tableBody');
    tbody.innerHTML = '';

    entries.sort((a, b) => {
        if (currentSort === 'date') return new Date(b.date) - new Date(a.date);
        if (currentSort === 'amount') return b.amount - a.amount;
        if (currentSort === 'category') return a.category.localeCompare(b.category);
    });

    const last10 = entries.slice(0, 10);

    last10.forEach(entry => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${entry.date}</td>
            <td>${entry.amount}</td>
            <td>${entry.category}</td>
        `;
        tbody.appendChild(row);
    });
}


document.getElementById('sortButton').addEventListener('click', () => {

    if (currentSort === 'date') currentSort = 'amount';
    else if (currentSort === 'amount') currentSort = 'category';
    else currentSort = 'date';

    document.getElementById('sortButton').textContent = `Sortieren: ${capitalize(currentSort)} ▼`;

    renderTable(); 
});

renderTable();
