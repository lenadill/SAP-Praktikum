(function() {
    function init() {
        console.log("Transactions JS - Modal centering and functionality");
        const tableBody = document.querySelector('.transactions-table tbody');
        const tableEl = document.querySelector('.transactions-table');
        const modal = document.getElementById('transactionModal');
        const btnAdd = document.getElementById('btnAddRecipt');
        const btnCancel = document.getElementById('btnCancel');
        const form = document.getElementById('transactionForm');
        
        const contextMenu = document.getElementById('contextMenu');
        const cmAskJoule = document.getElementById('cmAskJoule');
        const cmEdit = document.getElementById('cmEdit');
        const cmDelete = document.getElementById('cmDelete');
        const searchInput = document.getElementById('globalSearch');

        const OWN_COMPANY = "SAP";

        let selectedTransactionId = null;
        let currentCategoryFilter = 'all';
        let currentSearchQuery = '';
        let currentPriceFilter = '';
        let currentDateFilter = '';
        let currentIdFilter = '';
        let currentSortColumn = 'timestamp';
        let currentSortOrder = 'DESC';
        
        let allEntries = [];
        let currentOffset = 0;
        const PAGE_SIZE = 25;
        let isLoading = false;
        let hasMore = true;

        const columnMap = {
            'Category': 'kategorie', 'Sender': 'sender', 'Recipient': 'empfaenger',
            'Amount': 'wert', 'Date': 'timestamp', 'kategorie': 'Category',
            'sender': 'Sender', 'empfaenger': 'Recipient', 'wert': 'Amount', 'timestamp': 'Date'
        };

        function loadTransactions(append = false) {
            if (append && (isLoading || !hasMore)) return;
            
            isLoading = true;
            if (!append) {
                currentOffset = 0; 
                hasMore = true;
                if (tableEl) tableEl.classList.add('is-loading');
            }
            
            let url = `/api/transactions?limit=${PAGE_SIZE}&offset=${currentOffset}`;
            if (currentCategoryFilter !== 'all') url += `&category=${encodeURIComponent(currentCategoryFilter)}`;
            if (currentSearchQuery) url += `&search=${encodeURIComponent(currentSearchQuery)}`;
            if (currentPriceFilter) url += `&price=${encodeURIComponent(currentPriceFilter)}`;
            if (currentDateFilter) url += `&date=${encodeURIComponent(currentDateFilter)}`;
            if (currentIdFilter) url += `&id=${encodeURIComponent(currentIdFilter)}`;
            url += `&sort=${currentSortColumn}&order=${currentSortOrder}`;

            fetch(url)
                .then(res => res.json())
                .then(data => {
                    const newEntries = data.eintraege || [];
                    if (!append) { allEntries = newEntries; if (tableBody) tableBody.innerHTML = ''; }
                    else { allEntries = allEntries.concat(newEntries); }
                    if (newEntries.length < PAGE_SIZE) hasMore = false;
                    isLoading = false; currentOffset += newEntries.length;
                    if (tableEl) tableEl.classList.remove('is-loading');
                    updateHeaderTags();
                    renderTable(allEntries, append);
                })
                .catch(err => {
                    console.error("Error loading transactions:", err);
                    isLoading = false; if (tableEl) tableEl.classList.remove('is-loading');
                });
        }

        function syncSearchActiveClass() {
            const hasActiveFilter = !!(currentSearchQuery || currentIdFilter || currentDateFilter || (currentCategoryFilter !== 'all'));
            document.body.classList.toggle('search-active', hasActiveFilter);
        }

        function updateHeaderTags() {
            const titleEl = document.querySelector('.transactions-title');
            if (!titleEl) return;
            let html = 'Transactions';
            if (currentIdFilter) html += ` <span style="font-size: 0.5em; vertical-align: middle; background: #fee2e2; color: #991b1b; padding: 4px 12px; border-radius: 12px; margin-left: 10px; font-weight: bold; display: inline-block;">Item ID: ${currentIdFilter} <span id="clearIdFilter" style="cursor:pointer; margin-left: 5px; font-weight: bold;">×</span></span>`;
            if (currentCategoryFilter !== 'all') html += ` <span style="font-size: 0.5em; vertical-align: middle; background: #f3f0ff; color: #6f42c1; padding: 4px 12px; border-radius: 12px; margin-left: 10px; font-weight: bold; display: inline-block;">${currentCategoryFilter} <span id="clearCatFilter" style="cursor:pointer; margin-left: 5px; font-weight: bold;">×</span></span>`;
            if (currentDateFilter) html += ` <span style="font-size: 0.5em; vertical-align: middle; background: #fef3c7; color: #92400e; padding: 4px 12px; border-radius: 12px; margin-left: 10px; font-weight: bold; display: inline-block;">${currentDateFilter} <span id="clearDateFilter" style="cursor:pointer; margin-left: 5px; font-weight: bold;">×</span></span>`;
            if (currentSearchQuery) html += ` <span style="font-size: 0.5em; vertical-align: middle; background: #e0f2fe; color: #0369a1; padding: 4px 12px; border-radius: 12px; margin-left: 10px; font-weight: bold; display: inline-block;">"${currentSearchQuery}" <span id="clearSearchFilter" style="cursor:pointer; margin-left: 5px; font-weight: bold;">×</span></span>`;
            if (currentSortColumn !== 'timestamp' || currentSortOrder !== 'DESC') {
                const colLabel = columnMap[currentSortColumn] || currentSortColumn;
                html += ` <span style="font-size: 0.5em; vertical-align: middle; background: #dcfce7; color: #166534; padding: 4px 12px; border-radius: 12px; margin-left: 10px; font-weight: bold; display: inline-block;">Sorted: ${colLabel} ${currentSortOrder.toLowerCase()} <span id="clearSortFilter" style="cursor:pointer; margin-left: 5px; font-weight: bold;">×</span></span>`;
            }
            titleEl.innerHTML = html;
            const cId = document.getElementById('clearIdFilter'); if (cId) cId.onclick = (e) => { e.stopPropagation(); currentIdFilter = ''; syncSearchActiveClass(); loadTransactions(false); };
            const cCat = document.getElementById('clearCatFilter'); if (cCat) cCat.onclick = (e) => { e.stopPropagation(); currentCategoryFilter = 'all'; syncSearchActiveClass(); applyFilter(); };
            const cDate = document.getElementById('clearDateFilter'); if (cDate) cDate.onclick = (e) => { e.stopPropagation(); currentDateFilter = ''; syncSearchActiveClass(); loadTransactions(false); };
            const cSearch = document.getElementById('clearSearchFilter'); if (cSearch) cSearch.onclick = (e) => { 
                e.stopPropagation(); 
                currentSearchQuery = ''; 
                currentPriceFilter = '';
                currentDateFilter = '';
                currentIdFilter = ''; 
                if(searchInput) searchInput.value = ''; 
                syncSearchActiveClass();
                loadTransactions(false); 
            };
            const cSort = document.getElementById('clearSortFilter'); if (cSort) cSort.onclick = (e) => {
                e.stopPropagation(); currentSortColumn = 'timestamp'; currentSortOrder = 'DESC';
                document.querySelectorAll('.transactions-table th').forEach(h => h.innerHTML = h.textContent.replace(' ▲', '').replace(' ▼', ''));
                loadTransactions(false);
            };
        }

        function applyFilter() {
            document.dispatchEvent(new CustomEvent('categoryChanged', { detail: { category: currentCategoryFilter } }));
            loadTransactions(false);
        }

        document.querySelectorAll('.transactions-table th').forEach(th => {
            const dbCol = columnMap[th.textContent.trim().replace(' ▲', '').replace(' ▼', '')];
            if (dbCol) {
                th.style.cursor = 'pointer'; th.title = 'Click to sort';
                th.onclick = () => {
                    if (currentSortColumn === dbCol) currentSortOrder = (currentSortOrder === 'ASC' ? 'DESC' : 'ASC');
                    else { currentSortColumn = dbCol; currentSortOrder = 'ASC'; }
                    document.querySelectorAll('.transactions-table th').forEach(h => h.innerHTML = h.textContent.replace(' ▲', '').replace(' ▼', ''));
                    th.innerHTML += (currentSortOrder === 'ASC' ? ' ▲' : ' ▼');
                    loadTransactions(false);
                };
            }
        });

        if (searchInput) {
            const clearSearchBtn = document.getElementById('clearSearch');
            let timeout;
            searchInput.addEventListener('input', (e) => {
                const val = e.target.value.trim();
                
                // If searching, clear category and ID filters
                if (val && (currentCategoryFilter !== 'all' || currentIdFilter)) {
                    currentCategoryFilter = 'all';
                    currentIdFilter = '';
                    updateHeaderTags();
                    document.dispatchEvent(new CustomEvent('categoryChanged', { detail: { category: 'all' } }));
                }

                // Toggle search-active class to hide chart and expand list area
                document.body.classList.toggle('search-active', !!val);

                if (clearSearchBtn) clearSearchBtn.style.display = val ? 'block' : 'none';
                if (!val || val === '-' || val === '+') {
                    currentSearchQuery = '';
                    currentPriceFilter = '';
                    currentDateFilter = '';
                    currentIdFilter = '';
                    document.body.classList.remove('search-active');
                    loadTransactions(false);
                    return;
                }
                clearTimeout(timeout);
                timeout = setTimeout(() => { 
                    // Improved date detection (e.g., 2026-02-19 or 19.02.2026)
                    const datePattern = /^(\d{4}-\d{2}-\d{2})|(\d{1,2}\.\d{1,2}\.\d{4})$/;
                    // Price detection (e.g., 12, 12.50, -5, 10€)
                    const pricePattern = /^-?\d+([.,]\d{1,2})?€?$/;

                    if (datePattern.test(val)) {
                        let dateVal = val;
                        if (val.includes('.')) {
                            const [d, m, y] = val.split('.');
                            // Ensure leading zeros for YYYY-MM-DD format
                            const day = d.padStart(2, '0');
                            const month = m.padStart(2, '0');
                            dateVal = `${y}-${month}-${day}`;
                        }
                        currentDateFilter = dateVal;
                        currentSearchQuery = '';
                    } else if (pricePattern.test(val)) {
                        currentSearchQuery = val;
                    } else {
                        currentSearchQuery = val;
                    }
                    
                    if (currentSearchQuery) {
                        currentDateFilter = '';
                        currentPriceFilter = '';
                        currentIdFilter = '';
                    }
                    
                    loadTransactions(false); 
                }, 300);
            });

            if (clearSearchBtn) {
                clearSearchBtn.onclick = () => {
                    searchInput.value = '';
                    clearSearchBtn.style.display = 'none';
                    currentSearchQuery = '';
                    currentPriceFilter = '';
                    currentDateFilter = '';
                    document.body.classList.remove('search-active');
                    loadTransactions(false);
                };
            }
        }

        function renderTable(entries, append = false) {
            if (!entries || entries.length === 0) { if (tableBody && !append) tableBody.innerHTML = `<tr><td colspan="5" class="empty">No entries found</td></tr>`; return; }
            if (tableBody) {
                tableBody.innerHTML = '';
                entries.forEach(e => {
                    const tr = document.createElement('tr'); tr.dataset.id = e.id; tr.dataset.raw = JSON.stringify(e);
                    const val = parseFloat(e.wert);
                    tr.innerHTML = `
                        <td class="cat-cell" style="cursor:pointer;color:#6f42c1;font-weight:500;">${e.kategorie}</td>
                        <td>${e.sender || '-'}</td><td>${e.empfaenger || '-'}</td>
                        <td style="color:${val>=0?'#28a745':'#dc3545'};font-weight:bold">${val>=0?'+':''}${val.toFixed(2)}€</td>
                        <td class="date-cell" style="cursor:pointer;color:#0070d2;">${new Date(e.timestamp).toLocaleDateString('en-US')}</td>
                    `;
                    tr.querySelector('.cat-cell').onclick = (ev) => { ev.stopPropagation(); currentCategoryFilter = e.kategorie; applyFilter(); };
                    tr.querySelector('.date-cell').onclick = (ev) => { ev.stopPropagation(); currentDateFilter = e.timestamp.split('T')[0]; loadTransactions(false); };
                    tr.oncontextmenu = (ev) => {
                        ev.preventDefault();
                        ev.stopPropagation();
                        selectedTransactionId = e.id;
                        if (contextMenu) {
                            contextMenu.style.display = 'block';
                            contextMenu.style.left = ev.clientX + 'px';
                            contextMenu.style.top = ev.clientY + 'px';
                            
                            // Simple collision check only if it goes off bottom
                            const vHeight = window.innerHeight;
                            const menuHeight = contextMenu.offsetHeight;
                            if (ev.clientY + menuHeight > vHeight) {
                                contextMenu.style.top = (ev.clientY - menuHeight) + 'px';
                            }
                        }
                    };
                    tableBody.appendChild(tr);
                });
            }
        }

        window.addEventListener('scroll', () => { if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 500) if (hasMore && !isLoading) loadTransactions(true); });
        window.addEventListener('click', (ev) => { if(contextMenu) contextMenu.style.display = 'none'; if(modal && ev.target == modal) modal.style.display = 'none'; });
        
        if (cmAskJoule) cmAskJoule.onclick = () => {
            const row = document.querySelector(`tr[data-id="${selectedTransactionId}"]`);
            if (row) document.dispatchEvent(new CustomEvent('attachToJoule', { detail: { transaction: JSON.parse(row.dataset.raw) } }));
            if (contextMenu) contextMenu.style.display = 'none';
        };

        cmDelete.onclick = () => {
            if (selectedTransactionId && confirm('Really delete?')) fetch('/api/transactions/' + selectedTransactionId, { method: 'DELETE' }).then(() => { loadTransactions(); document.dispatchEvent(new Event('dataUpdated')); });
        };

        cmEdit.onclick = () => {
            const row = document.querySelector(`tr[data-id="${selectedTransactionId}"]`); if (!row) return;
            const data = JSON.parse(row.dataset.raw);
            document.getElementById('tName').value = data.name; document.getElementById('tKategorie').value = data.kategorie;
            document.getElementById('tWert').value = Math.abs(data.wert); document.getElementById('tSender').value = data.sender || '';
            document.getElementById('tEmpfaenger').value = data.empfaenger || ''; document.getElementById('tType').value = data.wert >= 0 ? 'income' : 'expense';
            if (data.timestamp) document.getElementById('tDate').value = data.timestamp.split('T')[0];
            form.dataset.editId = selectedTransactionId; modal.style.display = 'flex';
        };

        form.onsubmit = (e) => {
            e.preventDefault(); const editId = form.dataset.editId; let wert = parseFloat(document.getElementById('tWert').value);
            if (document.getElementById('tType').value === 'expense') wert = -Math.abs(wert);
            const payload = {
                name: document.getElementById('tName').value, kategorie: document.getElementById('tKategorie').value,
                wert: wert, sender: document.getElementById('tSender').value, empfaenger: document.getElementById('tEmpfaenger').value,
                timestamp: new Date(document.getElementById('tDate').value).toISOString()
            };
            fetch(editId ? '/api/transactions/' + editId : '/api/transactions', {
                method: editId ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
            }).then(() => { modal.style.display = 'none'; form.reset(); delete form.dataset.editId; loadTransactions(); document.dispatchEvent(new Event('dataUpdated')); });
        };

        const btnScanReceipt = document.getElementById('btnScanReceipt');
        const qrCodeArea = document.getElementById('qrCodeArea');
        const qrcodeImgContainer = document.getElementById('qrcode');
        const btnCancelScan = document.getElementById('btnCancelScan');
        const scanStatus = document.getElementById('scanStatus');
        let scanPollInterval = null;

        if (btnScanReceipt) {
            btnScanReceipt.onclick = async () => {
                try {
                    const res = await fetch('/api/scan/init');
                    const { sessionId, url } = await res.json();
                    
                    // Show QR Code Area
                    qrCodeArea.style.display = 'block';
                    form.style.display = 'none';
                    
                    // Generate QR Code via API
                    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(url)}`;
                    qrcodeImgContainer.innerHTML = `<img src="${qrUrl}" alt="QR Code">`;
                    
                    // Start Polling
                    startScanPolling(sessionId);
                } catch (err) {
                    console.error("Scan Init Error:", err);
                    alert("Could not initialize scan session.");
                }
            };
        }

        if (btnCancelScan) {
            btnCancelScan.onclick = () => {
                stopScanPolling();
                qrCodeArea.style.display = 'none';
                form.style.display = 'block';
            };
        }

        function startScanPolling(sessionId) {
            if (scanPollInterval) clearInterval(scanPollInterval);
            scanStatus.innerHTML = '<span class="dot-flashing"></span> Waiting for scan...';
            
            scanPollInterval = setInterval(async () => {
                try {
                    const res = await fetch(`/api/scan/status/${sessionId}`);
                    const session = await res.json();
                    
                    if (session.status === 'completed') {
                        stopScanPolling();
                        fillFormFromScan(session.data);
                        qrCodeArea.style.display = 'none';
                        form.style.display = 'block';
                    }
                } catch (err) {
                    console.error("Polling Error:", err);
                }
            }, 2000);
        }

        function stopScanPolling() {
            if (scanPollInterval) clearInterval(scanPollInterval);
            scanPollInterval = null;
        }

        function fillFormFromScan(data) {
            if (!data) return;
            console.log("Extracted Data:", data);
            
            if (data.name) document.getElementById('tName').value = data.name;
            if (data.category) {
                // Try to match category case-insensitively
                const select = document.getElementById('tKategorie');
                for (let i = 0; i < select.options.length; i++) {
                    if (select.options[i].value.toLowerCase() === data.category.toLowerCase()) {
                        select.selectedIndex = i;
                        break;
                    }
                }
            }
            if (data.amount) document.getElementById('tWert').value = Math.abs(data.amount);
            if (data.sender) document.getElementById('tSender').value = data.sender;
            if (data.recipient) document.getElementById('tEmpfaenger').value = data.recipient;
            if (data.date) {
                // Ensure YYYY-MM-DD format
                const dateVal = data.date.split('T')[0];
                document.getElementById('tDate').value = dateVal;
            }
            
            // Set type based on amount (though receipts are usually expenses)
            document.getElementById('tType').value = (data.amount && data.amount > 0) ? 'income' : 'expense';
        }

        btnAdd.onclick = () => { 
            if (form) form.reset(); 
            delete form.dataset.editId; 
            document.getElementById('tDate').value = new Date().toISOString().split('T')[0]; 
            modal.style.display = 'flex';
            // Reset scan area
            if (qrCodeArea) qrCodeArea.style.display = 'none';
            if (form) form.style.display = 'block';
        };
        if (btnCancel) btnCancel.onclick = () => modal.style.display = 'none';

        loadTransactions();
        document.addEventListener('forceFilter', (e) => {
            const { category, date, search, id } = e.detail;
            
            if (id !== undefined) {
                currentIdFilter = id;
                // When focusing on a specific ID, clear other restrictive filters
                if (id) {
                    currentCategoryFilter = 'all';
                    currentDateFilter = '';
                    currentSearchQuery = '';
                    if (searchInput) searchInput.value = '';
                }
            } else {
                // If no ID, use other filters normally
                if (category !== undefined) currentCategoryFilter = category;
                if (date !== undefined) currentDateFilter = date;
                if (search !== undefined) { 
                    currentSearchQuery = search; 
                    if (searchInput) searchInput.value = search; 
                }
                currentIdFilter = ''; // Clear ID filter if we're doing a general filter
            }

            // Sync UI layout with search state
            document.body.classList.toggle('search-active', !!(currentSearchQuery || currentIdFilter || currentDateFilter || (currentCategoryFilter !== 'all')));

            loadTransactions(false);
            document.dispatchEvent(new CustomEvent('categoryChanged', { detail: { category: currentCategoryFilter } }));
        });
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
