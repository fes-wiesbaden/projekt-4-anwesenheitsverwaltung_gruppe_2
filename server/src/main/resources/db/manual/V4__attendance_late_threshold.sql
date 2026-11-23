CREATE TABLE IF NOT EXISTS attendance_settings (
    id INTEGER PRIMARY KEY,
    late_grace_minutes INTEGER NOT NULL DEFAULT 5,
    CONSTRAINT chk_attendance_late_grace_minutes CHECK (late_grace_minutes BETWEEN 0 AND 180)
);

INSERT INTO attendance_settings (id, late_grace_minutes)
VALUES (1, 5)
ON CONFLICT (id) DO NOTHING;
