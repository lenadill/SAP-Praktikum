(function() {
    let transactions = [];

    async function init() {
        const userStr = localStorage.getItem('clarityUser');
        if (!userStr) {
            window.location.href = '/login';
            return;
        }

        // Fetch Transactions
        if (window.DataManager) {
            transactions = await window.DataManager.fetchTransactions();
            updateInsightsUI();
        }

        // Handle version display
        fetch('/api/config')
            .then(res => res.json())
            .then(config => {
                const versionElements = document.querySelectorAll('.footer-version, #app-version');
                versionElements.forEach(el => {
                    el.textContent = config.version ? `v${config.version}` : '';
                });
            });
    }

    function updateInsightsUI() {
        if (!window.ForecastEngine || !transactions.length) return;

        // Subscriptions
        const subs = window.ForecastEngine.detectSubscriptions(transactions);
        const subList = document.getElementById('subscriptions-list');
        if (subList) {
            if (subs.length === 0) {
                subList.innerHTML = '<p style="font-size: 0.875rem; color: #94a3b8; font-style: italic;">No recurring subscriptions detected yet.</p>';
            } else {
                subList.innerHTML = subs.map(sub => `
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 1rem; background: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0;">
                        <div style="display: flex; flex-direction: column;">
                            <span style="font-size: 1rem; font-weight: 600; color: #1e293b;">${sub.name}</span>
                            <span style="font-size: 0.8125rem; color: #64748b;">${sub.category} • ${sub.frequency.charAt(0).toUpperCase() + sub.frequency.slice(1)}</span>
                        </div>
                        <div style="text-align: right;">
                            <span style="display: block; font-size: 1rem; font-weight: 700; color: ${sub.amount < 0 ? '#e74c3c' : '#27ae60'};">
                                ${sub.amount < 0 ? '-' : ''}€${Math.abs(sub.amount).toLocaleString('en-US', {minimumFractionDigits: 2})}
                            </span>
                        </div>
                    </div>
                `).join('');
            }
        }

        // Trends
        const trends = window.ForecastEngine.calculateCategoryTrends(transactions);
        const trendsContent = document.getElementById('trends-content');
        if (trendsContent) {
            const categories = Object.keys(trends);
            if (categories.length === 0) {
                trendsContent.innerHTML = '<p style="font-size: 0.875rem; color: #94a3b8; font-style: italic;">Not enough data to identify trends.</p>';
            } else {
                // Show top 5 trends
                const sortedTrends = categories
                    .map(cat => ({ name: cat, trend: (trends[cat] - 1) * 100 }))
                    .sort((a, b) => Math.abs(b.trend) - Math.abs(a.trend))
                    .slice(0, 5);

                trendsContent.innerHTML = sortedTrends.map(t => {
                    const isUp = t.trend > 0;
                    const color = isUp ? '#e74c3c' : '#27ae60';
                    const icon = isUp ? '↑' : '↓';
                    
                    return `
                        <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 0; border-bottom: 1px solid #f1f5f9;">
                            <span style="font-size: 0.9375rem; color: #475569;">${t.name}</span>
                            <div style="text-align: right;">
                                <span style="font-size: 0.9375rem; font-weight: 700; color: ${color};">
                                    ${icon} ${Math.abs(t.trend).toFixed(1)}%
                                </span>
                            </div>
                        </div>
                    `;
                }).join('') + `
                    <div style="margin-top: 1rem; padding: 1rem; background: #fffbeb; border-radius: 8px; border: 1px solid #fef3c7;">
                        <p style="font-size: 0.8125rem; color: #92400e; margin: 0; line-height: 1.5;">
                            <strong>AI Tip:</strong> Clair noticed ${sortedTrends.filter(t => t.trend > 2).length} categories with rising costs. Check if these are seasonal or permanent.
                        </p>
                    </div>
                `;
            }
        }
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();
