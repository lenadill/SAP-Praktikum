content = r"""document.addEventListener('DOMContentLoaded', async function() {
    async function updateCards() {
        await window.DataManager.fetchTransactions();
        const timeframeSelect = document.getElementById('chartTimeframeSelect');
        const timeframe = timeframeSelect ? timeframeSelect.value : 'year';
        const data = window.DataManager.getAggregatedData(timeframe);

        const totalRevenue = data.revenue.reduce((a, b) => a + b, 0);
        const totalExpenses = data.outgoings.reduce((a, b) => a + b, 0);
        const totalSurplus = totalRevenue - totalExpenses;

        const format = (v) => v.toLocaleString('de-DE') + '€';

        const revCard = document.querySelector('.card[data-card-type="revenue"] .card-value');
        const expCard = document.querySelector('.card[data-card-type="expenses"] .card-value');
        const surCard = document.querySelector('.card[data-card-type="surplus"] .card-value');

        if (revCard) revCard.textContent = format(totalRevenue);
        if (expCard) expCard.textContent = format(totalExpenses);
        if (surCard) surCard.textContent = format(totalSurplus);
    }

    const selector = document.getElementById('chartTimeframeSelect');
    if (selector) {
        selector.addEventListener('change', updateCards);
    }

    document.addEventListener('dataUpdated', updateCards);
    updateCards();
});"""

with open("../App/static/js/cards-data.js", "w", encoding="utf-8") as f:
    f.write(content)
