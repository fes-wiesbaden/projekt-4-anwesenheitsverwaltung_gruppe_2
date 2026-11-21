-- AttendanceCTRL: synthetische Demo-Daten fuer lokale Entwicklung.
-- Ziel: Nur die NEUEN Klassen 10B und 11A mit je 8 Demo-Schuelern
-- sowie historischen, korrekt zugeordneten Unterrichtssitzungen befuellen.
-- Klasse 10A, ihre Stundenplaene und ihre Anwesenheitsdaten bleiben unveraendert.
-- NICHT auf einer produktiven Datenbank ausfuehren.
-- Vorher ein pg_dump-Backup erstellen. Genau einmal ausfuehren.
-- Aufruf: psql -U admin -d attendancemanagementdb -v ON_ERROR_STOP=1 -f /tmp/demo-seed.sql

BEGIN;

-- Keine unbeabsichtigten Dopplungen oder stillschweigenden Teilimporte.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM classrooms WHERE classroom_name IN ('10B', '11A')) THEN
    RAISE EXCEPTION 'Abbruch: 10B oder 11A existiert bereits. Keine Aenderung vorgenommen.';
  END IF;

  IF EXISTS (SELECT 1 FROM rooms WHERE room_number IN ('R102', 'R201')) THEN
    RAISE EXCEPTION 'Abbruch: Raum R102 oder R201 existiert bereits.';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM users WHERE username = 'admin') THEN
    RAISE EXCEPTION 'Abbruch: Benutzer admin fehlt. Klassenzuordnung waere unvollstaendig.';
  END IF;

  -- Die bestehende lokale DB muss die ordinalen Enum-Werte belegen:
  -- 1 = ABWESEND (ohne Check-in), 2 = VERSPAETET (mit Check-in).
  -- Nach vorliegenden Projektdaten entspricht 0 = ANWESEND.
  IF NOT EXISTS (SELECT 1 FROM attendances WHERE status = 1 AND checkin IS NULL)
     OR NOT EXISTS (SELECT 1 FROM attendances WHERE status = 2 AND checkin IS NOT NULL) THEN
    RAISE EXCEPTION 'Abbruch: Enum-Zuordnung in der bestehenden DB nicht nachgewiesen.';
  END IF;

  IF EXISTS (
    SELECT 1 FROM students
    WHERE username IN (
      'aylin.yilmaz', 'bruno.schneider', 'clara.neumann', 'david.richter',
      'elif.kaya', 'fabian.wolf', 'greta.lehmann', 'hassan.ali',
      'ida.braun', 'jan.krueger', 'kira.hartmann', 'luca.zimmermann',
      'mira.schaefer', 'nico.vogel', 'olivia.peters', 'paul.winter'
    )
  ) THEN
    RAISE EXCEPTION 'Abbruch: Ein Demo-Benutzername existiert bereits.';
  END IF;
END $$;

-- Die rooms.id hat im vorhandenen Schema KEINEN Default.
-- Daher IDs oberhalb der aktuellen maximalen ID vergeben, nicht blind 101/102.
WITH basis AS (SELECT COALESCE(MAX(id), 0) AS last_id FROM rooms)
INSERT INTO rooms (id, room_name, room_number)
SELECT basis.last_id + v.nr, v.room_name, v.room_number
FROM basis
CROSS JOIN (VALUES
  (1, 'Klassenraum 102', 'R102'),
  (2, 'Klassenraum 201', 'R201')
) AS v(nr, room_name, room_number);

INSERT INTO classrooms (classroom_name, room_id)
SELECT v.classroom_name, r.id
FROM (VALUES ('10B', 'R102'), ('11A', 'R201')) AS v(classroom_name, room_number)
JOIN rooms r ON r.room_number = v.room_number;

-- Die zweite Room-Classroom-Beziehung im vorhandenen Schema konsistent pflegen.
INSERT INTO rooms_classrooms (room_id, classrooms_id)
SELECT c.room_id, c.id
FROM classrooms c
WHERE c.classroom_name IN ('10B', '11A');

