import json
import random
from datetime import datetime, timedelta

def generate_realistic_db(filename="database.json"):
    categories = {
        "Einkommen": ["Gehalt", "Bonus", "Zinsen"],
        "Wohnen": ["Miete", "Strom", "Wasser", "Internet"],
        "Verkehr": ["Tanken", "Bahn-Ticket", "Auto-Versicherung"],
        "Lebensmittel": ["Supermarkt", "Bäcker", "Wochenmarkt"],
        "Freizeit": ["Kino", "Restaurant", "Fitnessstudio", "Hobby"],
        "Versicherungen": ["Krankenversicherung", "Haftpflicht"],
        "Shopping": ["Kleidung", "Elektronik", "Bücher"]
    }
    
    start_date = datetime(2025, 1, 1)
    entries = []
    
    # Initiale Balance
    balance = 5000.0
    
    for i in range(150):
        date = start_date + timedelta(days=random.randint(0, 400), hours=random.randint(0, 23))
        cat = random.choice(list(categories.keys()))
        name = random.choice(categories[cat])
        
        if cat == "Einkommen":
            wert = round(random.uniform(500, 3500), 2)
        else:
            wert = -round(random.uniform(5, 1200), 2)
            
        entries.append({
            "id": int(date.timestamp() * 1000) + i,
            "name": name,
            "kategorie": cat,
            "wert": wert,
            "timestamp": date.isoformat() + "Z"
        })
    
    # Sortieren nach Datum
    entries.sort(key=lambda x: x["timestamp"])
    
    db = {"eintraege": entries}
    with open(filename, "w", encoding="utf-8") as f:
        json.dump(db, f, indent=2, ensure_ascii=False)
    
    print(f"✅ Datenbank mit {len(entries)} Einträgen erstellt: {filename}")

if __name__ == "__main__":
    generate_realistic_db("../database.json")
