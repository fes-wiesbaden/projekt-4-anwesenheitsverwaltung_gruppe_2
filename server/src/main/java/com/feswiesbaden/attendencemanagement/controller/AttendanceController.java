package com.feswiesbaden.attendencemanagement.controller;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import com.feswiesbaden.attendencemanagement.dto.response.CheckinResponseDto;
import com.feswiesbaden.attendencemanagement.entity.Attendance;
import com.feswiesbaden.attendencemanagement.entity.Classroom;
import com.feswiesbaden.attendencemanagement.entity.Student;
import com.feswiesbaden.attendencemanagement.entity.User;
import com.feswiesbaden.attendencemanagement.repository.AttendanceRepository;
import com.feswiesbaden.attendencemanagement.repository.ClassroomRepository;
import com.feswiesbaden.attendencemanagement.repository.StudentRepository;
import com.feswiesbaden.attendencemanagement.repository.UserRepository;
import com.feswiesbaden.attendencemanagement.service.AttendanceService;
import com.feswiesbaden.attendencemanagement.service.ClassroomService;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/attendance")
@RequiredArgsConstructor
public class AttendanceController {

    private final AttendanceService attendanceService;

    private final StudentRepository studentRepository;

    private final AttendanceRepository attendanceRepository;

    private final ClassroomRepository classroomRepository;

    private final UserRepository userRepository;

    private final ClassroomService classroomService;

    @PostMapping("/checkin/{studentId}")
    public ResponseEntity<CheckinResponseDto> Checkin(@PathVariable UUID studentId){
        if (!studentRepository.existsById(studentId)) return ResponseEntity.notFound().build();

        // check in
        attendanceService.checkin(studentId);
        return ResponseEntity.ok(new CheckinResponseDto());
    }

    @PostMapping("/student/{id}")
    public ResponseEntity<List<Attendance>> GetAllByStudentId(@PathVariable UUID id){
        // check if the student exist
        if (!studentRepository.existsById(id)) return ResponseEntity.badRequest().build();

        // get student and return attendance back
        Student student = studentRepository.findById(id).orElseThrow();
        return ResponseEntity.ok(student.getAttendances());
    }

    @PostMapping("/class/{classroomId}/checkout")
    public ResponseEntity<String> CheckoutClass(@PathVariable Long classroomId,
            Authentication authentication,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        User user = userRepository.findByUsername(authentication.getName());
        if (user == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();

        Optional<Classroom> classroomOpt = classroomRepository.findById(classroomId);
        if (classroomOpt.isEmpty()) return ResponseEntity.notFound().build();

        if (!classroomService.hasAccess(user, classroomOpt.get())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        LocalDate targetDate = date != null ? date : LocalDate.now();
        int checkedOut = attendanceService.checkoutClass(classroomId, targetDate);
        return ResponseEntity.ok("Checked out " + checkedOut + " students for " + targetDate);
    }

    @PutMapping ("/edit/{attendanceId}")
    public ResponseEntity<Attendance> EditAttendance(@PathVariable Long attendanceId, @RequestBody Attendance updatedAttendance) {
        Optional<Attendance> optionalAttendance = attendanceRepository.findById(attendanceId);
        if (optionalAttendance.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Attendance existingAttendance = optionalAttendance.get();
        existingAttendance.setCheckin(updatedAttendance.getCheckin());
        existingAttendance.setCheckout(updatedAttendance.getCheckout());
        existingAttendance.setStatus(updatedAttendance.getStatus());
        existingAttendance.setReason(updatedAttendance.getReason());

        Attendance savedAttendance = attendanceRepository.save(existingAttendance);
        return ResponseEntity.ok(savedAttendance);
    }
}
