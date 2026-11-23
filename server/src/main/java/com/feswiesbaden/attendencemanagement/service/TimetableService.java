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
import com.feswiesbaden.attendencemanagement.repository.AttendanceSessionRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class TimetableService {

    private final TimetableRepository timetableRepository;
    private final AttendanceSessionRepository sessionRepository;
    private final SystemAuditLogService systemAuditLogService;

    @Transactional
    public Timetable setTimetable(Classroom classroom, DayOfWeek dayOfWeek, LocalTime startTime, LocalTime checkoutTime, String actor) {
        if (startTime == null || checkoutTime == null || !checkoutTime.isAfter(startTime)) {
            throw new IllegalArgumentException("Checkout time must be later than start time.");
        }
        Timetable entry = timetableRepository
                .findByClassroom_IdAndDayOfWeek(classroom.getId(), dayOfWeek)
                .orElseGet(() -> {
                    Timetable timetable = new Timetable();
                    timetable.setClassroom(classroom);
                    timetable.setDayOfWeek(dayOfWeek);
                    return timetable;
                });
        entry.setStartTime(startTime);
        entry.setCheckoutTime(checkoutTime);
        Timetable saved = timetableRepository.save(entry);
        systemAuditLogService.record(actor, "TIMETABLE_CHANGED", "TIMETABLE", saved.getId().toString(),
                "Timetable set for class " + classroom.getClassroomName() + " on " + dayOfWeek,
                null, startTime + "-" + checkoutTime);
        return saved;
    }

    public List<Timetable> getTimetable(Long classroomId) {
        return timetableRepository.findByClassroom_Id(classroomId);
    }

    @Transactional
    public void deleteEntry(Long classroomId, DayOfWeek dayOfWeek, String actor) {
        Timetable entry = timetableRepository.findByClassroom_IdAndDayOfWeek(classroomId, dayOfWeek).orElse(null);
        if (entry == null) return;
        if (sessionRepository.existsByTimetable_Id(entry.getId())) {
            throw new IllegalStateException("This timetable has attendance history and cannot be deleted. Update its times instead.");
        }
        systemAuditLogService.record(actor, "TIMETABLE_DELETED", "TIMETABLE", entry.getId().toString(),
                "Timetable deleted for class " + entry.getClassroom().getClassroomName(), entry.getStartTime()+"-"+entry.getCheckoutTime(), null);
        timetableRepository.delete(entry);
    }

    public Optional<LocalTime> findCheckoutTime(Long classroomId, LocalDate date) {
        return timetableRepository.findByClassroom_IdAndDayOfWeek(classroomId, date.getDayOfWeek())
                .map(Timetable::getCheckoutTime);
    }
}
