package com.feswiesbaden.attendencemanagement.repository;

import com.feswiesbaden.attendencemanagement.entity.Attendance;
import com.feswiesbaden.attendencemanagement.entity.Classroom;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AttendanceRepository extends JpaRepository<Attendance, Long> {
    // Legacy day-based lookup is retained for historical records created before session migration.
    Attendance findByStudent_IdAndDate(UUID studentId, LocalDate date);

    Optional<Attendance> findByStudent_IdAndSession_Id(UUID studentId, Long sessionId);
    @EntityGraph(attributePaths = {"student"})
    List<Attendance> findBySession_Id(Long sessionId);
    List<Attendance> findBySession_IdAndCheckinIsNotNullAndCheckoutIsNull(Long sessionId);
    List<Attendance> findByStudent_ClassroomAndCheckinBetween(Classroom classroom, LocalDateTime start, LocalDateTime end);
    @EntityGraph(attributePaths = {"student"})
    List<Attendance> findByStudent_ClassroomAndDate(Classroom classroom, LocalDate date);
    @EntityGraph(attributePaths = {"student"})
    List<Attendance> findAllByStudent_Id(UUID studentId);
    @EntityGraph(attributePaths = {"student", "student.classroom", "session"})
    @Override
    List<Attendance> findAll();
    boolean existsByStudent_Id(UUID studentId);
}
