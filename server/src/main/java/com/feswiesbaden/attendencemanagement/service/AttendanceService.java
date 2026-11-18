package com.feswiesbaden.attendencemanagement.service;

import com.feswiesbaden.attendencemanagement.entity.*;
import com.feswiesbaden.attendencemanagement.repository.AttendanceAuditRepository;
import com.feswiesbaden.attendencemanagement.repository.AttendanceRepository;
import com.feswiesbaden.attendencemanagement.repository.RfidRepository;
import com.feswiesbaden.attendencemanagement.repository.StudentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Locale;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AttendanceService {
    private final RfidRepository rfidRepository;
    private final StudentRepository studentRepository;
    private final AttendanceRepository attendanceRepository;
    private final AttendanceAuditRepository auditRepository;
    private final AttendanceSessionService sessionService;
    private final AttendanceSettingsService attendanceSettingsService;
    private final SystemAuditLogService systemAuditLogService;

    @Value("${app.attendance.zone:Europe/Berlin}")
    private String attendanceZone;


    @Transactional
    public void checkin(UUID studentId, String actorUsername) {
        Student student = studentRepository.findById(studentId).orElseThrow();
        if (student.getClassroom() == null) throw new IllegalStateException("Student is not assigned to a class.");
        LocalDateTime now = LocalDateTime.now(ZoneId.of(attendanceZone));
        AttendanceSession session = sessionService.getActiveSession(student.getClassroom(), now)
                .orElseThrow(() -> new IllegalStateException("No active timetable session for this class."));
        Attendance attendance = attendanceRepository.findByStudent_IdAndSession_Id(studentId, session.getId())
                .orElseGet(() -> {
                    Attendance created = new Attendance();
                    created.setDate(session.getSessionDate());
                    created.setStudent(student);
                    created.setSession(session);
                    return created;
                });
        if (attendance.getCheckin() != null || attendance.getCheckout() != null) {
            throw new IllegalStateException("Student already has an attendance event in this session.");
        }
        registerCheckin(session, attendance, now,
                actorUsername == null || actorUsername.isBlank() ? "ADMIN" : actorUsername,
                AttendanceAuditEventType.MANUAL_CHECK_IN, "Manual check-in by administrator");
    }

    @Transactional
    public ScanResult handleScan(String chipId) {
        if (chipId == null || chipId.isBlank()) return ScanResult.noTime(ScanResult.UNKNOWN_CARD);
        String normalized = normalizeUid(chipId);
        Rfid_chip card = rfidRepository.findByChipId(normalized);
        if (card == null) return ScanResult.noTime(ScanResult.UNKNOWN_CARD);

        if (!card.isActive()) return ScanResult.noTime(ScanResult.CARD_INACTIVE);
        Student student = studentRepository.findByRfidChip_Id(card.getId());
        if (student == null) return ScanResult.noTime(ScanResult.NOT_ASSIGNED);
        if (student.getClassroom() == null) return ScanResult.noTime(ScanResult.NOT_ASSIGNED);

        LocalDateTime now = LocalDateTime.now(ZoneId.of(attendanceZone));
        AttendanceSession session = sessionService.getActiveSession(student.getClassroom(), now).orElse(null);
        if (session == null) return ScanResult.noTime(ScanResult.NO_ACTIVE_SESSION);

        Attendance attendance = attendanceRepository.findByStudent_IdAndSession_Id(student.getId(), session.getId())
                .orElse(null);
        if (attendance == null) {
            // Normally created as ABSENT when the session starts; keep this for roster changes mid-session.
            attendance = new Attendance();
            attendance.setDate(session.getSessionDate());
            attendance.setStudent(student);
            attendance.setSession(session);
            attendance.setStatus(Attendance_status.ABWESEND);
        }

        if (attendance.getCheckout() != null) {
            return ScanResult.withTime(ScanResult.SESSION_CLOSED, attendance.getCheckout());
        }
        if (attendance.getCheckin() != null) {
            return ScanResult.withTime(ScanResult.ALREADY_CHECKED_IN, attendance.getCheckin());
        }

        registerCheckin(session, attendance, now, "RFID",
                AttendanceAuditEventType.CHECKED_IN, "RFID scan by student card");
        return ScanResult.withTime(ScanResult.CHECKED_IN, now);
    }

    private void registerCheckin(AttendanceSession session, Attendance attendance,
                                 LocalDateTime now, String actor, AttendanceAuditEventType eventType, String details) {
        if (attendance.getCheckin() != null || attendance.getCheckout() != null) return;
        attendance.setCheckin(now);
        attendance.setStatus(LateArrivalPolicy.isLate(now, session.getScheduledStart(),
                attendanceSettingsService.getLateGraceMinutes())
                ? Attendance_status.VERSPAETET : Attendance_status.ANWESEND);
        attendanceRepository.save(attendance);

        AttendanceAuditEvent event = new AttendanceAuditEvent();
        event.setAttendance(attendance);
        event.setSession(session);
        event.setEventType(eventType);
        event.setEventAt(now);
        event.setActorUsername(actor);
        event.setDetails(details);
        auditRepository.save(event);
        systemAuditLogService.record(actor, eventType.name(), "ATTENDANCE", attendance.getId().toString(),
                details, null, "checkin=" + now + "; status=" + attendance.getStatus().name());
    }

    private String normalizeUid(String chipId) {
        return chipId.trim().replaceAll("\\s+", "").toLowerCase(Locale.ROOT);
    }

    public record ScanResult(String status, String time) {
        public static final String CHECKED_IN = "CHECKED_IN";
        public static final String ALREADY_CHECKED_IN = "ALREADY_CHECKED_IN";
        public static final String UNKNOWN_CARD = "UNKNOWN_CARD";
        public static final String NOT_ASSIGNED = "NOT_ASSIGNED";
        public static final String NO_ACTIVE_SESSION = "NO_ACTIVE_SESSION";
        public static final String SESSION_CLOSED = "SESSION_CLOSED";
        public static final String CARD_INACTIVE = "CARD_INACTIVE";

        public static ScanResult noTime(String status) { return new ScanResult(status, null); }
        public static ScanResult withTime(String status, LocalDateTime time) {
            return new ScanResult(status, time.format(DateTimeFormatter.ofPattern("HH:mm:ss")));
        }
    }
}
