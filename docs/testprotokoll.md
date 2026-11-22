# Testprotokoll AttendanceCTRL – Frontend

## 1. Testumgebung und Stand

- Frontend: React, TypeScript, Vite, Material UI; lokal unter http://localhost:5173
- Backend: Spring Boot, PostgreSQL 16 und Mosquitto in Docker
- Testkonten: `admin`, `anna.schneider` und `demo.teacher`; synthetische Demo-Daten
- Klassen: 10A, 10B, 11A (26 Schüler; 190 Anwesenheitsdatensätze unmittelbar nach dem Seed)
- Testzeitraum: 18.–22.11.2026
- Frontend-Branch: `feature/marya-work`; automatisierte Tests zuletzt mit 16 Testdateien und 98 bestandenen Tests nachgewiesen

Status: **bestanden** = berichteter oder sichtbarer Nachweis vorhanden; **teilweise** = nur ein Teil der Prüfung nachgewiesen; **offen** = noch kein ausreichender Nachweis; **nicht bestanden** = tatsächliche Abweichung festgestellt.

## 2. Automatisierte Tests

| Nr. | Prüfung | Ergebnis | Status / Nachweis |
|---|---|---|---|
| A1 | `npm test` | 16 Testdateien, 98 Tests laut gemeldetem Stand | bestanden; aktuellen Terminal-Screenshot ergänzen |
| A2 | `npm run build` | TypeScript-Prüfung und Produktions-Build erfolgreich laut gemeldetem Stand | bestanden; aktuellen Terminal-Screenshot ergänzen |

## 3. Manuelle Tests

