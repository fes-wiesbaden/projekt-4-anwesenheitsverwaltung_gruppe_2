package com.feswiesbaden.attendencemanagement.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.never;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.feswiesbaden.attendencemanagement.entity.Classroom;
import com.feswiesbaden.attendencemanagement.entity.Timetable;
import com.feswiesbaden.attendencemanagement.repository.AttendanceSessionRepository;
import com.feswiesbaden.attendencemanagement.repository.TimetableRepository;

@ExtendWith(MockitoExtension.class)
class TimetableServiceTest {

    @Mock
    private TimetableRepository timetableRepository;

    @Mock
    private AttendanceSessionRepository sessionRepository;

    @Mock
    private SystemAuditLogService systemAuditLogService;

    @InjectMocks
    private TimetableService timetableService;

    @Test
    void setTimetable_updatesExistingDayEntry() {
        Classroom classroom = classroom(4L);
        Timetable existing = new Timetable();
        existing.setId(40L);
        existing.setClassroom(classroom);
        existing.setDayOfWeek(DayOfWeek.MONDAY);
        existing.setStartTime(LocalTime.of(8, 0));
        when(timetableRepository.findByClassroom_IdAndDayOfWeek(4L, DayOfWeek.MONDAY))
                .thenReturn(Optional.of(existing));
        when(timetableRepository.save(existing)).thenReturn(existing);

        Timetable saved = timetableService.setTimetable(classroom, DayOfWeek.MONDAY,
                LocalTime.of(8, 0), LocalTime.of(15, 0), "teacher");

        assertThat(saved).isSameAs(existing);
        assertThat(saved.getStartTime()).isEqualTo(LocalTime.of(8, 0));
        assertThat(saved.getCheckoutTime()).isEqualTo(LocalTime.of(15, 0));
        verify(timetableRepository).save(existing);
    }

    @Test
    void setTimetable_createsEntryWhenDayHasNoSchedule() {
        Classroom classroom = classroom(5L);
        when(timetableRepository.findByClassroom_IdAndDayOfWeek(5L, DayOfWeek.FRIDAY))
                .thenReturn(Optional.empty());
        when(timetableRepository.save(org.mockito.ArgumentMatchers.any(Timetable.class)))
                .thenAnswer(invocation -> {
                    Timetable timetable = invocation.getArgument(0);
                    timetable.setId(41L);
                    return timetable;
                });

        Timetable saved = timetableService.setTimetable(classroom, DayOfWeek.FRIDAY,
                LocalTime.of(8, 30), LocalTime.of(13, 30), "teacher");

        assertThat(saved.getClassroom()).isSameAs(classroom);
        assertThat(saved.getDayOfWeek()).isEqualTo(DayOfWeek.FRIDAY);
        assertThat(saved.getStartTime()).isEqualTo(LocalTime.of(8, 30));
        assertThat(saved.getCheckoutTime()).isEqualTo(LocalTime.of(13, 30));
    }

    @Test
    void getTimetableReturnsRepositoryEntries() {
        List<Timetable> entries = List.of(new Timetable());
        when(timetableRepository.findByClassroom_Id(4L)).thenReturn(entries);

        assertThat(timetableService.getTimetable(4L)).isSameAs(entries);
    }

    @Test
    void findCheckoutTimeUsesDateDayOfWeek() {
        LocalDate date = LocalDate.of(2026, 11, 16);
        Timetable entry = new Timetable();
        entry.setCheckoutTime(LocalTime.of(14, 45));
        when(timetableRepository.findByClassroom_IdAndDayOfWeek(4L, date.getDayOfWeek()))
                .thenReturn(Optional.of(entry));

        assertThat(timetableService.findCheckoutTime(4L, date)).contains(LocalTime.of(14, 45));
    }

    @Test
    void deleteEntryDelegatesClassroomAndDay() {
        when(timetableRepository.findByClassroom_IdAndDayOfWeek(4L, DayOfWeek.TUESDAY))
                .thenReturn(Optional.empty());

        timetableService.deleteEntry(4L, DayOfWeek.TUESDAY, "teacher");

        verify(timetableRepository, never()).delete(org.mockito.ArgumentMatchers.any(Timetable.class));
    }

    private Classroom classroom(Long id) {
        Classroom classroom = new Classroom();
        classroom.setId(id);
        return classroom;
    }
}
