#!/usr/bin/env python3
"""
Joule – Groq API Key-Test & interaktiver Chat
---------------------------------------------
Liest den Key aus .env (ein Ordner höher) oder fragt ihn ab.
Beenden mit 'exit', 'quit' oder Ctrl+C.
"""

import os
import sys
import json
import urllib.request
import urllib.error

# ── Key laden ────────────────────────────────────────────────────────────────
def load_key():
    # .env liegt im übergeordneten Ordner (SAP-Praktikum/)
    env_path = os.path.join(os.path.dirname(__file__), "..", ".env")
    if os.path.exists(env_path):
        with open(env_path) as f:
            for line in f:
                line = line.strip()
                if line.startswith("GROQ_API_KEY"):
                    key = line.split("=", 1)[1].strip().strip('"').strip("'")
                    if key:
                        return key
    key = os.environ.get("GROQ_API_KEY", "")
    if key:
        return key
    return input("Kein Key in .env gefunden. Groq API-Key eingeben: ").strip()

# ── Groq-Anfrage ──────────────────────────────────────────────────────────────
MODEL    = "llama-3.3-70b-versatile"
GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"

SYSTEM_PROMPT = (
    "Du bist Joule, ein freundlicher KI-Assistent für ein SAP-Finanz-Dashboard. "
    "Beantworte Fragen präzise und auf Deutsch, sofern der Nutzer nicht eine andere Sprache verwendet."
)

def ask(api_key: str, history: list) -> str:
    messages = [{"role": "system", "content": SYSTEM_PROMPT}] + history
    payload  = json.dumps({"model": MODEL, "messages": messages}).encode()

    req = urllib.request.Request(
        GROQ_URL,
        data=payload,
        headers={
            "Content-Type":  "application/json",
            "Authorization": f"Bearer {api_key}",
            "User-Agent":    "python-groq-client/1.0",
        },
        method="POST",
    )

    try:
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read())
            return data["choices"][0]["message"]["content"]
    except urllib.error.HTTPError as e:
        body = json.loads(e.read())
        msg  = body.get("error", {}).get("message", str(e))
        raise RuntimeError(f"HTTP {e.code}: {msg}")

# ── Key-Test ──────────────────────────────────────────────────────────────────
def test_key(api_key: str) -> bool:
    print("\nTeste API-Key …", end=" ", flush=True)
    try:
        reply = ask(api_key, [{"role": "user", "content": "Sag nur: OK"}])
        print(f"✓ Verbindung OK  →  Joule sagt: \"{reply.strip()}\"")
        return True
    except RuntimeError as e:
        print(f"✗ Fehler: {e}")
        return False

# ── Interaktiver Chat ─────────────────────────────────────────────────────────
def chat_loop(api_key: str):
    print("\n" + "─" * 50)
    print("  Joule – KI-Chat  (beenden: exit / Ctrl+C)")
    print("─" * 50 + "\n")

    history = []

    while True:
        try:
            user_input = input("Du: ").strip()
        except (EOFError, KeyboardInterrupt):
            print("\nChat beendet.")
            break

        if not user_input:
            continue
        if user_input.lower() in ("exit", "quit", "beenden"):
            print("Chat beendet.")
            break

        history.append({"role": "user", "content": user_input})

        try:
            reply = ask(api_key, history)
            history.append({"role": "assistant", "content": reply})
            print(f"\nJoule: {reply.strip()}\n")
        except RuntimeError as e:
            print(f"\n[Fehler] {e}\n")
            history.pop()

# ── Main ──────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    api_key = load_key()
    print(f"Key: {api_key[:8]}{'*' * (len(api_key) - 12)}{api_key[-4:]}")

    if not test_key(api_key):
        sys.exit(1)

    chat_loop(api_key)
