package com.feswiesbaden.attendencemanagement.repository;

import java.time.DayOfWeek;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import jakarta.persistence.LockModeType;

import com.feswiesbaden.attendencemanagement.entity.Timetable;

public interface TimetableRepository extends JpaRepository<Timetable, Long> {
    List<Timetable> findByClassroom_Id(Long classroomId);
    List<Timetable> findByDayOfWeek(DayOfWeek dayOfWeek);
    Optional<Timetable> findByClassroom_IdAndDayOfWeek(Long classroomId, DayOfWeek dayOfWeek);
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select t from Timetable t where t.id = :id")
    Optional<Timetable> findByIdForUpdate(@Param("id") Long id);
    void deleteByClassroom_IdAndDayOfWeek(Long classroomId, DayOfWeek dayOfWeek);
}
