package com.feswiesbaden.attendencemanagement.service;

import com.feswiesbaden.attendencemanagement.entity.*;
import com.feswiesbaden.attendencemanagement.repository.AttendanceRepository;
import com.feswiesbaden.attendencemanagement.repository.ClassroomRepository;
import com.feswiesbaden.attendencemanagement.repository.RfidRepository;
import com.feswiesbaden.attendencemanagement.repository.StudentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AttendanceService {

    private final RfidRepository rfidRepository;

    private final StudentRepository studentRepository;

    private final ClassroomRepository classroomRepository;

    private final AttendanceRepository attendanceRepository;

    private final TimetableService timetableService;

    public void checkin(String chipId) {
        if (chipId.isEmpty()) return;
        if (!rfidRepository.existsByChipId(chipId)) return;

        Rfid_chip rfidChip = rfidRepository.findByChipId(chipId);
        Student student = studentRepository.findByRfidChip_Id(rfidChip.getId());

        doCheckin(student.getId());
    }

    public void checkin(UUID studentId) {
        doCheckin(studentId);
    }

    private void doCheckin(UUID studentId) {

        LocalDateTime checkinTime = LocalDateTime.now();
        LocalDate date = checkinTime.toLocalDate();

        Student student = studentRepository.findById(studentId).orElseThrow();

        Attendance attendance = attendanceRepository.findByStudent_IdAndDate(studentId, date);
        if (attendance == null) {
            attendance = new Attendance();
            attendance.setDate(date);
            attendance.setStudent(student);
        }

        if (attendance.getCheckin() == null) {
            attendance.setCheckin(checkinTime);
            attendance.setStatus(Attendance_status.ANWESEND);
        }

        attendanceRepository.save(attendance);
    }


    public void checkout(String chipId) {
        System.out.println("Student " + chipId + " checking out");
        // TODO

        if (chipId.isEmpty()) return;
        if (!rfidRepository.existsByChipId(chipId)) return;

        Rfid_chip rfidChip = rfidRepository.findByChipId(chipId);
        Student student = studentRepository.findByRfidChip_Id(rfidChip.getId());

        LocalDateTime checkoutTime = LocalDateTime.now();

        doCheckout(student.getId(), checkoutTime);
    }

    private void doCheckout(UUID studentId, LocalDateTime checkoutTime) {

        if (checkoutTime == null) {
            checkoutTime = LocalDateTime.now();
        }
        Attendance attendance = attendanceRepository.findByStudent_IdAndDate(studentId, checkoutTime.toLocalDate());
        if (attendance == null || attendance.getCheckin() == null || attendance.getCheckout() != null) {
            return;
        }
        attendance.setCheckout(checkoutTime);
        attendanceRepository.save(attendance);
    }

    @Transactional
    public int checkoutClass(Long classroomId, LocalDate date) {

        LocalTime scheduled = timetableService.findCheckoutTime(classroomId, date).orElse(null);
        LocalDateTime checkoutTime = scheduled != null ? date.atTime(scheduled) : LocalDateTime.now();

        int checkedOut = 0;
        for (Student student : studentRepository.findByClassroom_Id(classroomId)) {
            Attendance attendance = attendanceRepository.findByStudent_IdAndDate(student.getId(), date);
            if (attendance != null && attendance.getCheckin() != null && attendance.getCheckout() == null) {
                attendance.setCheckout(checkoutTime);
                attendanceRepository.save(attendance);
                checkedOut++;
            }
        }
        return checkedOut;
    }

    public void check(String chipId) {
        System.out.println("Student " + chipId + " checking");
        // TODO
    }

    public record ScanResult(String status, String time) {
        public static final String CHECKED_IN = "CHECKED_IN";
        public static final String ALREADY_CHECKED_IN = "ALREADY_CHECKED_IN";
        public static final String UNKNOWN_CARD = "UNKNOWN_CARD";
        public static final String NOT_ASSIGNED = "NOT_ASSIGNED";

        public static ScanResult noTime(String status) {
            return new ScanResult(status, null);
        }

        public static ScanResult withTime(String status, LocalDateTime time) {
            return new ScanResult(status, time.format(DateTimeFormatter.ofPattern("HH:mm:ss")));
        }
    }

    public ScanResult handleScan(String chipId) {
        if (chipId == null || chipId.isBlank()) {
            return ScanResult.noTime(ScanResult.UNKNOWN_CARD);
        }

        Rfid_chip rfidChip = rfidRepository.findByChipId(chipId);
        if (rfidChip == null) {
            System.out.println("Scan: unknown card " + chipId);
            return ScanResult.noTime(ScanResult.UNKNOWN_CARD);
        }

        Student student = studentRepository.findByRfidChip_Id(rfidChip.getId());
        if (student == null) {
            System.out.println("Scan: card " + chipId + " not assigned to a student");
            return ScanResult.noTime(ScanResult.NOT_ASSIGNED);
        }

        LocalDateTime now = LocalDateTime.now();
        LocalDate today = now.toLocalDate();

        Attendance attendance = attendanceRepository.findByStudent_IdAndDate(student.getId(), today);
        if (attendance != null && attendance.getCheckin() != null) {
            System.out.println("Scan: " + student.getDisplayName() + " already checked in at " + attendance.getCheckin());
            return ScanResult.withTime(ScanResult.ALREADY_CHECKED_IN, attendance.getCheckin());
        }

        if (attendance == null) {
            attendance = new Attendance();
            attendance.setDate(today);
            attendance.setStudent(student);
            attendance.setStatus(Attendance_status.ANWESEND);
        }
        attendance.setCheckin(now);
        attendanceRepository.save(attendance);

        System.out.println("Scan: " + student.getDisplayName() + " checked in at " + now);
        return ScanResult.withTime(ScanResult.CHECKED_IN, now);
    }
}
