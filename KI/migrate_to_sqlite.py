import sqlite3
import json
import os

DB_PATH = "../App/db/transactions.db"
JSON_PATH = "../database.json"

def migrate():
    # Verbindung herstellen
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Tabelle erstellen
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS transactions (
            id INTEGER PRIMARY KEY,
            name TEXT,
            kategorie TEXT,
            wert REAL,
            timestamp TEXT
        )
    ''')
    
    # Bestehende Daten laden
    if os.path.exists(JSON_PATH):
        with open(JSON_PATH, 'r', encoding='utf-8') as f:
            data = json.load(f)
            entries = data.get("eintraege", [])
            
            for e in entries:
                # Prüfen ob ID schon existiert
                cursor.execute("SELECT id FROM transactions WHERE id = ?", (e['id'],))
                if not cursor.fetchone():
                    cursor.execute(
                        "INSERT INTO transactions (id, name, kategorie, wert, timestamp) VALUES (?, ?, ?, ?, ?)",
                        (e['id'], e['name'], e['kategorie'], e['wert'], e['timestamp'])
                    )
    
    conn.commit()
    conn.close()
    print(f"✅ Migration zu {DB_PATH} abgeschlossen.")

if __name__ == "__main__":
    migrate()
