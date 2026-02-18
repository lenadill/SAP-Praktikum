(function () {
    // Panel-HTML in die Seite injizieren
    document.body.insertAdjacentHTML('beforeend', `
        <div class="ai-chat-overlay" id="aiChatOverlay"></div>
        <aside class="ai-chat-panel" id="aiChatPanel" aria-label="KI-Assistent">
            <div class="ai-chat-header">
                <div class="ai-chat-title">
                    <span class="ai-chat-icon">
                        <img src="../assets/icons/jules_logo.png" alt="KI-Assistent">
                    </span>
                    <span>KI-Assistent</span>
                </div>
                <button class="ai-chat-close" id="aiChatClose" aria-label="Schließen">&times;</button>
            </div>

            <div class="ai-chat-messages" id="aiChatMessages">
                <div class="ai-message ai-message--bot">
                    <div class="ai-message-avatar">KI</div>
                    <div class="ai-message-bubble">
                        Hallo! Ich bin dein KI-Assistent. Wie kann ich dir heute helfen?
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
        avatar.textContent = role === 'user' ? 'Du' : 'KI';

        const bubble = document.createElement('div');
        bubble.className = 'ai-message-bubble';
        bubble.textContent = text;

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
        avatar.textContent = 'KI';

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

        // Platzhalter-Antwort – hier später echte KI-API einbinden
        const typingEl = showTyping();
        setTimeout(function () {
            typingEl.remove();
            appendMessage('Das ist eine Platzhalter-Antwort. Hier kann eine echte KI-API eingebunden werden.', 'bot');
        }, 1200);
    }
})();
