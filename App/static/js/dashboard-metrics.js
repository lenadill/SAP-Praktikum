(function() {
    let myChart = null;
    let transactions = [];
    let currentCategory = 'all';

    function init() {
        const timeframeSelect = document.getElementById('chartTimeframeSelect');
        const customRange = document.getElementById('customDateRange');
        const startDateInput = document.getElementById('chartStartDate');
        const endDateInput = document.getElementById('chartEndDate');

        if (timeframeSelect) {
            timeframeSelect.addEventListener('change', () => {
                if (timeframeSelect.value === 'custom') {
                    customRange.style.display = 'flex';
                } else {
                    customRange.style.display = 'none';
                    updateDashboard();
                }
            });
        }

        [startDateInput, endDateInput].forEach(input => {
            if (input) input.addEventListener('change', updateDashboard);
        });

        document.addEventListener('categoryChanged', (e) => {
            currentCategory = e.detail.category;
            fetchAndRefresh();
        });

        document.addEventListener('dataUpdated', fetchAndRefresh);
        fetchAndRefresh();
    }

    function fetchAndRefresh() {
        let url = '/api/transactions?limit=10000';
        if (currentCategory !== 'all') url += '&category=' + encodeURIComponent(currentCategory);

        fetch(url)
            .then(res => res.json())
            .then(data => {
                transactions = data.eintraege || [];
                updateDashboard();
            })
            .catch(err => console.error("Error fetching transactions for dashboard:", err));
    }

    function updateDashboard() {
        const timeframe = document.getElementById('chartTimeframeSelect')?.value || 'year';
        const processedData = processData(transactions, timeframe);
        updateCards(processedData.totals);
        updateChart(processedData.chart);
    }

    function processData(data, timeframe) {
        const now = new Date();
        let labels = [];
        let revenue = [];
        let expenses = [];
        
        let startDate, endDate;
        let bucketType = 'day'; // 'day' or 'month'

        if (timeframe === 'week') {
            const day = now.getDay() || 7;
            startDate = new Date(now);
            startDate.setDate(now.getDate() - (day - 1));
            startDate.setHours(0,0,0,0);
            endDate = new Date(startDate);
            endDate.setDate(startDate.getDate() + 6);
            endDate.setHours(23,59,59,999);
            labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        } 
        else if (timeframe === 'month') {
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
            const daysInMonth = endDate.getDate();
            for (let i = 1; i <= daysInMonth; i++) labels.push(i.toString());
        }
        else if (timeframe === 'year') {
            startDate = new Date(now.getFullYear(), 0, 1);
            endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
            labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            bucketType = 'month';
        }
        else if (timeframe === 'last_year') {
            startDate = new Date(now.getFullYear() - 1, 0, 1);
            endDate = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59, 999);
            labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            bucketType = 'month';
        }
        else if (timeframe.match(/^[0-9]{4}Q[1-4]$/)) {
            const year = parseInt(timeframe.substring(0, 4));
            const q = parseInt(timeframe.charAt(5));
            startDate = new Date(year, (q - 1) * 3, 1);
            endDate = new Date(year, q * 3, 0, 23, 59, 59, 999);
            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            labels = monthNames.slice((q - 1) * 3, q * 3);
            bucketType = 'month';
        }
        else if (timeframe === 'custom') {
            const sStr = document.getElementById('chartStartDate').value;
            const eStr = document.getElementById('chartEndDate').value;
            
            // Standard: Seit Jahresbeginn bis heute
            startDate = sStr ? new Date(sStr) : new Date(now.getFullYear(), 0, 1);
            endDate = eStr ? new Date(eStr) : new Date();
            endDate.setHours(23, 59, 59, 999);

            const diffTime = Math.abs(endDate - startDate);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays > 60) {
                bucketType = 'month';
                let curr = new Date(startDate);
                curr.setDate(1); // Start at beginning of month for clean buckets
                while (curr <= endDate) {
                    labels.push(curr.toLocaleString('en-US', { month: 'short', year: '2-digit' }));
                    curr.setMonth(curr.getMonth() + 1);
                }
            } else {
                bucketType = 'day';
                let curr = new Date(startDate);
                while (curr <= endDate) {
                    labels.push(curr.getDate() + '.' + (curr.getMonth() + 1) + '.');
                    curr.setDate(curr.getDate() + 1);
                }
            }
        }

        revenue = new Array(labels.length).fill(0);
        expenses = new Array(labels.length).fill(0);

        data.forEach(t => {
            const tDate = new Date(t.timestamp);
            if (tDate >= startDate && tDate <= endDate) {
                let idx = -1;
                if (bucketType === 'month') {
                    if (timeframe === 'year' || timeframe === 'last_year' || timeframe.includes('Q')) {
                        idx = tDate.getMonth() % (timeframe.includes('Q') ? 3 : 12);
                    } else {
                        // Custom range months logic
                        const monthsDiff = (tDate.getFullYear() - startDate.getFullYear()) * 12 + (tDate.getMonth() - startDate.getMonth());
                        idx = monthsDiff;
                    }
                } else {
                    if (timeframe === 'week') {
                        idx = (tDate.getDay() + 6) % 7;
                    } else if (timeframe === 'month') {
                        idx = tDate.getDate() - 1;
                    } else {
                        // Custom range days
                        const daysDiff = Math.floor((tDate - startDate) / (1000 * 60 * 60 * 24));
                        idx = daysDiff;
                    }
                }

                if (idx >= 0 && idx < labels.length) {
                    const val = parseFloat(t.wert);
                    if (val > 0) revenue[idx] += val;
                    else expenses[idx] += Math.abs(val);
                }
            }
        });

        const totals = {
            revenue: revenue.reduce((a, b) => a + b, 0),
            expenses: expenses.reduce((a, b) => a + b, 0)
        };
        totals.surplus = totals.revenue - totals.expenses;
        return { chart: { labels, revenue, expenses }, totals };
    }

    function updateCards(totals) {
        const format = (v) => '€' + v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        const revEl = document.querySelector('.card[data-card-type="revenue"] .card-value');
        const expEl = document.querySelector('.card[data-card-type="expenses"] .card-value');
        const surEl = document.querySelector('.card[data-card-type="surplus"] .card-value');
        if (revEl) { revEl.textContent = format(totals.revenue); revEl.style.color = '#6f42c1'; }
        if (expEl) { expEl.textContent = format(totals.expenses); expEl.style.color = totals.expenses > 0 ? '#dc3545' : '#333'; }
        if (surEl) { surEl.textContent = format(totals.surplus); surEl.style.color = totals.surplus >= 0 ? '#28a745' : '#dc3545'; }
        const max = Math.max(totals.revenue, totals.expenses, 1);
        const revBar = document.querySelector('.fill-revenue');
        const expBar = document.querySelector('.fill-expenses');
        const surBar = document.querySelector('.fill-surplus');
        if (revBar) revBar.style.width = (totals.revenue / max * 100) + '%';
        if (expBar) expBar.style.width = (totals.expenses / max * 100) + '%';
        if (surBar) surBar.style.width = (Math.max(0, totals.surplus) / max * 100) + '%';
    }

    function updateChart(chartData) {
        const ctx = document.getElementById('myChart');
        if (!ctx) return;
        const data = {
            labels: chartData.labels,
            datasets: [
                { label: 'Revenue', data: chartData.revenue, borderColor: '#6f42c1', backgroundColor: 'rgba(111, 66, 193, 0.1)', fill: true, tension: 0.4 },
                { label: 'Expenses', data: chartData.expenses, borderColor: '#e74c3c', backgroundColor: 'rgba(231, 76, 60, 0.1)', fill: true, tension: 0.4 },
                { label: 'Surplus', data: chartData.revenue.map((r, i) => r - chartData.expenses[i]), borderColor: '#27ae60', tension: 0.4, borderWidth: 3 }
            ]
        };
        if (myChart) { myChart.data = data; myChart.update(); }
        else {
            myChart = new Chart(ctx, {
                type: 'line', data: data,
                options: {
                    responsive: true, maintainAspectRatio: false,
                    interaction: { mode: 'index', intersect: false },
                    scales: { y: { beginAtZero: true, ticks: { callback: (v) => '€' + v.toLocaleString() } } },
                    plugins: { legend: { position: 'bottom' } }
                }
            });
        }
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();
