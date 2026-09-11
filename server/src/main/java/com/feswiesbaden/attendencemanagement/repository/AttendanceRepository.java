package com.feswiesbaden.attendencemanagement.repository;

import com.feswiesbaden.attendencemanagement.entity.Attendance;
import com.feswiesbaden.attendencemanagement.entity.Classroom;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface AttendanceRepository extends JpaRepository<Attendance, Long> {
    Attendance findByStudent_IdAndDate(UUID studentId, LocalDate date);

    List<Attendance> findByStudent_ClassroomAndCheckinBetween(
            Classroom classroom, LocalDateTime start, LocalDateTime end);

    @Query(value = "select a from Attendance a where a.student.id = ?1")
    List<Attendance> findAllByStudent_id(UUID studentId);
}
