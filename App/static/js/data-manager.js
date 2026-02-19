window.DataManager = (function() {
    let transactions = [];

    async function fetchTransactions() {
        try {
            // Fetch a high limit to ensure the graph has all data points
            const res = await fetch('/api/transactions?limit=10000&t=' + Date.now());
            const data = await res.json();
            transactions = data.eintraege || [];
            console.log("DataManager: " + transactions.length + " Transaktionen geladen.");
            return transactions;
        } catch (err) {
            console.error("Fehler beim Laden der Transaktionen:", err);
            return [];
        }
    }

    function getAggregatedData(timeframe) {
        const now = new Date();
        const nowYear = now.getFullYear();
        const nowMonth = now.getMonth();
        
        let targetYear = nowYear;
        if (timeframe === 'last_year') {
            targetYear = 2025;
        } else if (/^\d{4}/.test(timeframe)) {
            targetYear = parseInt(timeframe.substring(0, 4));
        }

        console.log("DataManager: Processing", timeframe, "for year", targetYear, "Total transactions available:", transactions.length);

        let labels = [];
        let revenue = [];
        let outgoings = [];

        if (timeframe === 'year' || timeframe === 'last_year' || /^\d{4}$/.test(timeframe)) {
            labels = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];
            revenue = new Array(12).fill(0);
            outgoings = new Array(12).fill(0);
            
            let matched = 0;
            transactions.forEach(t => {
                const d = new Date(t.timestamp);
                if (d.getFullYear() === targetYear) {
                    matched++;
                    const month = d.getMonth();
                    const val = parseFloat(t.wert) || 0;
                    if (val >= 0) revenue[month] += val;
                    else outgoings[month] += Math.abs(val);
                }
            });
            console.log("DataManager: Year matches for " + targetYear + ": " + matched);
        } 
        else if (timeframe === 'month') {
            labels = ['Woche 1', 'Woche 2', 'Woche 3', 'Woche 4', 'Woche 5'];
            revenue = new Array(5).fill(0);
            outgoings = new Array(5).fill(0);
            
            transactions.forEach(t => {
                const d = new Date(t.timestamp);
                if (d.getMonth() === nowMonth && d.getFullYear() === nowYear) {
                    const week = Math.min(4, Math.floor((d.getDate() - 1) / 7));
                    const val = parseFloat(t.wert) || 0;
                    if (val >= 0) revenue[week] += val;
                    else outgoings[week] += Math.abs(val);
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
                    const val = parseFloat(t.wert) || 0;
                    if (val >= 0) revenue[dayIdx] += val;
                    else outgoings[dayIdx] += Math.abs(val);
                }
            });
        }
        else if (/^\d{4}Q[1-4]$/.test(timeframe)) {
            const year = parseInt(timeframe.substring(0, 4));
            const quarter = parseInt(timeframe.charAt(5));
            const startMonth = (quarter - 1) * 3;
            const monthLabels = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];
            labels = monthLabels.slice(startMonth, startMonth + 3);
            revenue = new Array(3).fill(0);
            outgoings = new Array(3).fill(0);

            transactions.forEach(t => {
                const d = new Date(t.timestamp);
                if (d.getFullYear() === year) {
                    const m = d.getMonth();
                    if (m >= startMonth && m < startMonth + 3) {
                        const idx = m - startMonth;
                        const val = parseFloat(t.wert) || 0;
                        if (val >= 0) revenue[idx] += val;
                        else outgoings[idx] += Math.abs(val);
                    }
                }
            });
        }

        return { labels, revenue, outgoings };
    }

    function searchTransactions(criteria) {
        return transactions.filter(t => {
            let match = true;
            if (criteria.category && t.kategorie.toLowerCase() !== criteria.category.toLowerCase()) match = false;
            if (criteria.name && !t.name.toLowerCase().includes(criteria.name.toLowerCase())) match = false;
            if (criteria.minAmount && Math.abs(parseFloat(t.wert)) < criteria.minAmount) match = false;
            if (criteria.maxAmount && Math.abs(parseFloat(t.wert)) > criteria.maxAmount) match = false;
            return match;
        });
    }

    function getAllTransactions() {
        return transactions;
    }

    return {
        fetchTransactions,
        getAggregatedData,
        searchTransactions,
        getAllTransactions
    };
})();