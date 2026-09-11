package com.feswiesbaden.attendencemanagement.service;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.feswiesbaden.attendencemanagement.entity.Classroom;
import com.feswiesbaden.attendencemanagement.entity.Timetable;
import com.feswiesbaden.attendencemanagement.repository.TimetableRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class TimetableService {

    private final TimetableRepository timetableRepository;

    @Transactional
    public Timetable setCheckoutTime(Classroom classroom, DayOfWeek dayOfWeek, LocalTime checkoutTime) {
        Timetable entry = timetableRepository
                .findByClassroom_IdAndDayOfWeek(classroom.getId(), dayOfWeek)
                .orElseGet(() -> {
                    Timetable timetable = new Timetable();
                    timetable.setClassroom(classroom);
                    timetable.setDayOfWeek(dayOfWeek);
                    return timetable;
                });
        entry.setCheckoutTime(checkoutTime);
        return timetableRepository.save(entry);
    }

    public List<Timetable> getTimetable(Long classroomId) {
        return timetableRepository.findByClassroom_Id(classroomId);
    }

    @Transactional
    public void deleteEntry(Long classroomId, DayOfWeek dayOfWeek) {
        timetableRepository.deleteByClassroom_IdAndDayOfWeek(classroomId, dayOfWeek);
    }

    public Optional<LocalTime> findCheckoutTime(Long classroomId, LocalDate date) {
        return timetableRepository
                .findByClassroom_IdAndDayOfWeek(classroomId, date.getDayOfWeek())
                .map(Timetable::getCheckoutTime);
    }
}
