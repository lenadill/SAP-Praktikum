import os

js_path = "../App/static/js/ai-chat.js"

with open(js_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. appendMessage-Funktion anpassen: marked.parse() verwenden, wenn role == 'bot'
# Wir müssen bubble.textContent durch bubble.innerHTML ersetzen für Markdown
old_append = """    function appendMessage(text, role) {
        const wrapper = document.createElement('div');
        wrapper.className = 'ai-message ai-message--' + role;

        const avatar = document.createElement('div');
        avatar.className = 'ai-message-avatar';
        avatar.textContent = role === 'user' ? 'Du' : 'J';

        const bubble = document.createElement('div');
        bubble.className = 'ai-message-bubble';
        bubble.textContent = text;

        wrapper.appendChild(avatar);
        wrapper.appendChild(bubble);
        messages.appendChild(wrapper);
        messages.scrollTop = messages.scrollHeight;
    }"""

new_append = """    function appendMessage(text, role) {
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
    }"""

if old_append in content:
    content = content.replace(old_append, new_append)
    with open(js_path, "w", encoding="utf-8") as f:
        f.write(content)
    print("✅ ai-chat.js erfolgreich für Markdown (marked.js) aktualisiert.")
else:
    print("❌ Konnte appendMessage-Funktion in ai-chat.js nicht finden.")

