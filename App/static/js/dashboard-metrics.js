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

        // Add click listeners to cards for chart filtering
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
            
            // Quarterly view by weeks (13 weeks)
            labels = Array.from({length: 13}, (_, i) => `W${i + 1}`);
            bucketType = 'quarter_week';
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

        revenue = new Array(labels.length).fill(null);
        expenses = new Array(labels.length).fill(null);

        // Find current bucket index to avoid showing 0 for future dates
        let currentBucketIdx = -1;
        if (timeframe === 'week') {
            currentBucketIdx = (now.getDay() + 6) % 7;
        } else if (timeframe === 'month') {
            currentBucketIdx = now.getDate() - 1;
        } else if (timeframe === 'year' || timeframe === 'last_year') {
            currentBucketIdx = timeframe === 'year' ? now.getMonth() : 12; // All months for last year
        } else if (timeframe.includes('Q')) {
             const year = parseInt(timeframe.substring(0, 4));
             if (year < now.getFullYear()) currentBucketIdx = 13;
             else if (year > now.getFullYear()) currentBucketIdx = -1;
             else {
                const q = parseInt(timeframe.charAt(5));
                const qStart = new Date(year, (q-1)*3, 1);
                const qEnd = new Date(year, q*3, 0);
                if (now >= qStart && now <= qEnd) {
                    currentBucketIdx = Math.floor((now - qStart) / (7 * 24 * 60 * 60 * 1000));
                } else if (now > qEnd) currentBucketIdx = 13;
             }
        }

        // Initialize occurring buckets with 0
        for(let i=0; i<=currentBucketIdx && i<labels.length; i++) {
            revenue[i] = 0;
            expenses[i] = 0;
        }

        data.forEach(t => {
            const tDate = new Date(t.timestamp);
            if (tDate >= startDate && tDate <= endDate) {
                let idx = -1;
                if (bucketType === 'month') {
                    if (timeframe === 'year' || timeframe === 'last_year') {
                        idx = tDate.getMonth();
                    } else {
                        // Custom range months logic
                        const monthsDiff = (tDate.getFullYear() - startDate.getFullYear()) * 12 + (tDate.getMonth() - startDate.getMonth());
                        idx = monthsDiff;
                    }
                } else if (bucketType === 'quarter_week') {
                    // Weekly aggregation for quarters
                    const weekDiff = Math.floor((tDate - startDate) / (7 * 24 * 60 * 60 * 1000));
                    idx = Math.min(weekDiff, 12); // Limit to 13 weeks (0-12)
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
                    if (val > 0) revenue[idx] = (revenue[idx] || 0) + val;
                    else expenses[idx] = (expenses[idx] || 0) + Math.abs(val);
                }
            }
        });

        const totals = {
            revenue: revenue.slice(0, currentBucketIdx + 1).reduce((a, b) => a + (b || 0), 0),
            expenses: expenses.slice(0, currentBucketIdx + 1).reduce((a, b) => a + (b || 0), 0)
        };
        totals.surplus = totals.revenue - totals.expenses;

        // Propagate last values to future buckets for horizontal lines (visual only)
        if (currentBucketIdx >= 0 && currentBucketIdx < labels.length) {
            const lastRev = revenue[currentBucketIdx] || 0;
            const lastExp = expenses[currentBucketIdx] || 0;
            for (let i = currentBucketIdx + 1; i < labels.length; i++) {
                revenue[i] = lastRev;
                expenses[i] = lastExp;
            }
        }

        return { chart: { labels, revenue, expenses, currentBucketIdx }, totals };
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

        const getSegment = () => ({
            borderDash: ctx => {
                const todayIdx = myChart ? myChart.options.plugins.todayLine?.index : chartData.currentBucketIdx;
                return (todayIdx !== undefined && todayIdx >= 0 && ctx.p0.parsed.x >= todayIdx) ? [6, 4] : undefined;
            }
        });

        const commonPointStyles = {
            pointBackgroundColor: (ctx) => ctx.dataset.borderColor,
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6,
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderWidth: 3
        };

        const chartDatasets = [
            { 
                label: 'Revenue', data: chartData.revenue, borderColor: '#6f42c1', 
                backgroundColor: 'rgba(111, 66, 193, 0.1)', fill: true, tension: 0.4, 
                segment: getSegment(), ...commonPointStyles 
            },
            { 
                label: 'Expenses', data: chartData.expenses, borderColor: '#e74c3c', 
                backgroundColor: 'rgba(231, 76, 60, 0.1)', fill: true, tension: 0.4, 
                segment: getSegment(), ...commonPointStyles 
            },
            { 
                label: 'Surplus', data: chartData.revenue.map((r, i) => (r === null && chartData.expenses[i] === null) ? null : (r || 0) - (chartData.expenses[i] || 0)), 
                borderColor: '#27ae60', tension: 0.4, borderWidth: 3, 
                segment: getSegment(), ...commonPointStyles 
            }
        ];

        if (myChart) {
            // Keep visibility status when data is updated
            myChart.data.datasets.forEach((ds, i) => {
                const newDs = chartDatasets[i];
                ds.data = newDs.data;
                ds.segment = newDs.segment;
                Object.assign(ds, commonPointStyles);
            });
            myChart.data.labels = chartData.labels;
            myChart.options.plugins.todayLine = { index: chartData.currentBucketIdx };
            myChart.update();
            updateCardStyles();
        }
        else {
            // Custom plugin to draw vertical line for today
            const todayLinePlugin = {
                id: 'todayLine',
                afterDraw: (chart, args, options) => {
                    const { ctx, chartArea: { top, bottom, left, right }, scales: { x } } = chart;
                    if (options.index === undefined || options.index < 0 || options.index >= chart.data.labels.length) return;
                    
                    const xPos = x.getPixelForValue(chart.data.labels[options.index]);
                    ctx.save();
                    ctx.beginPath();
                    ctx.lineWidth = 2;
                    ctx.setLineDash([6, 4]);
                    ctx.strokeStyle = '#64748b';
                    ctx.moveTo(xPos, top);
                    ctx.lineTo(xPos, bottom);
                    ctx.stroke();
                    
                    // Draw "Today" label
                    ctx.fillStyle = '#64748b';
                    ctx.font = 'bold 11px Arial';
                    ctx.textAlign = 'center';
                    ctx.fillText('TODAY', xPos, top - 12);
                    ctx.restore();
                }
            };

            myChart = new Chart(ctx, {
                type: 'line', 
                data: {
                    labels: chartData.labels,
                    datasets: chartDatasets
                },
                plugins: [todayLinePlugin],
                options: {
                    responsive: true, maintainAspectRatio: false,
                    layout: {
                        padding: {
                            top: 25 // Space for TODAY label
                        }
                    },
                    interaction: { mode: 'index', intersect: false },
                    scales: { y: { beginAtZero: true, ticks: { callback: (v) => '€' + v.toLocaleString() } } },
                    plugins: { 
                        todayLine: { index: chartData.currentBucketIdx },
                        legend: { position: 'bottom', onClick: (e, legendItem, legend) => {
                            const index = legendItem.datasetIndex;
                            const meta = legend.chart.getDatasetMeta(index);
                            meta.hidden = meta.hidden === null ? !legend.chart.data.datasets[index].hidden : null;
                            legend.chart.update();
                            updateCardStyles();
                        }}
                    }
                }
            });
            updateCardStyles();
        }
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();
