import sqlite3

DB_PATH = "../App/db/transactions.db"

def upgrade():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    try:
        cursor.execute("ALTER TABLE transactions ADD COLUMN sender TEXT")
        print("✅ Spalte 'sender' hinzugefügt.")
    except sqlite3.OperationalError:
        print("ℹ️  Spalte 'sender' existiert bereits.")
        
    try:
        cursor.execute("ALTER TABLE transactions ADD COLUMN empfaenger TEXT")
        print("✅ Spalte 'empfaenger' hinzugefügt.")
    except sqlite3.OperationalError:
        print("ℹ️  Spalte 'empfaenger' existiert bereits.")
        
    conn.commit()
    conn.close()

if __name__ == "__main__":
    upgrade()