-- 16 synthetische Schueler; IDs sind UUIDs (PostgreSQL 16).
INSERT INTO students (id, display_name, username, classroom_id)
SELECT gen_random_uuid(), v.display_name, v.username, c.id
FROM (VALUES
  ('Aylin Yilmaz',    'aylin.yilmaz',     '10B'),
  ('Bruno Schneider', 'bruno.schneider',  '10B'),
  ('Clara Neumann',   'clara.neumann',    '10B'),
  ('David Richter',  'david.richter',    '10B'),
  ('Elif Kaya',      'elif.kaya',        '10B'),
  ('Fabian Wolf',    'fabian.wolf',      '10B'),
  ('Greta Lehmann',  'greta.lehmann',    '10B'),
  ('Hassan Ali',     'hassan.ali',       '10B'),
  ('Ida Braun',      'ida.braun',       '11A'),
  ('Jan Krueger',    'jan.krueger',      '11A'),
  ('Kira Hartmann',  'kira.hartmann',    '11A'),
  ('Luca Zimmermann','luca.zimmermann', '11A'),
  ('Mira Schaefer',  'mira.schaefer',    '11A'),
  ('Nico Vogel',     'nico.vogel',       '11A'),
  ('Olivia Peters',  'olivia.peters',    '11A'),
  ('Paul Winter',    'paul.winter',      '11A')
) AS v(display_name, username, class_name)
JOIN classrooms c ON c.classroom_name = v.class_name;

-- Auch die separate Many-to-Many-Tabelle konsistent fuellen.
INSERT INTO classrooms_students (classroom_id, students_id)
SELECT c.id, s.id
FROM students s
JOIN classrooms c ON c.id = s.classroom_id
WHERE c.classroom_name IN ('10B', '11A');

-- Klassen dem existierenden Demo-Admin zuordnen.
INSERT INTO classroom_user (classroom_id, user_id)
SELECT c.id, u.id
FROM classrooms c
CROSS JOIN users u
WHERE u.username = 'admin' AND c.classroom_name IN ('10B', '11A');

-- Stundenplan NUR fuer die beiden neuen Klassen, nicht 10A.
INSERT INTO timetables (classroom_id, day_of_week, start_time, checkout_time)
SELECT c.id, d.day, TIME '07:45:00', TIME '15:30:00'
FROM classrooms c
CROSS JOIN (VALUES
  ('MONDAY'), ('TUESDAY'), ('WEDNESDAY'), ('THURSDAY'), ('FRIDAY')
) AS d(day)
WHERE c.classroom_name IN ('10B', '11A');

-- 14 vergangene Tage (nur Werktage, ohne heute):
-- Fuer jede Kombination aus Klasse, Tag und Stundenplan eine ABGESCHLOSSENE
-- Session erzeugen. Keine sessionlosen Attendances.
INSERT INTO attendance_sessions (
  end_reason, ended_at, ended_by, scheduled_end, scheduled_start,
  session_date, started_at, status, timetable_id
)
SELECT
  'DEMO_SEED',
  (d.day::date + t.checkout_time),
  'demo-seed',
  (d.day::date + t.checkout_time),
  (d.day::date + t.start_time),
  d.day::date,
  (d.day::date + t.start_time),
  'COMPLETED',
  t.id
FROM timetables t
JOIN classrooms c ON c.id = t.classroom_id
CROSS JOIN generate_series(
  (current_date - 14)::timestamp,
  (current_date - 1)::timestamp,
  INTERVAL '1 day'
) AS d(day)
WHERE c.classroom_name IN ('10B', '11A')
  AND t.day_of_week = CASE EXTRACT(ISODOW FROM d.day)::integer
    WHEN 1 THEN 'MONDAY'
    WHEN 2 THEN 'TUESDAY'
    WHEN 3 THEN 'WEDNESDAY'
    WHEN 4 THEN 'THURSDAY'
    WHEN 5 THEN 'FRIDAY'
  END;

