package com.feswiesbaden.attendencemanagement.dto.response;

import com.feswiesbaden.attendencemanagement.entity.Attendance;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

public record AttendanceRecordResponseDto(
        Long id, UUID studentId, String studentName, Long sessionId, LocalDate date,
        String status, LocalDateTime checkin, LocalDateTime checkout,
        String checkoutReason, String checkedOutBy, String description) {
    public AttendanceRecordResponseDto(Attendance attendance) {
        this(attendance.getId(), attendance.getStudent().getId(), attendance.getStudent().getDisplayName(),
                attendance.getSession() == null ? null : attendance.getSession().getId(),
                attendance.getDate(), attendance.getStatus() == null ? null : attendance.getStatus().name(),
                attendance.getCheckin(), attendance.getCheckout(), attendance.getCheckoutReason(),
                attendance.getCheckedOutBy(), attendance.getDescription());
    }
}
