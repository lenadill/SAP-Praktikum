document.addEventListener('DOMContentLoaded', function() {
  // Data for different time periods - same as in graph.js
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

  // Function to calculate totals
  function calculateTotals(timeframe) {
    const data = chartData[timeframe];
    if (!data) return { revenue: 0, expenses: 0, surplus: 0 };
    
    const totalRevenue = data.revenue.reduce((a, b) => a + b, 0);
    const totalExpenses = data.outgoings.reduce((a, b) => a + b, 0);
    const totalSurplus = totalRevenue - totalExpenses;
    
    return {
      revenue: totalRevenue,
      expenses: totalExpenses,
      surplus: totalSurplus
    };
  }

  // Function to format currency
  function formatCurrency(value) {
    return value.toLocaleString('en-US');
  }

  // Function to update all cards
  function updateCards(timeframe) {
    const totals = calculateTotals(timeframe);

    // Update Revenue Card
    const revenueCard = document.querySelector('.card[data-card-type="revenue"]');
    if (revenueCard) {
      revenueCard.querySelector('.card-value').textContent = formatCurrency(totals.revenue);
    }

    // Update Expenses Card
    const expensesCard = document.querySelector('.card[data-card-type="expenses"]');
    if (expensesCard) {
      expensesCard.querySelector('.card-value').textContent = formatCurrency(totals.expenses);
    }

    // Update Surplus Card
    const surplusCard = document.querySelector('.card[data-card-type="surplus"]');
    if (surplusCard) {
      surplusCard.querySelector('.card-value').textContent = formatCurrency(totals.surplus);
    }
  }

  // Initialize cards with default timeframe (year)
  updateCards('year');

  // Listen to chart timeframe changes
  const selector = document.getElementById('chartTimeframeSelect');
  if (selector) {
    selector.addEventListener('change', function(e) {
      updateCards(e.target.value);
    });
  }
});
