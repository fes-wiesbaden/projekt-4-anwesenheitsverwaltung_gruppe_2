package com.feswiesbaden.attendencemanagement.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import com.feswiesbaden.attendencemanagement.entity.Attendance;
import com.feswiesbaden.attendencemanagement.entity.AttendanceSession;
import com.feswiesbaden.attendencemanagement.entity.Attendance_status;
import com.feswiesbaden.attendencemanagement.entity.Classroom;
import com.feswiesbaden.attendencemanagement.entity.Rfid_chip;
import com.feswiesbaden.attendencemanagement.entity.Student;
import com.feswiesbaden.attendencemanagement.repository.AttendanceAuditRepository;
import com.feswiesbaden.attendencemanagement.repository.AttendanceRepository;
import com.feswiesbaden.attendencemanagement.repository.RfidRepository;
import com.feswiesbaden.attendencemanagement.repository.StudentRepository;

@ExtendWith(MockitoExtension.class)
class AttendanceServiceTest {

    @Mock private RfidRepository rfidRepository;
    @Mock private StudentRepository studentRepository;
    @Mock private AttendanceRepository attendanceRepository;
    @Mock private AttendanceAuditRepository auditRepository;
    @Mock private AttendanceSessionService sessionService;
    @Mock private AttendanceSettingsService attendanceSettingsService;
    @Mock private SystemAuditLogService systemAuditLogService;

    @InjectMocks
    private AttendanceService attendanceService;

    @BeforeEach
    void configureZone() {
        ReflectionTestUtils.setField(attendanceService, "attendanceZone", "Europe/Berlin");
    }

    @Test
    void handleScan_blankChipIdReturnsUnknownCardWithoutRepositoryCalls() {
        AttendanceService.ScanResult result = attendanceService.handleScan("  ");

        assertThat(result.status()).isEqualTo(AttendanceService.ScanResult.UNKNOWN_CARD);
        assertThat(result.time()).isNull();
        verifyNoInteractions(rfidRepository, studentRepository, attendanceRepository);
    }

    @Test
    void handleScan_unknownCardReturnsUnknownCard() {
        when(rfidRepository.findByChipId("missing")).thenReturn(null);

        AttendanceService.ScanResult result = attendanceService.handleScan("missing");

        assertThat(result.status()).isEqualTo(AttendanceService.ScanResult.UNKNOWN_CARD);
        assertThat(result.time()).isNull();
        verifyNoInteractions(studentRepository, attendanceRepository);
    }

    @Test
    void handleScan_unassignedCardReturnsNotAssigned() {
        Rfid_chip chip = activeChip();
        when(rfidRepository.findByChipId("known")).thenReturn(chip);
        when(studentRepository.findByRfidChip_Id(chip.getId())).thenReturn(null);

        AttendanceService.ScanResult result = attendanceService.handleScan("known");

        assertThat(result.status()).isEqualTo(AttendanceService.ScanResult.NOT_ASSIGNED);
        assertThat(result.time()).isNull();
        verifyNoInteractions(attendanceRepository);
    }

    @Test
    void handleScan_inactiveCardReturnsCardInactive() {
        Rfid_chip chip = activeChip();
        chip.setActive(false);
        when(rfidRepository.findByChipId("known")).thenReturn(chip);

        AttendanceService.ScanResult result = attendanceService.handleScan("known");

        assertThat(result.status()).isEqualTo(AttendanceService.ScanResult.CARD_INACTIVE);
        assertThat(result.time()).isNull();
        verifyNoInteractions(studentRepository, attendanceRepository);
    }

    @Test
    void handleScan_withoutActiveSessionReturnsNoActiveSession() {
        Rfid_chip chip = activeChip();
        Student student = studentWithClassroom();
        when(rfidRepository.findByChipId("known")).thenReturn(chip);
        when(studentRepository.findByRfidChip_Id(chip.getId())).thenReturn(student);
        when(sessionService.getActiveSession(any(Classroom.class), any(LocalDateTime.class)))
                .thenReturn(Optional.empty());

        AttendanceService.ScanResult result = attendanceService.handleScan("known");

        assertThat(result.status()).isEqualTo(AttendanceService.ScanResult.NO_ACTIVE_SESSION);
        assertThat(result.time()).isNull();
        verifyNoInteractions(attendanceRepository);
    }

