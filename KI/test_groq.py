import os
import requests
from dotenv import load_dotenv

# .env Datei laden
load_dotenv()

def test_groq():
    # Wir laden den Key direkt aus os.environ, nachdem load_dotenv() die .env Datei geladen hat.
    api_key = os.getenv("GROQ_API_KEY")
    
    if not api_key:
        print("Fehler: GROQ_API_KEY wurde in der .env Datei nicht gefunden.")
        return

    # Groq API Konfiguration
    # Groq ist OpenAI-kompatibel
    url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    
    # Test-Payload (Aktuelles Groq-Modell)
    data = {
        "model": "llama-3.3-70b-versatile",
        "messages": [
            {"role": "user", "content": "Hallo Groq! Schreib einen kurzen Satz, um zu zeigen, dass du funktionierst."}
        ]
    }

    print("Sende Testanfrage an Groq...")
    
    try:
        response = requests.post(url, headers=headers, json=data)
        response.raise_for_status()
        
        result = response.json()
        message = result['choices'][0]['message']['content']
        
        print("\nGroq Antwort:")
        print("-" * 20)
        print(message)
        print("-" * 20)
        print("\nTest erfolgreich!")
        
    except requests.exceptions.RequestException as e:
        print(f"\nFehler bei der Anfrage: {e}")
        try:
            # Falls vorhanden, zeige Fehlermeldung der API
            print(f"Server-Antwort: {e.response.text}")
        except:
            pass

if __name__ == "__main__":
    test_groq()
