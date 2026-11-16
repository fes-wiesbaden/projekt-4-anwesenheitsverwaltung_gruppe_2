package com.feswiesbaden.attendencemanagement.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.feswiesbaden.attendencemanagement.entity.Attendance;
import com.feswiesbaden.attendencemanagement.entity.Attendance_status;
import com.feswiesbaden.attendencemanagement.entity.Student;
import com.feswiesbaden.attendencemanagement.entity.Rfid_chip;
import com.feswiesbaden.attendencemanagement.repository.AttendanceRepository;
import com.feswiesbaden.attendencemanagement.repository.ClassroomRepository;
import com.feswiesbaden.attendencemanagement.repository.RfidRepository;
import com.feswiesbaden.attendencemanagement.repository.StudentRepository;

@ExtendWith(MockitoExtension.class)
class AttendanceServiceTest {

    @Mock
    private RfidRepository rfidRepository;

    @Mock
    private StudentRepository studentRepository;

    @Mock
    private ClassroomRepository classroomRepository;

    @Mock
    private AttendanceRepository attendanceRepository;

    @Mock
    private TimetableService timetableService;

    @InjectMocks
    private AttendanceService attendanceService;

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
        Rfid_chip chip = new Rfid_chip();
        chip.setId(UUID.randomUUID());
        when(rfidRepository.findByChipId("unassigned")).thenReturn(chip);
        when(studentRepository.findByRfidChip_Id(chip.getId())).thenReturn(null);

        AttendanceService.ScanResult result = attendanceService.handleScan("unassigned");

        assertThat(result.status()).isEqualTo(AttendanceService.ScanResult.NOT_ASSIGNED);
        assertThat(result.time()).isNull();
        verifyNoInteractions(attendanceRepository);
    }

    @Test
    void handleScan_firstScanCreatesAttendanceAndChecksStudentIn() {
        UUID studentId = UUID.randomUUID();
        Student student = new Student();
        student.setId(studentId);
        student.setDisplayName("Alex");
        Rfid_chip chip = new Rfid_chip();
        chip.setId(UUID.randomUUID());
        when(rfidRepository.findByChipId("known")).thenReturn(chip);
        when(studentRepository.findByRfidChip_Id(chip.getId())).thenReturn(student);
        when(attendanceRepository.findByStudent_IdAndDate(studentId, LocalDate.now())).thenReturn(null);

        LocalDateTime beforeScan = LocalDateTime.now();
        AttendanceService.ScanResult result = attendanceService.handleScan("known");
        LocalDateTime afterScan = LocalDateTime.now();

        ArgumentCaptor<Attendance> attendanceCaptor = ArgumentCaptor.forClass(Attendance.class);
        verify(attendanceRepository).save(attendanceCaptor.capture());
        Attendance saved = attendanceCaptor.getValue();
        assertThat(result.status()).isEqualTo(AttendanceService.ScanResult.CHECKED_IN);
        assertThat(result.time()).matches("\\d{2}:\\d{2}:\\d{2}");
        assertThat(saved.getStudent()).isSameAs(student);
        assertThat(saved.getDate()).isEqualTo(LocalDate.now());
        assertThat(saved.getStatus()).isEqualTo(Attendance_status.ANWESEND);
        assertThat(saved.getCheckin()).isBetween(beforeScan, afterScan);
        assertThat(result.time()).isEqualTo(saved.getCheckin().format(
                java.time.format.DateTimeFormatter.ofPattern("HH:mm:ss")));
    }

    @Test
    void handleScan_alreadyCheckedInReturnsOriginalCheckinWithoutSaving() {
        UUID studentId = UUID.randomUUID();
        Student student = new Student();
        student.setId(studentId);
        student.setDisplayName("Alex");
        Rfid_chip chip = new Rfid_chip();
        chip.setId(UUID.randomUUID());
        LocalDateTime originalCheckin = LocalDate.now().atTime(8, 15, 30);
        Attendance existing = new Attendance();
        existing.setCheckin(originalCheckin);
        when(rfidRepository.findByChipId("known")).thenReturn(chip);
        when(studentRepository.findByRfidChip_Id(chip.getId())).thenReturn(student);
        when(attendanceRepository.findByStudent_IdAndDate(studentId, LocalDate.now())).thenReturn(existing);

        AttendanceService.ScanResult result = attendanceService.handleScan("known");

        assertThat(result.status()).isEqualTo(AttendanceService.ScanResult.ALREADY_CHECKED_IN);
        assertThat(result.time()).isEqualTo("08:15:30");
        verify(attendanceRepository, never()).save(any(Attendance.class));
    }

    @Test
    void checkoutClassChecksOutOnlyStudentsWithAnOpenAttendanceAtScheduledTime() {
        Long classroomId = 12L;
        LocalDate date = LocalDate.of(2026, 11, 16);
        Student checkedInStudent = studentWithId();
        Student notCheckedInStudent = studentWithId();
        Student alreadyCheckedOutStudent = studentWithId();
        Attendance openAttendance = new Attendance();
        openAttendance.setCheckin(date.atTime(8, 0));
        Attendance noCheckinAttendance = new Attendance();
        Attendance closedAttendance = new Attendance();
        closedAttendance.setCheckin(date.atTime(8, 0));
        closedAttendance.setCheckout(date.atTime(14, 0));

        when(timetableService.findCheckoutTime(classroomId, date)).thenReturn(Optional.of(LocalTime.of(15, 30)));
        when(studentRepository.findByClassroom_Id(classroomId))
                .thenReturn(List.of(checkedInStudent, notCheckedInStudent, alreadyCheckedOutStudent));
        when(attendanceRepository.findByStudent_IdAndDate(checkedInStudent.getId(), date))
                .thenReturn(openAttendance);
        when(attendanceRepository.findByStudent_IdAndDate(notCheckedInStudent.getId(), date))
                .thenReturn(noCheckinAttendance);
        when(attendanceRepository.findByStudent_IdAndDate(alreadyCheckedOutStudent.getId(), date))
                .thenReturn(closedAttendance);

        int checkedOut = attendanceService.checkoutClass(classroomId, date);

        assertThat(checkedOut).isEqualTo(1);
        assertThat(openAttendance.getCheckout()).isEqualTo(date.atTime(15, 30));
        verify(attendanceRepository).save(openAttendance);
        verify(attendanceRepository, never()).save(noCheckinAttendance);
        verify(attendanceRepository, never()).save(closedAttendance);
    }

    private Student studentWithId() {
        Student student = new Student();
        student.setId(UUID.randomUUID());
        return student;
    }
}
