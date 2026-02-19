(function () {
    const API_PROXY = '/api/chat';
    const STORAGE_KEY = 'joule_chat_history';
    const SYSTEM_PROMPT = `Du bist Joule, der intelligente KI-Assistent für "Clarity", ein SAP-Finanz-Dashboard. 
Deine Aufgabe ist es, Nutzer bei der Analyse ihrer Finanzen zu unterstützen und bei Bedarf als Personal Finance Advisor zu beraten.

### KONTEXT:
- Diese App heißt "Clarity". Sie ist ein SAP-basiertes Tool zum Tracken von Transaktionen (Einnahmen/Ausgaben).
- Es gibt ein Dashboard (Übersicht), eine Transaktionsliste und eine Support-Seite.
- Auf der Support-Seite gibt es FAQs und ein Kontaktformular für menschlichen Support.

### STILVORGABEN:
- **HILFSBEREITSCHAFT:** Wenn du eine Aktion ausführst (z.B. Suche), erkläre kurz, was du tust. Antworte niemals nur mit einem Tool-Aufruf.
- **SUPPORT:** Wenn Nutzer nach Hilfe oder Support fragen, verweise sie auf die Support-Seite oder biete an, ihre Fragen hier direkt zu beantworten.
- **FINANCE ADVISOR:** Gib auf Anfrage praktische Tipps zu Budgetierung, Sparen und Investitionen.
- **DISKRETION:** Nenne niemals Beträge oder den Kontostand, außer du wirst explizit danach gefragt.
- **NATÜRLICHKEIT:** Antworte freundlich und professionell.
- **KÜRZE:** Maximal 3 Sätze pro Antwort.
- Nutze eine professionelle SAP-Tonalität.

### TOOLS:
- QUERY:{"category": "...", "name": "...", "date": "YYYY-MM-DD"} -> Sucht nach Transaktionen.
**WICHTIG:** Nutze QUERY für JEDE Frage zu Transaktionen, damit die Benutzeroberfläche (Tabelle) im Hintergrund für den Nutzer gefiltert wird, auch wenn du die Antwort bereits kennst.
- ADD_TRANSACTION:{"name": "...", "kategorie": "...", "wert": -12.50, "sender": "...", "empfaenger": "..."} -> Fügt eine NEUE Transaktion hinzu.
**WICHTIG:** Nutze ADD_TRANSACTION nur, wenn der Nutzer explizit darum bittet, etwas NEUES zu speichern. Nutze es NIEMALS, wenn du eine bereits existierende (angehängte) Transaktion analysierst!`;

    let chatHistory = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    let activeAttachment = null;
    let isPanelOpen = false;

    document.body.insertAdjacentHTML('beforeend', `
        <div class="ai-chat-overlay" id="aiChatOverlay"></div>
        <div class="joule-help-bubble" id="jouleHelpBubble">
            Brauchst du Hilfe?
            <span class="joule-help-bubble-close" id="jouleHelpBubbleClose">&times;</span>
        </div>
        <aside class="ai-chat-panel" id="aiChatPanel" aria-label="Joule">
            <div class="ai-chat-header">
                <div class="ai-chat-title">
                    <span class="ai-chat-icon">
                        <img src="../assets/icons/joule_logo.png" alt="KI-Assistent">
                    </span>
                    <span>Joule</span>
                </div>
                <div style="display: flex; gap: 10px; align-items: center;">
                    <button class="ai-chat-clear" id="aiChatClear" title="Neuer Chat" style="background:none; border:none; color:white; cursor:pointer; display: flex; align-items: center; padding: 0 5px;">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 3 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                    </button>
                    <button class="ai-chat-close" id="aiChatClose" aria-label="Schließen" style="background:none; border:none; color:white; cursor:pointer; font-size:26px; line-height:1;">&times;</button>
                </div>
            </div>
            <div class="ai-chat-messages" id="aiChatMessages"></div>
            
            <div id="aiChatAttachmentArea" style="display:none; padding: 10px 16px; background: #f3f0ff; border-top: 1px solid #ece8f5;">
                <div class="attachment-chip" style="display: inline-flex; align-items: center; background: white; border: 1px solid #6f42c1; border-radius: 12px; padding: 4px 10px; font-size: 12px; color: #6f42c1; font-weight: bold;">
                    <span id="aiChatAttachmentName">Transaction</span>
                    <span id="aiChatRemoveAttachment" style="margin-left: 8px; cursor: pointer; font-size: 14px;">&times;</span>
                </div>
            </div>

            <div class="ai-chat-input-area">
                <textarea class="ai-chat-input" id="aiChatInput" placeholder="Nachricht eingeben…" rows="1"></textarea>
                <button class="ai-chat-send" id="aiChatSend" aria-label="Senden">
                    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M2 21l21-9L2 3v7l15 2-15 2v7z"/></svg>
                </button>
            </div>
        </aside>
    `);

    const panel = document.getElementById('aiChatPanel');
    const overlay = document.getElementById('aiChatOverlay');
    const helpBubble = document.getElementById('jouleHelpBubble');
    const helpBubbleClose = document.getElementById('jouleHelpBubbleClose');
    const closeBtn = document.getElementById('aiChatClose');
    const clearBtn = document.getElementById('aiChatClear');
    const input = document.getElementById('aiChatInput');
    const sendBtn = document.getElementById('aiChatSend');
    const messagesContainer = document.getElementById('aiChatMessages');
    const attachmentArea = document.getElementById('aiChatAttachmentArea');
    const attachmentName = document.getElementById('aiChatAttachmentName');
    const removeAttachment = document.getElementById('aiChatRemoveAttachment');

    let inactivityTimer;
    let isBubbleDismissed = false; // Prevents bubble from coming back in same session if X clicked

    function resetInactivityTimer() {
        clearTimeout(inactivityTimer);
        if (isPanelOpen || isBubbleDismissed) return;
        
        inactivityTimer = setTimeout(() => {
            if (!isPanelOpen && !isBubbleDismissed && helpBubble) {
                helpBubble.classList.add('show');
            }
        }, 60000); // 60 seconds
    }

    // Interaction listeners
    window.addEventListener('mousemove', () => {
        // Only reset if NOT showing, to allow clicking the bubble
        if (!helpBubble.classList.contains('show')) resetInactivityTimer();
    }, { passive: true });

    window.addEventListener('scroll', () => {
        if (!helpBubble.classList.contains('show')) resetInactivityTimer();
    }, { passive: true });

    window.addEventListener('keydown', () => {
        if (helpBubble.classList.contains('show')) helpBubble.classList.remove('show');
        resetInactivityTimer();
    }, { passive: true });

    window.addEventListener('click', (e) => {
        // If clicking anywhere else than the bubble, hide it
        if (helpBubble.classList.contains('show') && !helpBubble.contains(e.target)) {
            helpBubble.classList.remove('show');
        }
        if (!isPanelOpen) resetInactivityTimer();
    }, { passive: true });

    if (helpBubble) {
        helpBubble.onclick = (e) => {
            e.stopPropagation();
            helpBubble.classList.remove('show');
            openChat();
        };
    }

    if (helpBubbleClose) {
        helpBubbleClose.onclick = (e) => {
            e.stopPropagation(); // Don't open chat
            helpBubble.classList.remove('show');
            isBubbleDismissed = true; // Stay hidden
            clearTimeout(inactivityTimer);
        };
    }

    function saveHistory() { localStorage.setItem(STORAGE_KEY, JSON.stringify(chatHistory)); }

    function toggleNotificationDot(show) {
        const diamondBtn = document.querySelector('.diamond-btn');
        if (!diamondBtn) return;
        let dot = diamondBtn.querySelector('.notification-dot');
        if (!dot) { dot = document.createElement('div'); dot.className = 'notification-dot'; diamondBtn.appendChild(dot); }
        dot.style.display = show ? 'block' : 'none';
    }

    function openChat() { 
        panel.classList.add('open'); 
        overlay.classList.add('open'); 
        if (helpBubble) helpBubble.classList.remove('show');
        input.focus(); 
        isPanelOpen = true; 
        toggleNotificationDot(false); 
        clearTimeout(inactivityTimer);
    }
    function closeChat() { 
        panel.classList.remove('open'); 
        overlay.classList.remove('open'); 
        isPanelOpen = false; 
        resetInactivityTimer();
    }

    closeBtn.onclick = closeChat;
    overlay.onclick = closeChat;
    
    clearBtn.onclick = () => {
        if (confirm("Chat-Verlauf wirklich löschen?")) {
            chatHistory = [];
            localStorage.removeItem(STORAGE_KEY);
            messagesContainer.innerHTML = "";
            appendMessage("Hallo! Ich bin Joule. Wie kann ich dir heute helfen?", "assistant", null, true);
        }
    };

    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeChat(); });

    function setupButton() {
        const diamondBtn = document.querySelector('.diamond-btn');
        if (diamondBtn) diamondBtn.onclick = openChat;
        else setTimeout(setupButton, 100);
    }
    setupButton();
    resetInactivityTimer();

    input.oninput = function () { this.style.height = 'auto'; this.style.height = Math.min(this.scrollHeight, 120) + 'px'; };
    input.onkeydown = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } };
    sendBtn.onclick = sendMessage;

    document.addEventListener('attachToJoule', (e) => {
        const t = e.detail.transaction;
        activeAttachment = t;
        attachmentName.textContent = `${t.name || t.kategorie} (${parseFloat(t.wert).toFixed(2)}€)`;
        attachmentArea.style.display = 'block';
        openChat();
    });

    removeAttachment.onclick = () => { activeAttachment = null; attachmentArea.style.display = 'none'; };

    function appendMessage(text, role, attachment = null, save = true) {
        let cleanText = text
            .replace(/\[ANGEHÄNGTE TRANSAKTION:[\s\S]*?\]/gi, '')
            .replace(/QUERY:[\s\n]*\{[\s\S]*?\}/gi, '')
            .replace(/ADD_TRANSACTION:[\s\n]*\{[\s\S]*?\}/gi, '')
            .replace(/\bQUERY\b/g, '')
            .replace(/\bADD_TRANSACTION\b/g, '')
            .trim();
        
        // Remove trailing or leading newlines that might have been part of the technical prefix
        cleanText = cleanText.replace(/^\s+|\s+$/g, '');
        
        if (!cleanText && role === 'assistant' && !attachment) return false; 

        const wrapper = document.createElement('div');
        wrapper.className = 'ai-message ai-message--' + (role === 'assistant' ? 'bot' : 'user');
        const avatar = document.createElement('div');
        avatar.className = 'ai-message-avatar';
        avatar.textContent = role === 'user' ? 'Du' : 'J';
        const bubble = document.createElement('div');
        bubble.className = 'ai-message-bubble';

        if (attachment) {
            const chip = document.createElement('div');
            chip.className = 'attachment-chip-interactive';
            chip.style.cssText = 'display: inline-flex; align-items: center; background: #f3f0ff; border: 1px solid #6f42c1; border-radius: 8px; padding: 4px 8px; margin-bottom: 8px; font-size: 11px; color: #6f42c1; font-weight: bold; cursor: pointer; transition: background 0.2s;';
            chip.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:4px"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path></svg> ${attachment.name || attachment.kategorie} (${parseFloat(attachment.wert).toFixed(2)}€)`;
            
            chip.onclick = (e) => {
                e.stopPropagation();
                // Close chat panel to show the result
                closeChat();
                // Trigger global search/filter for this transaction ID
                document.dispatchEvent(new CustomEvent('forceFilter', { 
                    detail: { 
                        id: attachment.id,
                        search: attachment.id ? "" : (attachment.name || attachment.kategorie),
                        category: 'all' 
                    } 
                }));
            };
            
            bubble.appendChild(chip);
            if (cleanText) bubble.appendChild(document.createElement('br'));
        }

        const textSpan = document.createElement('span');
        if (role === 'assistant' && typeof marked !== 'undefined') textSpan.innerHTML = marked.parse(cleanText);
        else textSpan.textContent = cleanText;
        bubble.appendChild(textSpan);

        wrapper.appendChild(avatar); wrapper.appendChild(bubble);
        messagesContainer.appendChild(wrapper); messagesContainer.scrollTop = messagesContainer.scrollHeight;

        if (save) {
            chatHistory.push({ role, content: text, attachment });
            saveHistory();
            if (role === 'assistant' && !isPanelOpen) toggleNotificationDot(true);
        }
        return true;
    }

    if (chatHistory.length === 0) {
        appendMessage("Hallo! Ich bin Joule. Wie kann ich dir heute helfen?", "assistant", null, true);
    } else {
        chatHistory = chatHistory.map(m => ({ role: m.role === 'bot' ? 'assistant' : m.role, content: m.content, attachment: m.attachment }));
        messagesContainer.innerHTML = "";
        chatHistory.forEach(m => {
            appendMessage(m.content, m.role, m.attachment, false);
        });
    }


    function showTyping() {
        const wrapper = document.createElement('div');
        wrapper.className = 'ai-message ai-message--bot ai-typing';
        const avatar = document.createElement('div');
        avatar.className = 'ai-message-avatar'; avatar.textContent = 'J';
        const bubble = document.createElement('div'); bubble.className = 'ai-message-bubble';
        for (let i = 0; i < 3; i++) {
            const dot = document.createElement('span'); dot.className = 'ai-typing-dot';
            bubble.appendChild(dot);
        }
        wrapper.appendChild(avatar); wrapper.appendChild(bubble);
        messagesContainer.appendChild(wrapper); messagesContainer.scrollTop = messagesContainer.scrollHeight;
        return wrapper;
    }

    async function sendMessage() {
        const text = input.value.trim();
        if (!text && !activeAttachment) return;

        let userMsgContent = text;
        const currentAttachment = activeAttachment;
        if (currentAttachment) {
            const t = currentAttachment;
            userMsgContent = `[ANGEHÄNGTE TRANSAKTION: ${t.name || t.kategorie}, Kat: ${t.kategorie}, Wert: ${t.wert}€, Datum: ${t.timestamp}, Von: ${t.sender}, An: ${t.empfaenger}] \n\n` + (text || "Analysiere diese Transaktion.");
            activeAttachment = null;
            attachmentArea.style.display = 'none';
        }

        appendMessage(text || "Analysiere Transaktion...", 'user', currentAttachment, true);
        // We update the content in history to include the technical attachment info for the AI
        chatHistory[chatHistory.length - 1].content = userMsgContent;
        saveHistory();

        input.value = ''; input.style.height = 'auto'; sendBtn.disabled = true;
        let typingEl = showTyping();

        async function getAIResponse(history) {
            const chatMessages = [{ role: 'system', content: SYSTEM_PROMPT }].concat(history);
            try {
                const response = await fetch(API_PROXY, {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ messages: chatMessages })
                });
                
                if (!response.ok) {
                    const errorText = await response.text();
                    console.error("API Error:", response.status, errorText);
                    throw new Error("Fehler bei der Kommunikation mit dem Server.");
                }

                const result = await response.json();
                if (!result.choices || !result.choices.length || !result.choices[0].message) {
                    console.error("Unexpected API response format:", result);
                    throw new Error("Ungültige Antwort vom KI-Dienst.");
                }
                
                return result.choices[0].message.content;
            } catch (error) {
                console.error("getAIResponse failed:", error);
                throw error;
            }
        }

        try {
            let reply = await getAIResponse(chatHistory);
            
            // Clean up markdown code blocks if AI wraps the JSON in them
            const cleanReply = reply.replace(/```json\n|\n```/g, '');
            
            for (let i = 0; i < 3; i++) {
                // More robust regex to catch QUERY even if wrapped in text or markdown
                const qM = cleanReply.match(/QUERY:\s*(\{[\s\S]*?\})/);
                const aM = cleanReply.match(/ADD_TRANSACTION:\s*(\{[\s\S]*?\})/);
                
                if (qM) {
                    const criteria = JSON.parse(qM[1]);
                    
                    // Build clean filter for UI
                    const forceData = {};
                    if (criteria.category) forceData.category = criteria.category;
                    if (criteria.date) forceData.date = (criteria.date === 'all' ? '' : criteria.date);
                    if (criteria.name) forceData.search = (criteria.name === 'all' ? '' : criteria.name);
                    
                    document.dispatchEvent(new CustomEvent('forceFilter', { detail: forceData }));

                    let url = `/api/transactions?limit=20`;
                    if (criteria.category && criteria.category !== 'all') url += `&category=${encodeURIComponent(criteria.category)}`;
                    if (criteria.name && criteria.name !== 'all') url += `&search=${encodeURIComponent(criteria.name)}`;
                    if (criteria.date && criteria.date !== 'all') url += `&date=${encodeURIComponent(criteria.date)}`;
                    const res = await fetch(url);
                    const data = await res.json();
                    const results = data.eintraege || [];
                    const resultMsg = `ERGEBNIS DER RECHERCHE: ` + (results.length > 0 ? `Gefunden: ` + results.map(t => `${t.name} (${t.wert}€)`).join(', ') : `Keine Einträge gefunden.`);
                    chatHistory.push({ role: 'assistant', content: reply });
                    chatHistory.push({ role: 'user', content: resultMsg });
                    reply = await getAIResponse(chatHistory);
                } 
                else if (aM) {
                    const payload = JSON.parse(aM[1]);
                    const response = await fetch('/api/transactions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
                    if (response.ok) {
                        document.dispatchEvent(new Event('dataUpdated'));
                        chatHistory.push({ role: 'assistant', content: reply });
                        chatHistory.push({ role: 'user', content: "AKTION ERFOLGREICH: Die Transaktion wurde gespeichert." });
                        reply = await getAIResponse(chatHistory);
                    } else break;
                }
                else break;
            }
            if (typingEl) typingEl.remove();
            if (!appendMessage(reply, 'assistant', null, true)) appendMessage("Ich konnte die gewünschten Informationen finden.", "assistant", null, true);
        } catch (err) {
            console.error(err);
            if (typingEl) typingEl.remove();
            appendMessage('Fehler bei der Kommunikation.', 'assistant', null, true);
        } finally { sendBtn.disabled = false; }
    }
})();
