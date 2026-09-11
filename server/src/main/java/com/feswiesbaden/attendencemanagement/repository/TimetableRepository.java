package com.feswiesbaden.attendencemanagement.repository;

import java.time.DayOfWeek;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.feswiesbaden.attendencemanagement.entity.Timetable;

public interface TimetableRepository extends JpaRepository<Timetable, Long> {

    List<Timetable> findByClassroom_Id(Long classroomId);

    Optional<Timetable> findByClassroom_IdAndDayOfWeek(Long classroomId, DayOfWeek dayOfWeek);

    void deleteByClassroom_IdAndDayOfWeek(Long classroomId, DayOfWeek dayOfWeek);
}
