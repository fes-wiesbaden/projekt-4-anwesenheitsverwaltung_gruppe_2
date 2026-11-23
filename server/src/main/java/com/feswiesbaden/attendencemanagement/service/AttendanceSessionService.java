package com.feswiesbaden.attendencemanagement.service;

import com.feswiesbaden.attendencemanagement.entity.*;
import com.feswiesbaden.attendencemanagement.repository.AttendanceAuditRepository;
import com.feswiesbaden.attendencemanagement.repository.AttendanceRepository;
import com.feswiesbaden.attendencemanagement.repository.AttendanceSessionRepository;
import com.feswiesbaden.attendencemanagement.repository.StudentRepository;
import com.feswiesbaden.attendencemanagement.repository.TimetableRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.*;
import java.util.List;
import java.util.UUID;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class AttendanceSessionService {
    private static final String SYSTEM_ACTOR = "SYSTEM";

    private final TimetableRepository timetableRepository;
    private final AttendanceSessionRepository sessionRepository;
    private final AttendanceRepository attendanceRepository;
    private final AttendanceAuditRepository auditRepository;
    private final StudentRepository studentRepository;
    private final SystemAuditLogService systemAuditLogService;

    @Value("${app.attendance.zone:Europe/Berlin}")
    private String attendanceZone;

    @Transactional
    public Optional<AttendanceSession> getActiveSession(Classroom classroom, LocalDateTime now) {
        LocalDate date = now.toLocalDate();
        Optional<Timetable> timetableOpt = timetableRepository
                .findByClassroom_IdAndDayOfWeek(classroom.getId(), date.getDayOfWeek());
        if (timetableOpt.isEmpty()) return Optional.empty();

        Timetable timetable = timetableOpt.get();
        LocalDateTime start = date.atTime(timetable.getStartTime());
        LocalDateTime end = date.atTime(timetable.getCheckoutTime());
        if (now.isBefore(start) || !now.isBefore(end)) return Optional.empty();

        AttendanceSession session = getOrCreateSession(timetable, date, start, end);
        if (session.getStatus() != AttendanceSessionStatus.ACTIVE) return Optional.empty();
        return Optional.of(session);
    }

    @Transactional
    public void processScheduledSessions() {
        ZoneId zone = ZoneId.of(attendanceZone);
        LocalDateTime now = LocalDateTime.now(zone);
        LocalDate date = now.toLocalDate();

        // Close sessions left open by an application restart or MQTT/database outage.
        for (AttendanceSession overdue : sessionRepository.findByStatusAndScheduledEndLessThanEqual(
                AttendanceSessionStatus.ACTIVE, now)) {
            completeSession(overdue, overdue.getScheduledEnd(), SYSTEM_ACTOR,
                    AttendanceAuditEventType.AUTOMATIC_CHECKOUT,
                    "Automatic checkout at scheduled timetable end (recovered by scheduler)");
        }

        for (Timetable timetable : timetableRepository.findByDayOfWeek(date.getDayOfWeek())) {
            LocalDateTime start = date.atTime(timetable.getStartTime());
            LocalDateTime end = date.atTime(timetable.getCheckoutTime());
            if (now.isBefore(start)) continue;

            AttendanceSession session = getOrCreateSession(timetable, date, start, end);
            if (!now.isBefore(end) && session.getStatus() == AttendanceSessionStatus.ACTIVE) {
                completeSession(session, end, SYSTEM_ACTOR, AttendanceAuditEventType.AUTOMATIC_CHECKOUT,
                        "Automatic checkout at scheduled timetable end");
            }
        }
    }

    public LocalDate today() {
        return LocalDate.now(ZoneId.of(attendanceZone));
    }

    @Transactional
    public Optional<AttendanceSession> findSession(Long classroomId, LocalDate date) {
        return sessionRepository.findDetailedBySessionDateAndClassroom(date, classroomId);
    }

    @Transactional
    public boolean releaseStudent(UUID studentId, LocalDate date, String actor, String reason) {
        Student student = studentRepository.findById(studentId).orElse(null);
        if (student == null || student.getClassroom() == null) return false;
        AttendanceSession session = findSession(student.getClassroom().getId(), date).orElse(null);
        if (session == null || session.getStatus() != AttendanceSessionStatus.ACTIVE) return false;

        LocalDateTime now = LocalDateTime.now(ZoneId.of(attendanceZone));
        if (!now.isBefore(session.getScheduledEnd())) {
            completeSession(session, session.getScheduledEnd(), SYSTEM_ACTOR,
                    AttendanceAuditEventType.AUTOMATIC_CHECKOUT,
                    "Automatic checkout at scheduled timetable end");
            return false;
        }

        Attendance attendance = attendanceRepository.findByStudent_IdAndSession_Id(studentId, session.getId()).orElse(null);
        if (attendance == null || attendance.getCheckin() == null || attendance.getCheckout() != null) return false;

        attendance.setCheckout(now);
        attendance.setCheckoutReason("EARLY_RELEASE");
        attendance.setCheckedOutBy(actor);
        attendance.setDescription(limitReason(reason, "Early release", 200));
        attendanceRepository.save(attendance);
        recordAudit(attendance, session, AttendanceAuditEventType.EARLY_RELEASE, now, actor, attendance.getDescription());
        systemAuditLogService.record(actor, "STUDENT_EARLY_RELEASE", "ATTENDANCE", attendance.getId().toString(),
                "Student checked out before the scheduled timetable end", null,
                "checkout=" + now + "; reason=" + attendance.getDescription());
        return true;
    }

    @Transactional
    public int releaseClass(Long classroomId, LocalDate date, String actor, String reason) {
        AttendanceSession session = findSession(classroomId, date).orElse(null);
        if (session == null || session.getStatus() != AttendanceSessionStatus.ACTIVE) return -1;
        LocalDateTime now = LocalDateTime.now(ZoneId.of(attendanceZone));
        if (!now.isBefore(session.getScheduledEnd())) {
            completeSession(session, session.getScheduledEnd(), SYSTEM_ACTOR,
                    AttendanceAuditEventType.AUTOMATIC_CHECKOUT,
                    "Automatic checkout at scheduled timetable end");
            return -1;
        }
        List<Attendance> openAttendances = attendanceRepository
                .findBySession_IdAndCheckinIsNotNullAndCheckoutIsNull(session.getId());
        for (Attendance attendance : openAttendances) {
            attendance.setCheckout(now);
            attendance.setCheckoutReason("CLASS_EARLY_RELEASE");
            attendance.setCheckedOutBy(actor);
            attendance.setDescription(limitReason(reason, "Class released early", 200));
            attendanceRepository.save(attendance);
            recordAudit(attendance, session, AttendanceAuditEventType.CLASS_EARLY_RELEASE, now, actor,
                    attendance.getDescription());
        }
        systemAuditLogService.record(actor, "CLASS_EARLY_RELEASE", "ATTENDANCE_SESSION", session.getId().toString(),
                "Teacher released the class early; checked out " + openAttendances.size() + " students", "status=ACTIVE",
                "status=COMPLETED; checkoutCount=" + openAttendances.size());
        session.setStatus(AttendanceSessionStatus.COMPLETED);
        session.setEndedAt(now);
        session.setEndedBy(actor);
        session.setEndReason(limitReason(reason, "Class released early", 200));
        sessionRepository.save(session);
        return openAttendances.size();
    }

    private AttendanceSession getOrCreateSession(Timetable timetable, LocalDate date,
                                                  LocalDateTime start, LocalDateTime end) {
        // Serialize session creation between the scheduler and a first RFID scan at the same start time.
        timetable = timetableRepository.findByIdForUpdate(timetable.getId()).orElse(timetable);
        Optional<AttendanceSession> existing = sessionRepository
                .findByTimetable_IdAndSessionDate(timetable.getId(), date);
        if (existing.isPresent()) return existing.get();

        AttendanceSession session = new AttendanceSession();
        session.setTimetable(timetable);
        session.setSessionDate(date);
        session.setScheduledStart(start);
        session.setScheduledEnd(end);
        session.setStartedAt(start);
        session.setStatus(AttendanceSessionStatus.ACTIVE);
        session = sessionRepository.save(session);

        for (Student student : studentRepository.findByClassroom_Id(timetable.getClassroom().getId())) {
            Attendance attendance = new Attendance();
            attendance.setDate(date);
            attendance.setStudent(student);
            attendance.setSession(session);
            attendance.setStatus(Attendance_status.ABWESEND);
            attendanceRepository.save(attendance);
        }
        return session;
    }

    private void completeSession(AttendanceSession session, LocalDateTime checkoutAt, String actor,
                                 AttendanceAuditEventType eventType, String details) {
        List<Attendance> openAttendances = attendanceRepository
                .findBySession_IdAndCheckinIsNotNullAndCheckoutIsNull(session.getId());
        for (Attendance attendance : openAttendances) {
            attendance.setCheckout(checkoutAt);
            attendance.setCheckoutReason("TIMETABLE_END");
            attendance.setCheckedOutBy(actor);
            attendanceRepository.save(attendance);
            recordAudit(attendance, session, eventType, checkoutAt, actor, details);
        }
        systemAuditLogService.record(actor, "AUTOMATIC_SESSION_CHECKOUT", "ATTENDANCE_SESSION", session.getId().toString(),
                "Timetable ended; automatically checked out " + openAttendances.size() + " students", "status=ACTIVE",
                "status=COMPLETED; checkoutCount=" + openAttendances.size());
        session.setStatus(AttendanceSessionStatus.COMPLETED);
        session.setEndedAt(checkoutAt);
        session.setEndedBy(actor);
        session.setEndReason(details);
        sessionRepository.save(session);
    }

    private String limitReason(String reason, String fallback, int maxLength) {
        String value = reason == null || reason.isBlank() ? fallback : reason.trim();
        return value.length() <= maxLength ? value : value.substring(0, maxLength);
    }

    private void recordAudit(Attendance attendance, AttendanceSession session, AttendanceAuditEventType eventType,
                             LocalDateTime at, String actor, String details) {
        AttendanceAuditEvent event = new AttendanceAuditEvent();
        event.setAttendance(attendance);
        event.setSession(session);
        event.setEventType(eventType);
        event.setEventAt(at);
        event.setActorUsername(actor == null || actor.isBlank() ? SYSTEM_ACTOR : actor);
        event.setDetails(details);
        auditRepository.save(event);
    }
}
