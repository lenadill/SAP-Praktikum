import os

server_path = "../server.js"
with open(server_path, "r", encoding="utf-8") as f:
    content = f.read()

old_prompt = 'const systemContent = "Du bist Joule, ein SAP-Finanz-Assistent. " +'
new_prompt = 'const systemContent = "Du bist Joule, ein SAP-Finanz-Assistent und Support-Spezialist. " +'

content = content.replace(old_prompt, new_prompt)

# Zusätzliche Support-Infos im Prompt
old_tail = '                     "\\nBeantworte Fragen basierend auf diesen Daten. Sei präzise und freundlich.";'
new_tail = """                     "\\nZusätzlich zum Finanz-Kontext bist du Experte für den Support: " +
                     "\\n- Bei Fragen zur Datensicherheit: Betone SAP-Verschlüsselungsstandards." +
                     "\\n- Bei Fragen zu Reports: Erkläre, dass diese im Dashboard exportiert werden können." +
                     "\\n- Bei technischen Problemen: Verweise auf das Kontaktformular auf der Support-Seite." +
                     "\\nBeantworte Fragen basierend auf diesen Daten. Sei präzise und freundlich.";"""

content = content.replace(old_tail, new_tail)

with open(server_path, "w", encoding="utf-8") as f:
    f.write(content)
print("✅ Server System-Prompt für Support erweitert.")
