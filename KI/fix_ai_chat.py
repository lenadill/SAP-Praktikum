content = r"""(function () {
    const API_PROXY = '/api/chat';
    const SYSTEM_PROMPT = 'Du bist Joule, ein freundlicher KI-Assistent für ein SAP-Finanz-Dashboard. Beantworte Fragen präzise und auf Deutsch.';
    const chatHistory = [];

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
                    <div class="ai-message-bubble">Hallo! Ich bin Joule. Wie kann ich dir heute helfen?</div>
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
    const closeBtn = document.getElementById('aiChatClose');
    const input = document.getElementById('aiChatInput');
    const sendBtn = document.getElementById('aiChatSend');
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

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeChat();
    });

    function setupButton() {
        const diamondBtn = document.querySelector('.diamond-btn');
        if (diamondBtn) {
            diamondBtn.addEventListener('click', openChat);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setupButton);
    } else {
        setupButton();
    }

    input.addEventListener('input', function () {
        this.style.height = 'auto';
        this.style.height = Math.min(this.scrollHeight, 120) + 'px';
    });

    input.addEventListener('keydown', (e) => {
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

        chatHistory.push({ role: 'user', content: text });
        const typingEl = showTyping();

        const chatMessages = [{ role: 'system', content: SYSTEM_PROMPT }].concat(chatHistory);

        fetch(API_PROXY, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ messages: chatMessages })
        })
        .then(res => res.json().then(data => ({ status: res.status, data: data })))
        .then(result => {
            typingEl.remove();
            if (result.status >= 400) {
                appendMessage('Fehler: ' + (result.data.error?.message || result.status), 'bot');
                return;
            }
            const reply = result.data.choices[0].message.content;
            chatHistory.push({ role: 'assistant', content: reply });
            appendMessage(reply, 'bot');
        })
        .catch(() => {
            typingEl.remove();
            appendMessage('Verbindungsfehler zum Server.', 'bot');
        })
        .finally(() => {
            sendBtn.disabled = false;
        });
    }
})();"""

with open("../App/static/js/ai-chat.js", "w", encoding="utf-8") as f:
    f.write(content)
