document.addEventListener('DOMContentLoaded', function() {
  // Data for different time periods - same as in graph.js
  const chartData = {
    week: {
      labels: ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'],
      revenue: [2000, 2200, 1900, 2500, 2800, 1500, 1200],
      outgoings: [1200, 1300, 1100, 1400, 1600, 900, 800],
    },
    month: {
      labels: ['Woche 1', 'Woche 2', 'Woche 3', 'Woche 4'],
      revenue: [8000, 9500, 10200, 8500],
      outgoings: [5000, 5500, 6000, 4800],
    },
    year: {
      labels: ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'],
      revenue: [9000, 8000, 9000, 10000, 10000, 9000, 11000, 5000, 12000, 10000, 10000, 15000],
      outgoings: [8000, 6000, 6000, 6000, 6000, 6000, 6000, 6000, 6000, 6000, 6000, 12000],
    }
  };

  // Function to calculate total surplus
  function calculateTotalSurplus(timeframe) {
    const data = chartData[timeframe];
    if (!data) return 0;
    
    let totalSurplus = 0;
    for (let i = 0; i < data.revenue.length; i++) {
      totalSurplus += data.revenue[i] - data.outgoings[i];
    }
    return totalSurplus;
  }

  // Function to format currency
  function formatCurrency(value) {
    return value.toLocaleString('de-DE');
  }

  // Function to update card with surplus data
  function updateSurplusCard(timeframe) {
    const surplus = calculateTotalSurplus(timeframe);
    const cardDataElement = document.querySelector('.card .data p');
    
    if (cardDataElement) {
      cardDataElement.textContent = formatCurrency(surplus);
    }
  }

  // Initialize card with default timeframe (year)
  updateSurplusCard('year');

  // Listen to chart timeframe changes
  const selector = document.getElementById('chartTimeframeSelect');
  if (selector) {
    selector.addEventListener('change', function(e) {
      updateSurplusCard(e.target.value);
    });
  }
});
