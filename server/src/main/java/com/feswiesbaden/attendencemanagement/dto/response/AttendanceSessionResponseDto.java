package com.feswiesbaden.attendencemanagement.dto.response;

import com.feswiesbaden.attendencemanagement.entity.AttendanceSession;
import java.time.LocalDate;
import java.time.LocalDateTime;

public record AttendanceSessionResponseDto(
        Long id, Long classroomId, String classroomName, LocalDate sessionDate,
        LocalDateTime scheduledStart, LocalDateTime scheduledEnd, LocalDateTime startedAt,
        LocalDateTime endedAt, String endedBy, String endReason, String status) {
    public AttendanceSessionResponseDto(AttendanceSession session) {
        this(session.getId(), session.getTimetable().getClassroom().getId(),
                session.getTimetable().getClassroom().getClassroomName(), session.getSessionDate(),
                session.getScheduledStart(), session.getScheduledEnd(), session.getStartedAt(),
                session.getEndedAt(), session.getEndedBy(), session.getEndReason(), session.getStatus().name());
    }
}
