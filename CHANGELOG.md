# Changelog

All notable changes to this project will be documented in this file.

## [0.3.5] - 2026-03-04
### Added
- Implementierung der Seiten "Terms of Service" (`tos.html`) und "Impressum" (`impressum.html`).
- Verknüpfung der Platzhalter-Links im Footer aller App-Seiten mit den neuen rechtlichen Dokumenten.
- Einbettung des einheitlichen Clarity-Designs (Sidebar, Header, Footer) in die rechtlichen Seiten.

## [0.3.4] - 2026-03-04
### Added
- Dynamische Filterung der Dashboard-Zeiträume: Der Selektor zeigt nun nur noch Jahre und Quartale an, für die tatsächlich Transaktionsdaten in der Datenbank existieren.

## [0.3.3] - 2026-03-04
### Changed
- Vollständige Konsolidierung der dynamischen Versionsnummerierung über alle App-Seiten.
- Integration von Versions-Tags und Footer-Informationen in `login.html` und `signup.html`.
- Sicherstellung, dass alle UI-Komponenten die Version zentral aus der `package.json` über die Config-API beziehen.

## [0.3.2] - 2026-03-04
### Changed
- Optische Überarbeitung der Startseite (`index.html`) für einen moderneren, "Clarity"-typischen Look.
- Überarbeitung des Hero-Bereichs mit neuen, weicheren Gradienten und dekorativen Elementen.
- Verbesserte Hover-Effekte und Schatten ("Glassmorphism"-Ansatz) für die Quick-Link-Cards.
- Neugestaltung des "About Us"-Bereichs mit besserer Typografie und weicheren Kontrasten.
- Integration des globalen Versions-Tags in den Header der Startseite.

## [0.3.1] - 2026-03-04
### Added
- Versionsnummer wird nun zusätzlich im Footer aller App-Seiten angezeigt (z.B. `(v0.3.1)`).
- Dynamische Befüllung aller Footer-Versionsplatzhalter via `dashboard.js`.

## [0.3.0] - 2026-03-04
### Changed
- Vollständiges Rebranding von SAP zu **Clarity**.
- Austausch aller SAP-Logos durch das neue **Clarity-Logo**.
- Entfernung sämtlicher SAP-Textreferenzen aus dem Codebase, Dokumentation und UI.
- Aktualisierung der Authentifizierungs-Keys von `sapAuth`/`sapUser` zu `clarityAuth`/`clarityUser`.
- Anpassung der Joule-System-Prompts auf ein herstellerneutrales, professionelles Clarity-Branding.
- Umbenennung des Projekts in der `package.json` zu `clarity-financial-tracker`.
- Bereinigung der Standard-Userdaten (Email, Abteilungen) von SAP-Referenzen.

## [0.2.1] - 2026-03-04
### Added
- Globale Versionsnummerierung in das Dashboard-UI integriert (Header-Anzeige).
- Upgrade des AI-Assistenten Joule auf das Modell `llama-3.3-70b-versatile`.
- Erweiterung des Joule-System-Prompts für proaktive Finanzanalysen, Trend-Identifikation und personalisierte Beratung.
- API-Erweiterung (`/api/config`) liefert nun die aktuelle App-Version an das Frontend.

## [0.2.0] - 2026-03-04
### Added
- "v2" Datenstruktur mit deutlich höherer Fluktuation der Transaktionswerte für eine dynamischere Graphenanzeige.
- Implementierung von "Spikes" (gelegentliche hohe Ausgaben) in den Kategorien Shopping und Transport.
- Erhöhung des Standardeinkommens (Gehalt) zur Kompensation der fluktuierenden Ausgaben, Sicherstellung eines robusten positiven Jahresgewinns (2025: +12.964,10 EUR).

## [0.1.2] - 2026-03-04
### Changed
- Umstellung aller Transaktionsdaten (Kategorien, Namen, Partner) auf Englisch.
- Änderung des Standard-Absenders für Ausgaben von "Maximilian Mustermann" auf "Clarity".
- Anpassung der Einkommens- und Ausgabenlogik zur Sicherstellung eines positiven Jahresgewinns (2025: +2.524,59 EUR).
- Aktualisierung der `user_config.json` auf "Clarity User".

## [0.1.1] - 2026-03-04
### Added
- Generierung von 1410 neuen, diversen Testtransaktionen ab dem 01.01.2025.
- Implementierung wiederkehrender Zahlungen (Gehalt, Miete, Internet, Streaming, Fitness).
- Neues Skript `KI/generate_diverse_transactions.py` zur Datenbankbefüllung.
