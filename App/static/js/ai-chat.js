(function () {
    // ── API-Proxy-Konfiguration (sicher: kein Key im Frontend) ───────────────
    const API_PROXY = '/api/chat'; // Serverseitiger Groq-Proxy

    const SYSTEM_PROMPT =
        'Du bist Joule, ein freundlicher KI-Assistent für ein SAP-Finanz-Dashboard. ' +
        'Beantworte Fragen präzise und auf Deutsch, sofern der Nutzer nicht eine andere Sprache verwendet.' +
        'Halte dich kurz kompakt.';

    // Gesprächsverlauf für Multi-Turn-Kontext
    const chatHistory = [];
    // ─────────────────────────────────────────────────────────────────────────

    // Panel-HTML in die Seite injizieren
    document.body.insertAdjacentHTML('beforeend', `
        <div class="ai-chat-overlay" id="aiChatOverlay"></div>
        <aside class="ai-chat-panel" id="aiChatPanel" aria-label="Joule">
            <div class="ai-chat-header">
                <div class="ai-chat-title">
                    <span class="ai-chat-icon">
                        <img src="../assets/icons/joule_logo.png" alt="KI-Assistent">
                    </span>
                    <span>Joule</span>
                </div>
                <button class="ai-chat-close" id="aiChatClose" aria-label="Schließen">&times;</button>
            </div>

            <div class="ai-chat-messages" id="aiChatMessages">
                <div class="ai-message ai-message--bot">
                    <div class="ai-message-avatar">J</div>
                    <div class="ai-message-bubble">
                        Hallo! Ich bin Joule. Wie kann ich dir heute helfen?
                    </div>
                </div>
            </div>

            <div class="ai-chat-input-area">
                <textarea
                    class="ai-chat-input"
                    id="aiChatInput"
                    placeholder="Nachricht eingeben…"
                    rows="1"
                    aria-label="Nachricht eingeben"
                ></textarea>
                <button class="ai-chat-send" id="aiChatSend" aria-label="Senden">
                    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                        <path d="M2 21l21-9L2 3v7l15 2-15 2v7z"/>
                    </svg>
                </button>
            </div>
        </aside>
    `);

    const panel    = document.getElementById('aiChatPanel');
    const overlay  = document.getElementById('aiChatOverlay');
    const closeBtn = document.getElementById('aiChatClose');
    const input    = document.getElementById('aiChatInput');
    const sendBtn  = document.getElementById('aiChatSend');
    const messages = document.getElementById('aiChatMessages');

    function openChat() {
        panel.classList.add('open');
        overlay.classList.add('open');
        input.focus();
    }

    function closeChat() {
        panel.classList.remove('open');
        overlay.classList.remove('open');
    }

    closeBtn.addEventListener('click', closeChat);
    overlay.addEventListener('click', closeChat);

    // Escape-Taste schließt das Panel
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') closeChat();
    });

    // Diamant-Button erst nach vollständigem DOM-Parse verknüpfen
    document.addEventListener('DOMContentLoaded', function () {
        const diamondBtn = document.querySelector('.diamond-btn');
        if (diamondBtn) diamondBtn.addEventListener('click', openChat);
    });

    // Fallback: falls DOMContentLoaded bereits gefeuert hat
    if (document.readyState !== 'loading') {
        const diamondBtn = document.querySelector('.diamond-btn');
        if (diamondBtn) diamondBtn.addEventListener('click', openChat);
    }

    // Textarea automatisch mitwachsen lassen
    input.addEventListener('input', function () {
        this.style.height = 'auto';
        this.style.height = Math.min(this.scrollHeight, 120) + 'px';
    });

    // Enter = Senden, Shift+Enter = neue Zeile
    input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    sendBtn.addEventListener('click', sendMessage);

    function appendMessage(text, role) {
        const wrapper = document.createElement('div');
        wrapper.className = 'ai-message ai-message--' + role;

        const avatar = document.createElement('div');
        avatar.className = 'ai-message-avatar';
        avatar.textContent = role === 'user' ? 'Du' : 'J';

        const bubble = document.createElement('div');
        bubble.className = 'ai-message-bubble';
        
        // Markdown-Unterstützung für Bot-Antworten
        if (role === 'bot' && typeof marked !== 'undefined') {
            bubble.innerHTML = marked.parse(text);
        } else {
            bubble.textContent = text;
        }

        wrapper.appendChild(avatar);
        wrapper.appendChild(bubble);
        messages.appendChild(wrapper);
        messages.scrollTop = messages.scrollHeight;
    }

    function showTyping() {
        const wrapper = document.createElement('div');
        wrapper.className = 'ai-message ai-message--bot ai-typing';

        const avatar = document.createElement('div');
        avatar.className = 'ai-message-avatar';
        avatar.textContent = 'J';

        const bubble = document.createElement('div');
        bubble.className = 'ai-message-bubble';
        for (let i = 0; i < 3; i++) {
            const dot = document.createElement('span');
            dot.className = 'ai-typing-dot';
            bubble.appendChild(dot);
        }

        wrapper.appendChild(avatar);
        wrapper.appendChild(bubble);
        messages.appendChild(wrapper);
        messages.scrollTop = messages.scrollHeight;
        return wrapper;
    }

    function sendMessage() {
        const text = input.value.trim();
        if (!text) return;

        appendMessage(text, 'user');
        input.value = '';
        input.style.height = 'auto';
        sendBtn.disabled = true;

        // Nachricht zum Verlauf hinzufügen (OpenAI-Format)
        chatHistory.push({ role: 'user', content: text });

        const typingEl = showTyping();

        // System-Prompt + Verlauf als messages-Array
        const messages = [{ role: 'system', content: SYSTEM_PROMPT }].concat(chatHistory);

        fetch(API_PROXY, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ messages: messages })
        })
        .then(function (res) {
            return res.json().then(function (data) {
                return { status: res.status, data: data };
            });
        })
        .then(function (result) {
            const status = result.status;
            const data   = result.data;

            if (status >= 400) {
                const msg = (data.error && (data.error.message || data.error))
                    ? (data.error.message || data.error)
                    : 'Fehler ' + status;
                chatHistory.pop();
                typingEl.remove();
                appendMessage('Fehler: ' + msg, 'bot');
                return;
            }
            if (!data.choices || !data.choices[0]) {
                typingEl.remove();
                appendMessage('Keine Antwort von der KI erhalten.', 'bot');
                return;
            }
            const reply = data.choices[0].message.content;
            chatHistory.push({ role: 'assistant', content: reply });
            typingEl.remove();
            appendMessage(reply, 'bot');
        })
        .catch(function () {
            typingEl.remove();
            appendMessage('Verbindungsfehler. Läuft der Server auf localhost:3000?', 'bot');
        })
        .finally(function () {
            sendBtn.disabled = false;
        });
    }
})();
