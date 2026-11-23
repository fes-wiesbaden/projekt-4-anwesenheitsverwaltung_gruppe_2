-- Apply once to the existing PostgreSQL database BEFORE deploying this version.
-- Existing timetable entries receive 08:00 as a temporary migration default. Review and
-- update those times to each class's real start time through the timetable API/admin UI.

ALTER TABLE timetables ADD COLUMN IF NOT EXISTS start_time TIME;
UPDATE timetables SET start_time = TIME '08:00' WHERE start_time IS NULL;
ALTER TABLE timetables ALTER COLUMN start_time SET NOT NULL;

CREATE TABLE IF NOT EXISTS attendance_sessions (
    id BIGSERIAL PRIMARY KEY,
    timetable_id BIGINT NOT NULL REFERENCES timetables(id),
    session_date DATE NOT NULL,
    scheduled_start TIMESTAMP NOT NULL,
    scheduled_end TIMESTAMP NOT NULL,
    started_at TIMESTAMP NOT NULL,
    ended_at TIMESTAMP NULL,
    ended_by VARCHAR(120) NULL,
    end_reason VARCHAR(200) NULL,
    status VARCHAR(20) NOT NULL,
    CONSTRAINT uk_attendance_session_timetable_date UNIQUE (timetable_id, session_date)
);

ALTER TABLE rfid_chips ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT TRUE;

ALTER TABLE attendances ADD COLUMN IF NOT EXISTS session_id BIGINT NULL;
ALTER TABLE attendances ADD COLUMN IF NOT EXISTS checkout_reason VARCHAR(200) NULL;
ALTER TABLE attendances ADD COLUMN IF NOT EXISTS checked_out_by VARCHAR(120) NULL;
ALTER TABLE attendances ADD CONSTRAINT fk_attendance_session
    FOREIGN KEY (session_id) REFERENCES attendance_sessions(id);

-- The old unique(student_id, date) rule prevents a student attending more than one
-- scheduled session per day. Remove the matching unique constraint by its columns,
-- regardless of the generated constraint name.
DO $$
DECLARE c RECORD;
BEGIN
    FOR c IN
        SELECT con.conname
        FROM pg_constraint con
        WHERE con.conrelid = 'attendances'::regclass
          AND con.contype = 'u'
          AND (
              SELECT array_agg(att.attname::text ORDER BY att.attname::text)
              FROM unnest(con.conkey) AS key(attnum)
              JOIN pg_attribute att ON att.attrelid = con.conrelid AND att.attnum = key.attnum
          ) = ARRAY['date', 'student_id']::text[]
    LOOP
        EXECUTE format('ALTER TABLE attendances DROP CONSTRAINT %I', c.conname);
    END LOOP;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uk_attendance_student_session') THEN
        ALTER TABLE attendances ADD CONSTRAINT uk_attendance_student_session UNIQUE (student_id, session_id);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS ix_attendance_session_id ON attendances(session_id);
CREATE INDEX IF NOT EXISTS ix_attendance_student_date ON attendances(student_id, date);

CREATE TABLE IF NOT EXISTS attendance_audit_events (
    id BIGSERIAL PRIMARY KEY,
    attendance_id BIGINT NOT NULL REFERENCES attendances(id),
    session_id BIGINT NOT NULL REFERENCES attendance_sessions(id),
    event_type VARCHAR(40) NOT NULL,
    event_at TIMESTAMP NOT NULL,
    actor_username VARCHAR(120) NOT NULL,
    details VARCHAR(500) NULL
);
CREATE INDEX IF NOT EXISTS ix_attendance_audit_session ON attendance_audit_events(session_id, event_at);

-- Keep existing teacher accounts working while using TEACHER for all newly-created accounts.
UPDATE users SET role = 'TEACHER' WHERE role = 'USER';
