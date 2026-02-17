import { calc_turnover } from './graph_logic.js';

const revenue = [7000, 8000, 9000, 10000, 10000, 9000, 11000, 5000, 12000, 10000, 10000, 15000]
const outgoings = [8000, 6000, 6000, 6000, 6000, 6000, 6000, 6000, 6000, 6000, 6000, 12000]
const turnover = calc_turnover(revenue,outgoings)
const ctx = document.getElementById('myChart');

  new Chart(ctx, {
    type: 'line',
    data: {
      labels: ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'],
      datasets: [
        {
          label: 'Umsatz',
          data: revenue,
          borderColor: '#667eea',
          borderWidth: 2,
          tension: 0.4
        },
        {
          label: 'Ausgaben',
          data: outgoings,
          borderColor: '#e74c3c',
          borderWidth: 2,
          tension: 0.4
        },
        {
          label: 'Gewinn',
          data: turnover,
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