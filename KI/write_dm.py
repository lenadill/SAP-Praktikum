content = r"""window.DataManager = (function() {
    let transactions = [];

    async function fetchTransactions() {
        try {
            const res = await fetch('/api/transactions');
            const data = await res.json();
            transactions = data.eintraege || [];
            return transactions;
        } catch (err) {
            console.error("Fehler beim Laden der Transaktionen für Graphen:", err);
            return [];
        }
    }

    function getAggregatedData(timeframe) {
        const now = new Date();
        const nowYear = now.getFullYear();
        const nowMonth = now.getMonth();
        
        let labels = [];
        let revenue = [];
        let outgoings = [];

        if (timeframe === 'year') {
            labels = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];
            revenue = new Array(12).fill(0);
            outgoings = new Array(12).fill(0);
            
            transactions.forEach(t => {
                const d = new Date(t.timestamp);
                if (d.getFullYear() === nowYear) {
                    const month = d.getMonth();
                    revenue[month] += Math.max(0, t.wert);
                    outgoings[month] += Math.abs(Math.min(0, t.wert));
                }
            });
        } 
        else if (timeframe === 'month') {
            labels = ['Woche 1', 'Woche 2', 'Woche 3', 'Woche 4', 'Woche 5'];
            revenue = new Array(5).fill(0);
            outgoings = new Array(5).fill(0);
            
            transactions.forEach(t => {
                const d = new Date(t.timestamp);
                if (d.getMonth() === nowMonth && d.getFullYear() === nowYear) {
                    const week = Math.min(4, Math.floor((d.getDate() - 1) / 7));
                    revenue[week] += Math.max(0, t.wert);
                    outgoings[week] += Math.abs(Math.min(0, t.wert));
                }
            });
        }
        else if (timeframe === 'week') {
            labels = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
            revenue = new Array(7).fill(0);
            outgoings = new Array(7).fill(0);
            
            const startOfWeek = new Date(now);
            const day = startOfWeek.getDay();
            const diff = startOfWeek.getDate() - (day === 0 ? 6 : day - 1);
            startOfWeek.setDate(diff);
            startOfWeek.setHours(0,0,0,0);

            transactions.forEach(t => {
                const d = new Date(t.timestamp);
                if (d >= startOfWeek) {
                    const dayIdx = (d.getDay() + 6) % 7;
                    revenue[dayIdx] += Math.max(0, t.wert);
                    outgoings[dayIdx] += Math.abs(Math.min(0, t.wert));
                }
            });
        }
        else if (timeframe.startsWith('2025Q')) {
            const quarter = parseInt(timeframe.charAt(5));
            const startMonth = (quarter - 1) * 3;
            const monthLabels = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];
            labels = monthLabels.slice(startMonth, startMonth + 3);
            revenue = new Array(3).fill(0);
            outgoings = new Array(3).fill(0);

            transactions.forEach(t => {
                const d = new Date(t.timestamp);
                if (d.getFullYear() === 2025) {
                    const m = d.getMonth();
                    if (m >= startMonth && m < startMonth + 3) {
                        const idx = m - startMonth;
                        revenue[idx] += Math.max(0, t.wert);
                        outgoings[idx] += Math.abs(Math.min(0, t.wert));
                    }
                }
            });
        }

        return { labels, revenue, outgoings };
    }

    return {
        fetchTransactions,
        getAggregatedData
    };
})();"""

with open("../App/static/js/data-manager.js", "w", encoding="utf-8") as f:
    f.write(content)
