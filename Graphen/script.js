 const ctx = document.getElementById('myChart');

  new Chart(ctx, {
    type: 'line',
    data: {
      labels: ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'],
      datasets: [
        {
          label: 'Umsatz',
          data: [10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000, 15000],
          borderColor: '#667eea',
          borderWidth: 2,
          tension: 0.4
        },
        {
          label: 'Ausgaben',
          data: [6000, 6000, 6000, 6000, 6000, 6000, 6000, 6000, 6000, 6000, 6000, 12000],
          borderColor: '#e74c3c',
          borderWidth: 2,
          tension: 0.4
        },
        {
          label: 'Gewinn',
          data: [4000, 4000, 4000, 4000, 4000, 4000, 4000, 4000, 4000, 4000, 4000, 3000],
          borderColor: '#2ecc71',
          borderWidth: 2,
          tension: 0.4
        }
      ]
    },
    options: {
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            stepSize: 10000
          }
        }
      }
    }
  });
