# Testprotokoll AttendanceCTRL – Frontend

## 1. Testumgebung und Stand

- Frontend: React, TypeScript, Vite, Material UI; lokal unter http://localhost:5173
- Backend: Spring Boot, PostgreSQL 16 und Mosquitto in Docker
- Testkonto: `admin`; synthetische Demo-Daten
- Klassen: 10A, 10B, 11A (26 Schüler; 190 Anwesenheitsdatensätze unmittelbar nach dem Seed)
- Bisheriger Testzeitraum: 18.–21.11.2026; weitere Prüfungen vorgesehen
- Frontend-Branch: `feature/marya-work`, gemeldeter Stand: `dafca12`

Status: **bestanden** = berichteter oder sichtbarer Nachweis vorhanden; **teilweise** = nur ein Teil der Prüfung nachgewiesen; **offen** = noch kein ausreichender Nachweis; **nicht bestanden** = tatsächliche Abweichung festgestellt.

## 2. Automatisierte Tests

| Nr. | Prüfung | Ergebnis | Status / Nachweis |
|---|---|---|---|
| A1 | `npm test` | 14 Testdateien, 81 Tests laut gemeldetem Stand | bestanden; aktuellen Terminal-Screenshot ergänzen |
| A2 | `npm run build` | TypeScript-Prüfung und Produktions-Build erfolgreich laut gemeldetem Stand | bestanden; aktuellen Terminal-Screenshot ergänzen |

## 3. Manuelle Tests

| Nr. | Testfall | Erwartetes Ergebnis | Tatsächliches Ergebnis | Status |
|---|---|---|---|---|
| T01 | Login mit gültigen Daten | App öffnet sich, Benutzername im Header | App und Benutzername `admin` sichtbar | bestanden |
| T02 | Login mit falschem Passwort | Anmeldung abgelehnt, Fehlermeldung | Noch nicht geprüft | offen |
| T03 | Ungültiger Token beim Start | Rückkehr zur Login-Seite | Automatische Unit-Tests vorhanden; Browser-Test offen | offen |
| T04 | Klassen laden | Dropdown zeigt 10A, 10B, 11A | Alle drei Klassen sichtbar | bestanden |
| T05 | Anwesenheit 18.11.2026, 10A | 10 Schüler, 0 anwesend, 3 verspätet, 7 abwesend | Werte im Browser vor letzter Statistikänderung sichtbar | bestanden; Regressionstest empfohlen |
| T06 | Anwesenheit 22.11.2026, 10A | Hinweis: keine erfassten Anwesenheitsinformationen; Abwesend 0, Prozentwert „–“, keine Fehlenden-Warnung | Browser-Nachweis nach Korrektur fehlt | offen |
| T07 | Manueller Check-in | Check-in-Zeit und passender Status erscheinen | Historische Check-in-Zeiten vorhanden; Ausführung und Ergebnis der manuellen Aktion nochmals nachvollziehbar dokumentieren | teilweise |
| T08 | Manueller Check-out | Check-out-Zeit wird angezeigt | Historische Check-out-Zeiten vorhanden; manuelle Aktion nochmals nachvollziehbar dokumentieren | teilweise |
| T09 | Aktionen nach Check-out | Ein- und Auschecken nicht mehr angeboten; Bearbeiten bei vorhandenem Datensatz weiterhin möglich | Aktuelle Aktionslogik automatisiert getestet; Browser-Prüfung offen | offen |
| T10 | Bearbeiten: Check-out vor Check-in | Validierungsfehler; keine Speicherung der ungültigen Eingaben | Fehlermeldung im Dialog sichtbar; unterbliebene PUT-Anfrage noch nicht separat belegt | teilweise |
| T11 | Bearbeiten: Beschreibung speichern | Erfolgsmeldung und aktualisierter DB-Wert; übrige Felder bleiben wie vorgesehen erhalten | Noch nicht geprüft | offen |
| T12 | Suche in Anwesenheitsliste | Nur passende Schüler werden angezeigt | Gefilterte Liste mit einem Ergebnis sichtbar; konkreten Suchbegriff erneut dokumentieren | teilweise |
| T13 | Statusfilter | Nur Zeilen mit dem gewählten Status | Noch nicht geprüft | offen |
| T14 | CSV-Export Anwesenheit | Datei enthält erwartete Zeilen, Spalten und korrekte Zeichenkodierung | Noch nicht geprüft | offen |
| T15 | Automatische Aktualisierung | Heute wiederholte erfolgreiche Abfragen ohne störende Ladeanzeige; historisches Datum ohne Polling | Wiederholte HTTP-200-Anfragen heute sichtbar; Timer-Stopp bei historischem Datum noch eindeutig nachweisen | teilweise |
| T16 | Schülerseite: Klassenfilter und Suche | 26 Schüler, passende gefilterte Ergebnisse | 26 Schüler und drei Filteroptionen sichtbar; Filterergebnis und Suche noch dokumentieren | teilweise |
| T17 | Klassenseite | Raum, Schülerzahl und Stundenplan je Klasse | Alle drei Klassen mit Räumen, Zahlen und Stundenplänen sichtbar | bestanden |
| T18 | Dashboard | Klassenkarten, letzte Check-ins bzw. Leerhinweis, Sieben-Tage-Verlauf | Alle Bereiche und historische Verlaufsdaten sichtbar | bestanden |
| T19 | Berichte: Letzte 7 Tage (15.–21.11.2026) | Summen und Datensätze konsistent | 110 Datensätze, 73 eingecheckt, davon 13 verspätet, 37 abwesend; Quote 66,4 % | bestanden |
| T20 | Berichte: ungültiger Zeitraum und CSV | Validierung verhindert ungültigen Zeitraum; CSV enthält korrekte Daten | Noch nicht geprüft | offen |
| T21 | Passwortänderung: Validierung und Fehlerantwort | Leere/zu kurze/ungleiche Eingaben abgelehnt; falsches aktuelles Passwort führt zur Fehlermeldung | Unit- und simulierte Service-Tests vorhanden; Browser-Integration offen | offen |
| T22 | Navigation | Menüpunkte wechseln die Ansicht; aktiver Punkt markiert | Navigation und aktive Markierung sichtbar; RFID-Seite weiterhin Platzhalter | bestanden (Navigation, nicht RFID-Funktion) |
| T23 | Responsive Layout 1366 × 768 | Keine abgeschnittenen zentralen Bedienelemente, Inhalte erreichbar | CSS implementiert; gezielter Test dieser Auflösung offen | offen |
| T24 | Backend nicht erreichbar | Verständliche Fehlermeldung statt falscher oder leerer Daten | Noch nicht geprüft | offen |
| T25 | Integrität der Demo-Daten | Alle Anwesenheitsdatensätze mit session_id | SQL-Abfrage: 190 Datensätze, 0 ohne Session; Transaktion COMMIT | bestanden |

