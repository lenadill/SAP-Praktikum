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

        const cards = document.querySelectorAll('.card[data-card-type]');
        cards.forEach(card => {
            card.style.cursor = 'pointer';
            card.addEventListener('click', () => {
                const type = card.dataset.cardType;
                toggleChartDataset(type);
            });
        });

        fetchAndRefresh();
    }

    function toggleChartDataset(type) {
        if (!myChart) return;
        const typeMap = { 'revenue': 0, 'expenses': 1, 'surplus': 2 };
        const index = typeMap[type];
        if (index !== undefined) {
            const meta = myChart.getDatasetMeta(index);
            meta.hidden = meta.hidden === null ? !myChart.data.datasets[index].hidden : null;
            myChart.update();
            updateCardStyles();
        }
    }

    function updateCardStyles() {
        if (!myChart) return;
        const cards = document.querySelectorAll('.card[data-card-type]');
        const typeMap = { 'revenue': 0, 'expenses': 1, 'surplus': 2 };
        cards.forEach(card => {
            const type = card.dataset.cardType;
            const index = typeMap[type];
            const isHidden = myChart.getDatasetMeta(index).hidden;
            if (isHidden) {
                card.style.opacity = '0.4';
                card.style.transform = 'scale(0.95)';
                card.style.filter = 'grayscale(0.5)';
            } else {
                card.style.opacity = '1';
                card.style.transform = 'scale(1)';
                card.style.filter = 'none';
            }
            card.style.transition = 'all 0.3s ease';
        });
    }

    function fetchAndRefresh() {
        let url = '/api/transactions?limit=10000&t=' + Date.now();
        if (currentCategory !== 'all') url += '&category=' + encodeURIComponent(currentCategory);

        fetch(url)
            .then(res => res.json())
            .then(data => {
                transactions = data.eintraege || [];
                console.log("Dashboard Metrics: Fetched " + transactions.length + " transactions.");
                updateDashboard();
            })
            .catch(err => console.error("Error fetching transactions:", err));
    }

    function updateDashboard() {
        const timeframe = document.getElementById('chartTimeframeSelect')?.value || 'year';
        console.log("Dashboard Metrics: Updating for timeframe:", timeframe);
        const processedData = processData(transactions, timeframe);
        updateCards(processedData.totals);
        updateChart(processedData.chart);
    }

    function processData(data, timeframe) {
        const now = new Date();
        const nowYear = now.getFullYear();
        let labels = [];
        let revenue = [];
        let expenses = [];
        let startDate, endDate;
        let bucketType = 'day';

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
        else if (timeframe === 'year' || timeframe === 'last_year') {
            const targetYear = timeframe === 'year' ? nowYear : nowYear - 1;
            startDate = new Date(targetYear, 0, 1);
            endDate = new Date(targetYear, 11, 31, 23, 59, 59, 999);
            labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            bucketType = 'month';
        }
        else if (timeframe.match(/^[0-9]{4}Q[1-4]$/)) {
            const year = parseInt(timeframe.substring(0, 4));
            const q = parseInt(timeframe.charAt(5));
            startDate = new Date(year, (q - 1) * 3, 1);
            endDate = new Date(year, q * 3, 0, 23, 59, 59, 999);
            labels = Array.from({length: 13}, (_, i) => `W${i + 1}`);
            bucketType = 'quarter_week';
        }
        else if (timeframe === 'custom') {
            const sStr = document.getElementById('chartStartDate').value;
            const eStr = document.getElementById('chartEndDate').value;
            startDate = sStr ? new Date(sStr) : new Date(now.getFullYear(), 0, 1);
            endDate = eStr ? new Date(eStr) : new Date();
            endDate.setHours(23, 59, 59, 999);
            const diffDays = Math.ceil(Math.abs(endDate - startDate) / (1000 * 60 * 60 * 24));
            if (diffDays > 60) {
                bucketType = 'month';
                let curr = new Date(startDate); curr.setDate(1);
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

        let matchedCount = 0;
        data.forEach(t => {
            const tDate = new Date(t.timestamp);
            if (tDate >= startDate && tDate <= endDate) {
                matchedCount++;
                let idx = -1;
                if (bucketType === 'month') {
                    if (timeframe === 'year' || timeframe === 'last_year') idx = tDate.getMonth();
                    else idx = (tDate.getFullYear() - startDate.getFullYear()) * 12 + (tDate.getMonth() - startDate.getMonth());
                } else if (bucketType === 'quarter_week') {
                    idx = Math.min(Math.floor((tDate - startDate) / (7 * 24 * 60 * 60 * 1000)), 12);
                } else {
                    if (timeframe === 'week') idx = (tDate.getDay() + 6) % 7;
                    else if (timeframe === 'month') idx = tDate.getDate() - 1;
                    else idx = Math.floor((tDate - startDate) / (1000 * 60 * 60 * 24));
                }
                if (idx >= 0 && idx < labels.length) {
                    const val = parseFloat(t.wert);
                    if (val > 0) revenue[idx] += val; else expenses[idx] += Math.abs(val);
                }
            }
        });
        console.log("Dashboard Metrics: Matched " + matchedCount + " transactions for range:", startDate.toISOString(), "to", endDate.toISOString());

        let currentBucketIdx = -1;
        if (timeframe === 'year') currentBucketIdx = now.getMonth();
        else if (timeframe === 'last_year') currentBucketIdx = 12; // End of year
        else if (timeframe === 'month') currentBucketIdx = now.getDate() - 1;
        else if (timeframe === 'week') currentBucketIdx = (now.getDay() + 6) % 7;
        else if (timeframe.includes('Q')) {
            const y = parseInt(timeframe.substring(0,4));
            if (y < nowYear) currentBucketIdx = 13;
            else if (y > nowYear) currentBucketIdx = -1;
            else currentBucketIdx = Math.floor((now - startDate) / (7 * 24 * 60 * 60 * 1000));
        }

        const totals = {
            revenue: revenue.reduce((a, b) => a + b, 0),
            expenses: expenses.reduce((a, b) => a + b, 0)
        };
        totals.surplus = totals.revenue - totals.expenses;

        return { chart: { labels, revenue, expenses, currentBucketIdx }, totals };
    }

    function updateCards(totals) {
        document.querySelectorAll('.card[data-card-type="revenue"] .card-value').forEach(el => el.textContent = totals.revenue.toLocaleString('de-DE', { minimumFractionDigits: 2 }) + ' €');
        document.querySelectorAll('.card[data-card-type="expenses"] .card-value').forEach(el => el.textContent = totals.expenses.toLocaleString('de-DE', { minimumFractionDigits: 2 }) + ' €');
        document.querySelectorAll('.card[data-card-type="surplus"] .card-value').forEach(el => el.textContent = totals.surplus.toLocaleString('de-DE', { minimumFractionDigits: 2 }) + ' €');
        
        const max = Math.max(totals.revenue, totals.expenses, Math.abs(totals.surplus), 1);
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
        const getSegment = () => ({ borderDash: ctx => (chartData.currentBucketIdx >= 0 && ctx.p0.parsed.x >= chartData.currentBucketIdx) ? [6, 4] : undefined });
        const common = { fill: true, tension: 0.4, segment: getSegment(), pointRadius: 4, pointHoverRadius: 6 };
        const datasets = [
            { label: 'Revenue', data: chartData.revenue, borderColor: '#6f42c1', backgroundColor: 'rgba(111, 66, 193, 0.1)', ...common },
            { label: 'Expenses', data: chartData.expenses, borderColor: '#e74c3c', backgroundColor: 'rgba(231, 76, 60, 0.1)', ...common },
            { label: 'Surplus', data: chartData.revenue.map((r, i) => r - chartData.expenses[i]), borderColor: '#27ae60', ...common, fill: false, borderWidth: 3 }
        ];

        if (myChart) {
            myChart.data.labels = chartData.labels;
            myChart.data.datasets.forEach((ds, i) => { ds.data = datasets[i].data; ds.segment = datasets[i].segment; });
            if (!myChart.options.plugins) myChart.options.plugins = {};
            myChart.options.plugins.todayLine = { index: chartData.currentBucketIdx };
            myChart.update();
            updateCardStyles();
        } else {
            const todayLinePlugin = {
                id: 'todayLine',
                afterDraw: (chart, args, options) => {
                    if (options.index === undefined || options.index < 0 || options.index >= chart.data.labels.length) return;
                    const { ctx, chartArea: { top, bottom }, scales: { x } } = chart;
                    const label = chart.data.labels[options.index];
                    const xPos = x.getPixelForValue(label);
                    ctx.save(); ctx.beginPath(); ctx.lineWidth = 2; ctx.setLineDash([6, 4]); ctx.strokeStyle = '#64748b';
                    ctx.moveTo(xPos, top); ctx.lineTo(xPos, bottom); ctx.stroke();
                    ctx.fillStyle = '#64748b'; ctx.font = 'bold 11px Arial'; ctx.textAlign = 'center'; ctx.fillText('TODAY', xPos, top - 12); ctx.restore();
                }
            };
            myChart = new Chart(ctx, { 
                type: 'line', 
                data: { labels: chartData.labels, datasets }, 
                plugins: [todayLinePlugin], 
                options: { 
                    responsive: true, 
                    maintainAspectRatio: false, 
                    layout: { padding: { top: 25 } }, 
                    plugins: {
                        legend: { position: 'bottom' },
                        todayLine: { index: chartData.currentBucketIdx }
                    },
                    scales: { y: { beginAtZero: true } } 
                } 
            });
        }
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
