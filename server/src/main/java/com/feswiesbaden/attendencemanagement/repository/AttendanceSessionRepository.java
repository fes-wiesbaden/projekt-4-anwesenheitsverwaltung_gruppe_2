package com.feswiesbaden.attendencemanagement.repository;

import com.feswiesbaden.attendencemanagement.entity.AttendanceSession;
import com.feswiesbaden.attendencemanagement.entity.AttendanceSessionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface AttendanceSessionRepository extends JpaRepository<AttendanceSession, Long> {
    Optional<AttendanceSession> findByTimetable_IdAndSessionDate(Long timetableId, LocalDate sessionDate);
    boolean existsByTimetable_Id(Long timetableId);
    @Query("select s from AttendanceSession s join fetch s.timetable t join fetch t.classroom where s.sessionDate = :date and t.classroom.id = :classroomId")
    Optional<AttendanceSession> findDetailedBySessionDateAndClassroom(@Param("date") LocalDate date,
                                                                        @Param("classroomId") Long classroomId);
    @Query("select s from AttendanceSession s join fetch s.timetable t join fetch t.classroom where s.id = :id")
    Optional<AttendanceSession> findDetailedById(@Param("id") Long id);
    List<AttendanceSession> findBySessionDateAndStatus(LocalDate sessionDate, AttendanceSessionStatus status);
    List<AttendanceSession> findByStatusAndScheduledEndLessThanEqual(AttendanceSessionStatus status, LocalDateTime scheduledEnd);
    List<AttendanceSession> findByTimetable_Classroom_IdAndSessionDateBetweenOrderBySessionDateDesc(
            Long classroomId, LocalDate from, LocalDate to);
}