## 4. Bewusst nicht vollständig getestet

- Rollen und Berechtigungen aus Sicht einer Lehrkraft (bisherige Screenshots zeigen `admin`).
- Echte RFID-Karten und ESP32-Hardware; keine echte RFID-Ereignishistorie nachgewiesen.
- Erfolgreiche Passwortänderung gegen das laufende Backend.
- Objektbezogene Backend-Berechtigung beim Bearbeiten von Anwesenheitsdaten.

## 5. Gefundene Probleme und Maßnahmen

| Nr. | Problem | Ursache / Befund | Maßnahme / Stand |
|---|---|---|---|
| P1 | Abfragen nach längerer Pause abgelehnt | HTTP 403 beobachtet; erneuter Login führte zu HTTP 200. Ein 403 allein beweist keinen abgelaufenen Token. | Token-Ablaufprüfung beim App-Start implementiert; Browser-Negativtest offen |
| P2 | Nicht erfasste Schüler als abwesend gezählt | Mapper summierte ABSENT und NOT_RECORDED | Getrennte Zählung implementiert; 2 zusätzliche Tests laut gemeldetem Stand; Browser-Regressionstest T06 offen |
| P3 | Anzeige „Letzte RFID-Scans“ irreführend | Es wurden Check-ins statt RFID-Ereignissen angezeigt | In „Letzte Check-ins“ umbenannt; in Screenshots bestätigt |
| P4 | Funktionsloser Button „Alle anzeigen“ | Kein Klick-Handler | Entfernt |
| P5 | Automatische Aktualisierung ursprünglich nur behauptet | Manuelles Neuladen | Polling für heutiges Datum implementiert; historische Ansicht noch abschließend prüfen |

Frühere Probleme mit Datenbank-Constraints und Zeitzonen nur dann als behoben aufnehmen, wenn die zugehörigen Backend-Änderungen und erfolgreichen Nachtests belegt sind. Die Behandlung von Sekunden und Mikrosekunden beim Bearbeiten wird mit T11 geprüft und anschließend dokumentiert.

## 6. Nachweise ergänzen

Pro manuellem Test bei Bedarf festhalten: Datum, Testkonto, konkrete Eingaben, tatsächliches Ergebnis, Status und Screenshot-Dateiname. Keine Passwörter, JWTs, Datenbank-Backups oder realen Schülerdaten in Git veröffentlichen.

| Test-Nr. | Testdatum | Screenshot / Nachweis | Bemerkung |
|---|---|---|---|
| | | | |