| Nr. | Testfall | Erwartetes Ergebnis | Tatsächliches Ergebnis | Status |
|---|---|---|---|---|
| T01 | Login mit gültigen Daten | App öffnet sich, Benutzername im Header | App und Benutzername `admin` sichtbar | bestanden |
| T02 | Login mit falschem Passwort | Anmeldung abgelehnt, Fehlermeldung | Falsches Passwort einmal getestet; Anmeldung wurde abgelehnt und Fehlermeldung angezeigt | bestanden |
| T03 | Ungültiger Token beim Start | Rückkehr zur Login-Seite | Token mit `sessionStorage.setItem("token", "x.y.z")` verändert; nach Neuladen wurde die Login-Seite angezeigt | bestanden |
| T04 | Klassen laden | Dropdown zeigt 10A, 10B, 11A | Alle drei Klassen sichtbar | bestanden |
| T05 | Anwesenheit 18.11.2026, 10A | 10 Schüler, 0 anwesend, 3 verspätet, 7 abwesend | Werte im Browser vor letzter Statistikänderung sichtbar | bestanden; Regressionstest empfohlen |
| T06 | Anwesenheit 22.11.2026, 10A | Hinweis bei fehlenden Anwesenheitsdaten; Abwesend 0; Prozentwert „–“; keine Fehlenden-Warnung | Blaue Hinweismeldung und korrekte Werte im Browser sichtbar | bestanden |
| T07 | Manueller Check-in | Check-in-Zeit und passender Status erscheinen | Historische Check-in-Zeiten vorhanden; Ausführung und Ergebnis der manuellen Aktion nochmals nachvollziehbar dokumentieren | teilweise |
| T08 | Manueller Check-out | Check-out-Zeit wird angezeigt | Historische Check-out-Zeiten vorhanden; manuelle Aktion nochmals nachvollziehbar dokumentieren | teilweise |
| T09 | Aktionen nach Check-out | Ein- und Auschecken nicht mehr angeboten; Bearbeiten bei vorhandenem Datensatz weiterhin möglich | Aktuelle Aktionslogik automatisiert getestet; Browser-Prüfung offen | offen |
| T10 | Bearbeiten: Check-out vor Check-in | Validierungsfehler; keine Speicherung der ungültigen Eingaben | Fehlermeldung im Dialog sichtbar; unterbliebene PUT-Anfrage noch nicht separat belegt | teilweise |
| T11 | Bearbeiten: Beschreibung speichern | Erfolgsmeldung und aktualisierter Datenbankwert | Beschreibung von Lina Weber erfolgreich auf „Arzttermin“ geändert; Check-in und Check-out unverändert | bestanden |
| T12 | Suche in Anwesenheitsliste | Nur passende Schüler werden angezeigt | Gefilterte Liste mit einem Ergebnis sichtbar; konkreten Suchbegriff erneut dokumentieren | teilweise |
| T13 | Statusfilter | Nur Schüler mit ausgewähltem Status anzeigen | Filter „Verspätet“ zeigt Lina Weber, Mia Hoffmann und Noah Schmidt (3 von 10); weitere Filter noch nicht geprüft | teilweise |
| T14 | CSV-Export Anwesenheit | CSV mit richtigen Schülern, Status und Zeiten | CSV erfolgreich heruntergeladen; 10 Schüler, 3 verspätet, Zeiten korrekt; Excel- und Umlautprüfung noch offen | teilweise |
| T15 | Automatische Aktualisierung | Heute wiederholte erfolgreiche Abfragen ohne störende Ladeanzeige; historisches Datum ohne Polling | Wiederholte HTTP-200-Anfragen heute sichtbar; Timer-Stopp bei historischem Datum noch eindeutig nachweisen | teilweise |
| T16 | Schülerseite: Klassenfilter und Suche | 26 Schüler, passende gefilterte Ergebnisse | Klasse 11A ausgewählt, nach Ida gesucht; nur Ida Braun angezeigt (1 von 26 Schülern) | bestanden |
| T17 | Klassenseite | Raum, Schülerzahl und Stundenplan je Klasse | Alle drei Klassen mit Räumen, Zahlen und Stundenplänen sichtbar | bestanden |
| T18 | Dashboard | Klassenkarten, letzte Check-ins bzw. Leerhinweis, Sieben-Tage-Verlauf | Alle Bereiche und historische Verlaufsdaten sichtbar | bestanden |
| T19 | Berichte: Letzte 7 Tage (15.–21.11.2026) | Summen und Datensätze konsistent | 110 Datensätze, 73 eingecheckt, davon 13 verspätet, 37 abwesend; Quote 66,4 % | bestanden |
| T20 | Berichte: ungültiger Zeitraum und CSV | Ungültigen Zeitraum verhindern, CSV korrekt exportieren | Von 20.11.2026 bis 18.11.2026 eingegeben; Warnung „Das Von-Datum darf nicht nach dem Bis-Datum liegen.“ erscheint; Export deaktiviert. CSV heruntergeladen; Excel-Prüfung noch offen | teilweise |
| T21 | Passwortänderung: Validierung und Fehlerantwort | Leere/zu kurze/ungleiche Eingaben abgelehnt; falsches aktuelles Passwort führt zur Fehlermeldung | Zu kurzes neues Passwort getestet; Meldung „Das neue Passwort muss mindestens 8 Zeichen lang sein.“ sichtbar; weitere Fehlerfälle offen | teilweise |
| T22 | Navigation | Menüpunkte wechseln die Ansicht; aktiver Punkt markiert | Navigation und aktive Markierung sichtbar; RFID-Seite weiterhin Platzhalter | bestanden (Navigation, nicht RFID-Funktion) |
| T23 | Responsive Layout 1366 × 768 | Keine abgeschnittenen zentralen Bedienelemente, Inhalte erreichbar | Anwesenheit und Berichte bei 1366 × 768 geprüft; Darstellung und Scrollen funktionieren | bestanden |
| T24 | Backend nicht erreichbar | Verständliche Fehlermeldung | Login zeigt „Der Server ist momentan nicht erreichbar“, wenn Backend gestoppt ist | bestanden |
| T25 | Lehrkraft über die Administration anlegen | Neuer Benutzer erscheint in Liste und Datenbank | Anna Schneider erfolgreich angelegt, Rolle TEACHER bestätigt | bestanden |
| T26 | Zugriffsrechte einer Lehrkraft | Administration und RFID-Scans nicht sichtbar | Beide Menüpunkte fehlen bei anna.schneider | bestanden |
| T27 | Lehrkraft sieht nur zugewiesene Klasse | Nur die zugewiesene Klasse wird angezeigt | Anna sieht in Anwesenheit und Dashboard nur Klasse 11A | bestanden |
| T28 | Manueller Check-in als Lehrkraft | Berechtigung und Fehlermeldung prüfen | Noch nicht an einem Unterrichtstag getestet | offen |
| T29 | Lehrkraft anlegen mit zu kurzem Passwort | Eingabe unter 10 Zeichen wird abgelehnt | Passwort mit 9 Zeichen getestet; Fehlermeldung „Das Passwort muss mindestens 10 Zeichen lang sein.“ angezeigt; kein Benutzer angelegt | bestanden |
| T30 | Klasse einer Lehrkraft zuweisen | Erfolgreiche Zuweisung über die Administration | Klasse 11A an anna.schneider zugewiesen; Datenbankeintrag bestätigt | bestanden |
| T31 | Integrität der Demo-Daten | Alle Anwesenheitsdatensätze mit session_id | SQL-Abfrage: 190 Datensätze, 0 ohne Session; Transaktion COMMIT | bestanden |

