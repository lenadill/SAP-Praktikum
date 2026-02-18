(function() {
    let myChart = null;
    let transactions = [];
    let currentCategory = 'all';

    function init() {
        const timeframeSelect = document.getElementById('chartTimeframeSelect');
        if (timeframeSelect) {
            timeframeSelect.addEventListener('change', updateDashboard);
        }

        // Listen for category changes from clicks in the list
        document.addEventListener('categoryChanged', (e) => {
            currentCategory = e.detail.category;
            fetchAndRefresh();
        });

        // Listen for transaction changes (add/edit/delete)
        document.addEventListener('dataUpdated', fetchAndRefresh);

        fetchAndRefresh();
    }

    function fetchAndRefresh() {
        let url = '/api/transactions?limit=10000';
        if (currentCategory !== 'all') {
            url += '&category=' + encodeURIComponent(currentCategory);
        }

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
        
        const getStartOfWeek = (d) => {
            const date = new Date(d);
            const day = date.getDay() || 7;
            if (day !== 1) date.setHours(-24 * (day - 1));
            return date;
        };

        if (timeframe === 'week') {
            labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
            revenue = new Array(7).fill(0);
            expenses = new Array(7).fill(0);
            const startOfWeek = getStartOfWeek(now);
            startOfWeek.setHours(0,0,0,0);
            data.forEach(t => {
                const tDate = new Date(t.timestamp);
                if (tDate >= startOfWeek && tDate.getFullYear() === now.getFullYear()) {
                    const dayIdx = (tDate.getDay() + 6) % 7;
                    const val = parseFloat(t.wert);
                    if (val > 0) revenue[dayIdx] += val;
                    else expenses[dayIdx] += Math.abs(val);
                }
            });
        } 
        else if (timeframe === 'month') {
            labels = ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5'];
            revenue = new Array(5).fill(0);
            expenses = new Array(5).fill(0);
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            data.forEach(t => {
                const tDate = new Date(t.timestamp);
                if (tDate >= startOfMonth && tDate.getMonth() === now.getMonth() && tDate.getFullYear() === now.getFullYear()) {
                    const weekIdx = Math.floor((tDate.getDate() - 1) / 7);
                    if (weekIdx < 5) {
                        const val = parseFloat(t.wert);
                        if (val > 0) revenue[weekIdx] += val;
                        else expenses[weekIdx] += Math.abs(val);
                    }
                }
            });
        }
        else if (timeframe === 'last_month') {
            labels = ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5'];
            revenue = new Array(5).fill(0);
            expenses = new Array(5).fill(0);
            const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            const targetMonth = lastMonthDate.getMonth();
            const targetYear = lastMonthDate.getFullYear();
            data.forEach(t => {
                const tDate = new Date(t.timestamp);
                if (tDate.getMonth() === targetMonth && tDate.getFullYear() === targetYear) {
                    const weekIdx = Math.floor((tDate.getDate() - 1) / 7);
                    const val = parseFloat(t.wert);
                    if (val > 0) revenue[weekIdx] += val;
                    else expenses[weekIdx] += Math.abs(val);
                }
            });
        }
        else if (timeframe === 'year') {
            labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            revenue = new Array(12).fill(0);
            expenses = new Array(12).fill(0);
            data.forEach(t => {
                const tDate = new Date(t.timestamp);
                if (tDate.getFullYear() === now.getFullYear()) {
                    const monthIdx = tDate.getMonth();
                    const val = parseFloat(t.wert);
                    if (val > 0) revenue[monthIdx] += val;
                    else expenses[monthIdx] += Math.abs(val);
                }
            });
        }
        else if (timeframe === 'last_year') {
            labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            revenue = new Array(12).fill(0);
            expenses = new Array(12).fill(0);
            const targetYear = now.getFullYear() - 1;
            data.forEach(t => {
                const tDate = new Date(t.timestamp);
                if (tDate.getFullYear() === targetYear) {
                    const monthIdx = tDate.getMonth();
                    const val = parseFloat(t.wert);
                    if (val > 0) revenue[monthIdx] += val;
                    else expenses[monthIdx] += Math.abs(val);
                }
            });
        }
        else if (timeframe.match(/^[0-9]{4}Q[1-4]$/)) {
            const year = parseInt(timeframe.substring(0, 4));
            const q = parseInt(timeframe.charAt(5));
            const startMonth = (q - 1) * 3;
            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            labels = monthNames.slice(startMonth, startMonth + 3);
            revenue = new Array(3).fill(0);
            expenses = new Array(3).fill(0);
            data.forEach(t => {
                const tDate = new Date(t.timestamp);
                if (tDate.getFullYear() === year) {
                    const m = tDate.getMonth();
                    if (m >= startMonth && m < startMonth + 3) {
                        const idx = m - startMonth;
                        const val = parseFloat(t.wert);
                        if (val > 0) revenue[idx] += val;
                        else expenses[idx] += Math.abs(val);
                    }
                }
            });
        }

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

    function getTodayXValue(timeframe) {
        const now = new Date();
        // Return index for discrete values or fractional for year/month
        if (timeframe === 'week') {
            return (now.getDay() + 6) % 7;
        } 
        else if (timeframe === 'month') {
            return (now.getDate() - 1) / 7;
        }
        else if (timeframe === 'year') {
            const month = now.getMonth();
            const daysInMonth = new Date(now.getFullYear(), month + 1, 0).getDate();
            return month + (now.getDate() - 1) / daysInMonth;
        }
        else if (timeframe.match(/^[0-9]{4}Q[1-4]$/)) {
            const year = parseInt(timeframe.substring(0, 4));
            const q = parseInt(timeframe.charAt(5));
            if (now.getFullYear() === year) {
                const monthInQ = now.getMonth() - (q - 1) * 3;
                if (monthInQ >= 0 && monthInQ < 3) {
                    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
                    return monthInQ + (now.getDate() - 1) / daysInMonth;
                }
            }
        }
        return null;
    }

    const todayLinePlugin = {
        id: 'todayLine',
        afterDraw: (chart) => {
            const pluginOptions = chart.options.plugins.todayLine;
            if (pluginOptions && pluginOptions.display && pluginOptions.xValue !== null) {
                const ctx = chart.ctx;
                const xAxis = chart.scales.x;
                const yAxis = chart.scales.y;
                
                // Get pixel position - for category scales, getPixelForValue works with index or label
                // For fractional values between categories, we interpolate manually
                let xPos;
                const index = pluginOptions.xValue;
                if (Number.isInteger(index)) {
                    xPos = xAxis.getPixelForTick(index);
                } else {
                    const low = Math.floor(index);
                    const high = Math.ceil(index);
                    const pLow = xAxis.getPixelForTick(low);
                    const pHigh = xAxis.getPixelForTick(high);
                    xPos = pLow + (pHigh - pLow) * (index - low);
                }

                if (isNaN(xPos)) return;

                ctx.save();
                ctx.beginPath();
                ctx.moveTo(xPos, yAxis.top);
                ctx.lineTo(xPos, yAxis.bottom);
                ctx.lineWidth = 3;
                ctx.strokeStyle = '#8e44ad'; // Solid bright purple
                ctx.stroke();
                
                // Today Label
                ctx.fillStyle = '#8e44ad';
                ctx.font = 'bold 12px Segoe UI';
                ctx.textAlign = 'center';
                ctx.fillText('TODAY', xPos, yAxis.top - 8);
                
                ctx.restore();
            }
        }
    };

    // Register plugin globally
    if (typeof Chart !== 'undefined') {
        Chart.register(todayLinePlugin);
    }

    function updateChart(chartData) {
        const ctx = document.getElementById('myChart');
        if (!ctx) return;
        const timeframe = document.getElementById('chartTimeframeSelect')?.value || 'year';
        const todayX = getTodayXValue(timeframe);
        
        console.log(`Updating chart. TodayX index: ${todayX} for timeframe: ${timeframe}`);

        const data = {
            labels: chartData.labels,
            datasets: [
                { label: 'Revenue', data: chartData.revenue, borderColor: '#6f42c1', backgroundColor: 'rgba(111, 66, 193, 0.1)', fill: true, tension: 0.4 },
                { label: 'Expenses', data: chartData.expenses, borderColor: '#e74c3c', backgroundColor: 'rgba(231, 76, 60, 0.1)', fill: true, tension: 0.4 },
                { label: 'Surplus', data: chartData.revenue.map((r, i) => r - chartData.expenses[i]), borderColor: '#27ae60', tension: 0.4 }
            ]
        };

        if (myChart) { 
            myChart.data = data; 
            myChart.options.plugins.todayLine.xValue = todayX;
            myChart.update(); 
        }
        else {
            myChart = new Chart(ctx, {
                type: 'line', 
                data: data,
                options: {
                    responsive: true, maintainAspectRatio: false,
                    layout: {
                        padding: {
                            top: 25
                        }
                    },
                    interaction: { mode: 'index', intersect: false },
                    scales: { 
                        y: { beginAtZero: true, ticks: { callback: (v) => '€' + v.toLocaleString() } }
                    },
                    plugins: { 
                        legend: { position: 'bottom' },
                        todayLine: {
                            display: true,
                            xValue: todayX
                        }
                    }
                }
            });
        }
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();
