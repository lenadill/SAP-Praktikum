import os

support_path = "../App/templates/support.html"

new_content = """<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Support - Joule Assistant</title>
    <link rel="stylesheet" href="../static/css/style.css">
    <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
    <style>
        .support-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-top: 20px;
        }
        .support-card {
            background: white;
            padding: 20px;
            border-radius: 12px;
            box-shadow: 0 4px 10px rgba(0,0,0,0.05);
        }
        .support-card h2 {
            margin-top: 0;
            color: #0070d2;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .faq-item {
            margin-bottom: 15px;
            border-bottom: 1px solid #eee;
            padding-bottom: 10px;
        }
        .faq-question {
            font-weight: bold;
            color: #333;
            cursor: pointer;
        }
        .faq-answer {
            color: #666;
            font-size: 0.9em;
            margin-top: 5px;
        }
        .joule-promo {
            background: linear-gradient(135deg, #f0f7ff 0%, #e0efff 100%);
            border: 1px solid #c2e0ff;
        }
        .joule-promo-btn {
            background: #0070d2;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 6px;
            cursor: pointer;
            font-weight: bold;
            margin-top: 10px;
            transition: background 0.2s;
        }
        .joule-promo-btn:hover {
            background: #005fb2;
        }
    </style>
</head>
<body>
    <div class="container">
        <aside class="sidebar">
            <div class="sidebar-header">
                <img src="../assets/pictures/sap_logo.png" alt="SAP" class="sidebar-logo">
            </div>
            <nav>
                <ul class="menu">
                    <li class="menu-item"><a href="index.html"><span>Home</span></a></li>
                    <li class="menu-item"><a href="dashboard.html"><span>Dashboard</span></a></li>
                    <li class="menu-item"><a href="settings.html"><span>Settings</span></a></li>
                    <li class="menu-item active"><a href="support.html"><span>Support</span></a></li>
                </ul>
            </nav>
            <div class="sidebar-footer">
                <a href="logout.html" class="logout-btn">Log Out</a>
            </div>
        </aside>

        <main class="main-content">
            <div class="header">
                <h1>Hilfe & Support</h1>
            </div>

            <div class="support-grid">
                <!-- Joule Integration -->
                <div class="support-card joule-promo">
                    <h2>
                        <img src="../assets/icons/joule_logo.png" alt="Joule" style="height: 24px;">
                        Joule KI-Assistent
                    </h2>
                    <p>Haben Sie Fragen zu Ihren Finanzdaten oder benötigen Sie Hilfe bei der Bedienung? Joule ist rund um die Uhr für Sie da.</p>
                    <p><strong>Was Joule kann:</strong></p>
                    <ul>
                        <li>Analysen Ihrer Transaktionen</li>
                        <li>Erklärung von Dashboard-Funktionen</li>
                        <li>Tipps zur Budgetplanung</li>
                    </ul>
                    <button class="joule-promo-btn" onclick="openJouleSupport()">Jetzt mit Joule chatten</button>
                </div>

                <!-- FAQ Section -->
                <div class="support-card">
                    <h2>Häufig gestellte Fragen</h2>
                    <div class="faq-item">
                        <div class="faq-question">Wie aktualisiere ich meine Daten?</div>
                        <div class="faq-answer">Ihre Finanzdaten werden automatisch synchronisiert, sobald neue Transaktionen verbucht werden.</div>
                    </div>
                    <div class="faq-item">
                        <div class="faq-question">Sind meine Daten sicher?</div>
                        <div class="faq-answer">Ja, alle Daten werden nach höchsten SAP-Sicherheitsstandards verschlüsselt verarbeitet.</div>
                    </div>
                    <div class="faq-item">
                        <div class="faq-question">Wie erstelle ich einen neuen Report?</div>
                        <div class="faq-answer">Gehen Sie zum Dashboard und klicken Sie auf "Exportieren" oder fragen Sie Joule: "Erstelle mir einen Monatsbericht".</div>
                    </div>
                </div>
            </div>

            <div class="support-card" style="margin-top: 20px;">
                <h2>Kontaktieren Sie uns</h2>
                <p>Konnte Joule Ihnen nicht weiterhelfen? Unser Team steht Ihnen zur Verfügung.</p>
                <form id="supportForm" onsubmit="event.preventDefault(); alert('Vielen Dank! Wir haben Ihre Anfrage erhalten.');">
                    <div style="margin-bottom: 10px;">
                        <input type="text" placeholder="Betreff" style="width: 100%; padding: 8px; border-radius: 4px; border: 1px solid #ccc;">
                    </div>
                    <div style="margin-bottom: 10px;">
                        <textarea placeholder="Ihre Nachricht..." style="width: 100%; height: 80px; padding: 8px; border-radius: 4px; border: 1px solid #ccc;"></textarea>
                    </div>
                    <button type="submit" class="joule-promo-btn" style="background: #333;">Anfrage senden</button>
                </form>
            </div>
        </main>
    </div>

    <script src="../static/js/ai-chat.js"></script>
    <button class="diamond-btn" title="KI-Assistent öffnen" aria-label="KI-Chat öffnen">
        <img src="../assets/icons/joule_logo.png" alt="KI-Assistent">
    </button>

    <script>
        function openJouleSupport() {
            // Die Funktion openChat() ist in ai-chat.js definiert, 
            // wir müssen sicherstellen, dass sie global oder über das DOM erreichbar ist.
            // Alternativ simulieren wir einen Klick auf den Diamant-Button:
            const diamondBtn = document.querySelector('.diamond-btn');
            if (diamondBtn) {
                diamondBtn.click();
                
                // Optional: Kurze Verzögerung und dann eine Begrüßung senden
                setTimeout(() => {
                    const input = document.getElementById('aiChatInput');
                    if (input) {
                        input.value = "Ich brauche Hilfe beim Support.";
                        // Wir könnten hier auch automatisch senden, aber den User tippen zu lassen ist oft besser.
                    }
                }, 500);
            }
        }
    </script>
</body>
</html>
"""

with open(support_path, "w", encoding="utf-8") as f:
    f.write(new_content)