    @Test
    void handleScan_firstScanCreatesAttendanceAndChecksStudentIn() {
        Rfid_chip chip = activeChip();
        Student student = studentWithClassroom();
        AttendanceSession session = activeSession(student.getClassroom());
        when(rfidRepository.findByChipId("known")).thenReturn(chip);
        when(studentRepository.findByRfidChip_Id(chip.getId())).thenReturn(student);
        when(sessionService.getActiveSession(any(Classroom.class), any(LocalDateTime.class)))
                .thenReturn(Optional.of(session));
        when(attendanceRepository.findByStudent_IdAndSession_Id(student.getId(), session.getId()))
                .thenReturn(Optional.empty());
        when(attendanceSettingsService.getLateGraceMinutes()).thenReturn(5);
        when(attendanceRepository.save(any(Attendance.class))).thenAnswer(invocation -> {
            Attendance attendance = invocation.getArgument(0);
            attendance.setId(99L);
            return attendance;
        });

        LocalDateTime beforeScan = LocalDateTime.now();
        AttendanceService.ScanResult result = attendanceService.handleScan("known");
        LocalDateTime afterScan = LocalDateTime.now();

        ArgumentCaptor<Attendance> attendanceCaptor = ArgumentCaptor.forClass(Attendance.class);
        verify(attendanceRepository).save(attendanceCaptor.capture());
        Attendance saved = attendanceCaptor.getValue();

        assertThat(result.status()).isEqualTo(AttendanceService.ScanResult.CHECKED_IN);
        assertThat(result.time()).matches("\\d{2}:\\d{2}:\\d{2}");
        assertThat(saved.getStudent()).isSameAs(student);
        assertThat(saved.getSession()).isSameAs(session);
        assertThat(saved.getStatus()).isIn(Attendance_status.ANWESEND, Attendance_status.VERSPAETET);
        assertThat(saved.getCheckin()).isBetween(beforeScan, afterScan);
        assertThat(result.time()).isEqualTo(saved.getCheckin().format(
                java.time.format.DateTimeFormatter.ofPattern("HH:mm:ss")));
        verify(auditRepository).save(any());
    }

    @Test
    void handleScan_alreadyCheckedInReturnsOriginalCheckinWithoutSaving() {
        Rfid_chip chip = activeChip();
        Student student = studentWithClassroom();
        AttendanceSession session = activeSession(student.getClassroom());
        LocalDateTime originalCheckin = LocalDateTime.now().minusHours(1);
        Attendance existing = new Attendance();
        existing.setCheckin(originalCheckin);
        when(rfidRepository.findByChipId("known")).thenReturn(chip);
        when(studentRepository.findByRfidChip_Id(chip.getId())).thenReturn(student);
        when(sessionService.getActiveSession(any(Classroom.class), any(LocalDateTime.class)))
                .thenReturn(Optional.of(session));
        when(attendanceRepository.findByStudent_IdAndSession_Id(student.getId(), session.getId()))
                .thenReturn(Optional.of(existing));

        AttendanceService.ScanResult result = attendanceService.handleScan("known");

        assertThat(result.status()).isEqualTo(AttendanceService.ScanResult.ALREADY_CHECKED_IN);
        assertThat(result.time()).isEqualTo(originalCheckin.format(
                java.time.format.DateTimeFormatter.ofPattern("HH:mm:ss")));
        verify(attendanceRepository, never()).save(any(Attendance.class));
        verifyNoInteractions(auditRepository, attendanceSettingsService);
    }

    private Rfid_chip activeChip() {
        Rfid_chip chip = new Rfid_chip();
        chip.setId(UUID.randomUUID());
        chip.setActive(true);
        return chip;
    }

    private Student studentWithClassroom() {
        Classroom classroom = new Classroom();
        classroom.setId(12L);
        Student student = new Student();
        student.setId(UUID.randomUUID());
        student.setDisplayName("Alex");
        student.setClassroom(classroom);
        return student;
    }

    private AttendanceSession activeSession(Classroom classroom) {
        AttendanceSession session = new AttendanceSession();
        session.setId(25L);
        session.setSessionDate(java.time.LocalDate.now());
        session.setScheduledStart(LocalDateTime.now().minusHours(1));
        session.setScheduledEnd(LocalDateTime.now().plusHours(6));
        return session;
    }
}
