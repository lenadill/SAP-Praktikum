document.addEventListener('DOMContentLoaded', function() {
  // Data for different time periods
  const chartData = {
    week: {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      revenue: [2000, 2200, 1900, 2500, 2800, 1500, 1200],
      outgoings: [1200, 1300, 1100, 1400, 1600, 900, 800],
    },
    month: {
      labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
      revenue: [8000, 9500, 10200, 8500],
      outgoings: [5000, 5500, 6000, 4800],
    },
    year: {
      labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
      revenue: [9000, 8000, 9000, 10000, 10000, 9000, 11000, 5000, 12000, 10000, 10000, 15000],
      outgoings: [8000, 6000, 6000, 6000, 6000, 6000, 6000, 6000, 6000, 6000, 6000, 12000],

    },
    '2025Q1': {
      labels: ['January', 'February', 'March'],
      revenue: [9000, 8000, 9000],
      outgoings: [8000, 6000, 6000],
    },
    '2025Q2': {
      labels: ['April', 'May', 'June'],
      revenue: [10000, 10000, 9000],
      outgoings: [6000, 6000, 6000],
    },
    '2025Q3': {
      labels: ['July', 'August', 'September'],
      revenue: [11000, 5000, 12000],
      outgoings: [6000, 6000, 6000],
    },
    '2025Q4': {
      labels: ['October', 'November', 'December'],
      revenue: [10000, 10000, 15000],
      outgoings: [6000, 6000, 12000],
    }
  };

  const ctx = document.getElementById('myChart');
  if (!ctx) {
    console.error('Canvas with id "myChart" not found');
    return;
  }

  // Create chart instance
  const chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: chartData.year.labels,
      datasets: [
        {
          label: 'Revenue',
          data: chartData.year.revenue,
          borderColor: '#6f42c1',
          borderWidth: 2,
          tension: 0.4,
          pointRadius: 3,
          pointBackgroundColor: '#6f42c1'
        },
        {
          label: 'Expenses',
          data: chartData.year.outgoings,
          borderColor: '#e74c3c',
          borderWidth: 2,
          tension: 0.4,
          pointRadius: 3,
          pointBackgroundColor: '#e74c3c'
        },
        {
          label: 'Surplus',
          data: chartData.year.revenue.map((val, idx) => val - chartData.year.outgoings[idx]),
          borderColor: '#27ae60',
          borderWidth: 2,
          tension: 0.4,
          pointRadius: 3,
          pointBackgroundColor: '#27ae60'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function(value) {
              return '€' + value.toLocaleString('en-US');
            }
          }
        }
      },
      plugins: {
        legend: {
          display: true,
          position: 'bottom'
        }
      }
    }
  });

  // Handle timeframe selector change
  const selector = document.getElementById('chartTimeframeSelect');
  if (selector) {
    selector.addEventListener('change', function(e) {
      const timeframe = e.target.value;
      const data = chartData[timeframe];

      // Update chart data
      chart.data.labels = data.labels;
      chart.data.datasets[0].data = data.revenue;
      chart.data.datasets[1].data = data.outgoings;
      chart.data.datasets[2].data = data.revenue.map((val, idx) => val - data.outgoings[idx]);

      chart.update();
    });
  }
});
