(function () {
    // ── API-Proxy-Konfiguration (sicher: kein Key im Frontend) ───────────────
    const API_PROXY = '/api/chat'; // Serverseitiger Groq-Proxy

    const SYSTEM_PROMPT =
        'You are Joule, a friendly AI assistant for an SAP finance dashboard. ' +
        'Answer questions precisely and in English unless the user uses another language.' +
        'Keep it short and compact.';

    // Conversation history for multi-turn context
    const chatHistory = [];
    // ─────────────────────────────────────────────────────────────────────────

    // Inject panel HTML into the page
    document.body.insertAdjacentHTML('beforeend', `
        <div class="ai-chat-overlay" id="aiChatOverlay"></div>
        <aside class="ai-chat-panel" id="aiChatPanel" aria-label="Joule">
            <div class="ai-chat-header">
                <div class="ai-chat-title">
                    <span class="ai-chat-icon">
                        <img src="../assets/icons/joule_logo.png" alt="AI Assistant">
                    </span>
                    <span>Joule</span>
                </div>
                <button class="ai-chat-close" id="aiChatClose" aria-label="Close">&times;</button>
            </div>

            <div class="ai-chat-messages" id="aiChatMessages">
                <div class="ai-message ai-message--bot">
                    <div class="ai-message-avatar">J</div>
                    <div class="ai-message-bubble">
                        Hello! I am Joule. How can I help you today?
                    </div>
                </div>
            </div>

            <div class="ai-chat-input-area">
                <textarea
                    class="ai-chat-input"
                    id="aiChatInput"
                    placeholder="Enter message…"
                    rows="1"
                    aria-label="Enter message"
                ></textarea>
                <button class="ai-chat-send" id="aiChatSend" aria-label="Send">
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

    let helpBubble = null;
    let helpTimer = null;

    function openChat() {
        panel.classList.add('open');
        overlay.classList.add('open');
        input.focus();
        hideHelpBubble();
    }

    function hideHelpBubble() {
        if (helpBubble) {
            helpBubble.classList.remove('show');
            setTimeout(() => helpBubble.remove(), 500);
            helpBubble = null;
        }
        if (helpTimer) {
            clearTimeout(helpTimer);
            helpTimer = null;
        }
    }

    function showHelpBubble() {
        if (panel.classList.contains('open')) return;
        
        helpBubble = document.createElement('div');
        helpBubble.className = 'joule-help-bubble';
        helpBubble.textContent = 'Do you need help?';
        document.body.appendChild(helpBubble);
        
        // Small delay for animation
        setTimeout(() => helpBubble.classList.add('show'), 10);
        
        helpBubble.addEventListener('click', openChat);
    }

    // Start timer: show after 1 minute (60,000ms)
    function startHelpTimer() {
        helpTimer = setTimeout(showHelpBubble, 60000); 
    }

    closeBtn.addEventListener('click', closeChat);
    overlay.addEventListener('click', closeChat);

    // Escape key closes the panel
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') closeChat();
    });

    // Link diamond button only after full DOM parse
    document.addEventListener('DOMContentLoaded', function () {
        const diamondBtn = document.querySelector('.diamond-btn');
        if (diamondBtn) {
            diamondBtn.addEventListener('click', openChat);
            startHelpTimer();
        }
    });

    // Fallback: if DOMContentLoaded has already fired
    if (document.readyState !== 'loading') {
        const diamondBtn = document.querySelector('.diamond-btn');
        if (diamondBtn) {
            diamondBtn.addEventListener('click', openChat);
            startHelpTimer();
        }
    }

    // Auto-expand textarea
    input.addEventListener('input', function () {
        this.style.height = 'auto';
        this.style.height = Math.min(this.scrollHeight, 120) + 'px';
    });

    // Enter = Send, Shift+Enter = New Line
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
        avatar.textContent = role === 'user' ? 'You' : 'J';

        const bubble = document.createElement('div');
        bubble.className = 'ai-message-bubble';
        
        // Markdown support for bot replies
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

        // Add message to history (OpenAI format)
        chatHistory.push({ role: 'user', content: text });

        const typingEl = showTyping();

        // System prompt + history as messages array
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
                    : 'Error ' + status;
                chatHistory.pop();
                typingEl.remove();
                appendMessage('Error: ' + msg, 'bot');
                return;
            }
            if (!data.choices || !data.choices[0]) {
                typingEl.remove();
                appendMessage('No response received from AI.', 'bot');
                return;
            }
            const reply = data.choices[0].message.content;
            chatHistory.push({ role: 'assistant', content: reply });
            typingEl.remove();
            appendMessage(reply, 'bot');
        })
        .catch(function () {
            typingEl.remove();
            appendMessage('Connection error. Is the server running on localhost:3000?', 'bot');
        })
        .finally(function () {
            sendBtn.disabled = false;
        });
    }
})();
})();
