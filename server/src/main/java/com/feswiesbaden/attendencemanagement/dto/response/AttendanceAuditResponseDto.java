package com.feswiesbaden.attendencemanagement.dto.response;

import com.feswiesbaden.attendencemanagement.entity.AttendanceAuditEvent;
import java.time.LocalDateTime;
import java.util.UUID;

public record AttendanceAuditResponseDto(
        Long id, Long attendanceId, UUID studentId, String eventType, LocalDateTime eventAt,
        String actorUsername, String details) {
    public AttendanceAuditResponseDto(AttendanceAuditEvent event) {
        this(event.getId(), event.getAttendance().getId(), event.getAttendance().getStudent().getId(),
                event.getEventType().name(), event.getEventAt(), event.getActorUsername(), event.getDetails());
    }
}
