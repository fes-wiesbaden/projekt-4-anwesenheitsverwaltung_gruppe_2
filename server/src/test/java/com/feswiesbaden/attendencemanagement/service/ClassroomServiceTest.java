package com.feswiesbaden.attendencemanagement.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.feswiesbaden.attendencemanagement.entity.Attendance;
import com.feswiesbaden.attendencemanagement.entity.Classroom;
import com.feswiesbaden.attendencemanagement.entity.Role;
import com.feswiesbaden.attendencemanagement.entity.User;
import com.feswiesbaden.attendencemanagement.exceptions.ClassroomNotFoundException;
import com.feswiesbaden.attendencemanagement.repository.AttendanceRepository;
import com.feswiesbaden.attendencemanagement.repository.AttendanceSessionRepository;
import com.feswiesbaden.attendencemanagement.repository.ClassroomRepository;
import com.feswiesbaden.attendencemanagement.entity.AttendanceSession;

@ExtendWith(MockitoExtension.class)
class ClassroomServiceTest {

    @Mock
    private ClassroomRepository classroomRepository;

    @Mock
    private AttendanceRepository attendanceRepository;

    @Mock
    private AttendanceSessionRepository sessionRepository;

    @InjectMocks
    private ClassroomService classroomService;

    @Test
    void hasAccess_allowsAdministrator() {
        User admin = userWithId(Role.ADMIN, UUID.randomUUID());

        assertThat(classroomService.hasAccess(admin, classroom(1L))).isTrue();
    }

    @Test
    void hasAccess_allowsClassOwner() {
        User owner = userWithId(Role.TEACHER, UUID.randomUUID());
        owner.setMyClassroom(classroom(1L));

        assertThat(classroomService.hasAccess(owner, classroom(1L))).isTrue();
    }

    @Test
    void hasAccess_allowsAssignedTeacher() {
        User teacher = userWithId(Role.TEACHER, UUID.randomUUID());
        Classroom classroom = classroom(1L);
        classroom.setTeachers(List.of(teacher));

        assertThat(classroomService.hasAccess(teacher, classroom)).isTrue();
    }

    @Test
    void hasAccess_deniesUnrelatedUser() {
        User user = userWithId(Role.TEACHER, UUID.randomUUID());
        Classroom classroom = classroom(1L);
        classroom.setTeachers(new ArrayList<>());

        assertThat(classroomService.hasAccess(user, classroom)).isFalse();
    }

    @Test
    void getAttendancesQueriesWholeDayForClassroom() {
        LocalDate date = LocalDate.of(2026, 11, 16);
        Classroom classroom = classroom(1L);
        List<Attendance> attendances = List.of(new Attendance());
        when(classroomRepository.findByClassroomName("10A")).thenReturn(Optional.of(classroom));
        AttendanceSession session = new AttendanceSession();
        session.setId(42L);
        when(sessionRepository.findDetailedBySessionDateAndClassroom(date, 1L))
                .thenReturn(Optional.of(session));
        when(attendanceRepository.findBySession_Id(42L)).thenReturn(attendances);

        assertThat(classroomService.getAttendances("10A", date)).isSameAs(attendances);
        verify(attendanceRepository).findBySession_Id(42L);
    }

    @Test
    void getAttendances_throwsWhenClassroomDoesNotExist() {
        LocalDate date = LocalDate.of(2026, 11, 16);
        when(classroomRepository.findByClassroomName("missing")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> classroomService.getAttendances("missing", date))
                .isInstanceOf(ClassroomNotFoundException.class);
    }

    private Classroom classroom(Long id) {
        Classroom classroom = new Classroom();
        classroom.setId(id);
        return classroom;
    }

    private User userWithId(Role role, UUID id) {
        User user = new User();
        user.setRole(role);
        user.setId(id);
        return user;
    }
}
