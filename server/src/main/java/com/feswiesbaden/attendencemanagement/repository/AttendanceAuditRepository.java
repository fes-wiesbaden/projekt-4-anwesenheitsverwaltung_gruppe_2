package com.feswiesbaden.attendencemanagement.repository;

import com.feswiesbaden.attendencemanagement.entity.AttendanceAuditEvent;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface AttendanceAuditRepository extends JpaRepository<AttendanceAuditEvent, Long> {
    List<AttendanceAuditEvent> findByAttendance_IdOrderByEventAtAsc(Long attendanceId);
    @EntityGraph(attributePaths = {"attendance", "attendance.student"})
    @Query("select e from AttendanceAuditEvent e where e.session.id = :sessionId order by e.eventAt asc")
    List<AttendanceAuditEvent> findDetailedBySessionId(@Param("sessionId") Long sessionId);
}