-- Pro Session alle 8 Schueler mit deterministischer Demo-Verteilung:
-- 6 rechtzeitig (status 0), 1 verspaetet (status 2), 1 abwesend (status 1).
WITH ordered_students AS (
  SELECT
    ss.id AS session_id,
    ss.session_date,
    ss.scheduled_start,
    ss.scheduled_end,
    s.id AS student_id,
    ROW_NUMBER() OVER (PARTITION BY ss.id ORDER BY s.username) AS pos
  FROM attendance_sessions ss
  JOIN timetables t ON t.id = ss.timetable_id
  JOIN classrooms c ON c.id = t.classroom_id
  JOIN students s ON s.classroom_id = c.id
  WHERE c.classroom_name IN ('10B', '11A')
    AND ss.ended_by = 'demo-seed'
)
INSERT INTO attendances (
  date, checkin, checkout, description, status, student_id, session_id
)
SELECT
  session_date,
  CASE
    WHEN pos = 8 THEN NULL
    WHEN pos = 7 THEN scheduled_start + INTERVAL '25 minutes'
    ELSE scheduled_start + INTERVAL '5 minutes'
  END,
  CASE WHEN pos = 8 THEN NULL ELSE scheduled_end END,
  'DEMO: synthetischer Anwesenheitsdatensatz',
  CASE
    WHEN pos = 8 THEN 1
    WHEN pos = 7 THEN 2
    ELSE 0
  END,
  student_id,
  session_id
FROM ordered_students;

-- Vor COMMIT pruefen, ob wirklich genau 8 Schueler je neuer Klasse
-- und gleich viele Attendances pro Session vorliegen.
DO $$
DECLARE
  klasse TEXT;
  anzahl_schueler INTEGER;
  anzahl_sessions INTEGER;
  fehlerhafte_sessions INTEGER;
BEGIN
  FOREACH klasse IN ARRAY ARRAY['10B', '11A'] LOOP
    SELECT COUNT(*) INTO anzahl_schueler
    FROM students s JOIN classrooms c ON c.id = s.classroom_id
    WHERE c.classroom_name = klasse;

    IF anzahl_schueler <> 8 THEN
      RAISE EXCEPTION 'Abbruch: Klasse % hat % statt 8 Schueler.', klasse, anzahl_schueler;
    END IF;

    SELECT COUNT(*) INTO anzahl_sessions
    FROM attendance_sessions ss
    JOIN timetables t ON t.id = ss.timetable_id
    JOIN classrooms c ON c.id = t.classroom_id
    WHERE c.classroom_name = klasse AND ss.ended_by = 'demo-seed';

    IF anzahl_sessions <> 10 THEN
      RAISE EXCEPTION 'Abbruch: Klasse % hat % statt 10 Demo-Sessions.', klasse, anzahl_sessions;
    END IF;
  END LOOP;

  SELECT COUNT(*) INTO fehlerhafte_sessions
  FROM attendance_sessions ss
  JOIN timetables t ON t.id = ss.timetable_id
  JOIN classrooms c ON c.id = t.classroom_id
  LEFT JOIN attendances a ON a.session_id = ss.id
  WHERE c.classroom_name IN ('10B', '11A') AND ss.ended_by = 'demo-seed'
  GROUP BY ss.id
  HAVING COUNT(a.id) <> 8
  LIMIT 1;

  IF fehlerhafte_sessions IS NOT NULL THEN
    RAISE EXCEPTION 'Abbruch: Mindestens eine Demo-Session hat nicht 8 Anwesenheitsdatensaetze.';
  END IF;
END $$;

-- Zusammenfassung: 10A bleibt bei seinen bisherigen Datensaetzen.
SELECT
  c.classroom_name,
  COUNT(DISTINCT s.id) AS schueler,
  COUNT(DISTINCT a.id) AS anwesenheitsdatensaetze
FROM classrooms c
LEFT JOIN students s ON s.classroom_id = c.id
LEFT JOIN attendances a ON a.student_id = s.id
GROUP BY c.id, c.classroom_name
ORDER BY c.classroom_name;

COMMIT;
