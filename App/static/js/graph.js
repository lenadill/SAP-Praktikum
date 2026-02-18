document.addEventListener('DOMContentLoaded', async function() {
    const ctx = document.getElementById('myChart');
    if (!ctx) return;

    let chart;
    const selector = document.getElementById('chartTimeframeSelect');

    async function updateChart() {
        await window.DataManager.fetchTransactions();
        const timeframe = selector ? selector.value : 'year';
        const data = window.DataManager.getAggregatedData(timeframe);

        if (!chart) {
            chart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: data.labels,
                    datasets: [
                        { label: 'Revenue', data: data.revenue, borderColor: '#6f42c1', tension: 0.4 },
                        { label: 'Expenses', data: data.outgoings, borderColor: '#e74c3c', tension: 0.4 },
                        { label: 'Surplus', data: data.labels.map((_, i) => data.revenue[i] - data.outgoings[i]), borderColor: '#27ae60', tension: 0.4 }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: { y: { beginAtZero: true } }
                }
            });
        } else {
            chart.data.labels = data.labels;
            chart.data.datasets[0].data = data.revenue;
            chart.data.datasets[1].data = data.outgoings;
            chart.data.datasets[2].data = data.labels.map((_, i) => data.revenue[i] - data.outgoings[i]);
            chart.update();
        }
    }

    if (selector) {
        selector.addEventListener('change', updateChart);
    }

    // Höre auf Updates von transactions.js
    document.addEventListener('dataUpdated', updateChart);

    // Initiales Laden
    updateChart();
});