## 4. Bewusst nicht vollständig getestet

- Rollen und Klassensicht wurden mit admin und anna.schneider getestet. Manueller Check-in als Lehrkraft ist noch offen (T28).
- Echte RFID-Karten und ESP32-Hardware; keine echte RFID-Ereignishistorie nachgewiesen.
- Erfolgreiche Passwortänderung gegen das laufende Backend.
- Objektbezogene Backend-Berechtigung beim Bearbeiten von Anwesenheitsdaten.

## 5. Gefundene Probleme und Maßnahmen

| Nr. | Problem | Ursache / Befund | Maßnahme / Stand |
|---|---|---|---|
| P1 | Abfragen nach längerer Pause abgelehnt | HTTP 403 beobachtet; erneuter Login führte zu HTTP 200. Ein 403 allein beweist keinen abgelaufenen Token. | Token-Ablaufprüfung beim App-Start implementiert; Browser-Negativtest offen |
| P2 | Nicht erfasste Schüler als abwesend gezählt | ABSENT und NOT_RECORDED wurden nicht ausreichend getrennt | Zählung korrigiert; T06 im Browser bestanden |
 T06 | Anwesenheit 22.11.2026, 10A | Hinweis bei fehlenden Anwesenheitsdaten, Abwesend 0, Prozentwert „–“, keine Fehlenden-Warnung | Hinweis und korrekte Werte im Browser sichtbar | bestanden |
| P3 | Anzeige „Letzte RFID-Scans“ irreführend | Es wurden Check-ins statt RFID-Ereignissen angezeigt | In „Letzte Check-ins“ umbenannt; in Screenshots bestätigt |
| P4 | Funktionsloser Button „Alle anzeigen“ | Kein Klick-Handler | Entfernt |
| P5 | Automatische Aktualisierung ursprünglich nur behauptet | Manuelles Neuladen | Polling für heutiges Datum implementiert; historische Ansicht noch abschließend prüfen |
| P6 | Lehrkraft konnte zunächst nicht angelegt werden | Alter Datenbank-Constraint users_role_check erlaubte nur ADMIN und USER, Backend verwendet TEACHER | Datenbank vorher gesichert und Constraint lokal angepasst; danach Lehrkraft erfolgreich angelegt |

Frühere Probleme mit Datenbank-Constraints und Zeitzonen nur dann als behoben aufnehmen, wenn die zugehörigen Backend-Änderungen und erfolgreichen Nachtests belegt sind. Die Behandlung von Sekunden und Mikrosekunden beim Bearbeiten wird mit T11 geprüft und anschließend dokumentiert.

## 6. Nachweise ergänzen

Pro manuellem Test bei Bedarf festhalten: Datum, Testkonto, konkrete Eingaben, tatsächliches Ergebnis, Status und Screenshot-Dateiname. Keine Passwörter, JWTs, Datenbank-Backups oder realen Schülerdaten in Git veröffentlichen.

| Test-Nr. | Testdatum | Screenshot / Nachweis | Bemerkung |
|---|---|---|---|
| | | | |

