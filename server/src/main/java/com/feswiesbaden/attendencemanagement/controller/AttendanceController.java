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

import com.feswiesbaden.attendencemanagement.entity.Attendance;
import com.feswiesbaden.attendencemanagement.entity.AttendanceAuditEvent;
import com.feswiesbaden.attendencemanagement.entity.AttendanceSession;
import com.feswiesbaden.attendencemanagement.entity.Classroom;
import com.feswiesbaden.attendencemanagement.entity.Student;
import com.feswiesbaden.attendencemanagement.entity.User;
import com.feswiesbaden.attendencemanagement.dto.response.AttendanceSessionResponseDto;
import com.feswiesbaden.attendencemanagement.dto.response.AttendanceAuditResponseDto;
import com.feswiesbaden.attendencemanagement.dto.response.AttendanceRecordResponseDto;
import com.feswiesbaden.attendencemanagement.repository.AttendanceAuditRepository;
import com.feswiesbaden.attendencemanagement.repository.AttendanceRepository;
import com.feswiesbaden.attendencemanagement.repository.AttendanceSessionRepository;
import com.feswiesbaden.attendencemanagement.repository.ClassroomRepository;
import com.feswiesbaden.attendencemanagement.repository.StudentRepository;
import com.feswiesbaden.attendencemanagement.repository.UserRepository;
import com.feswiesbaden.attendencemanagement.service.AttendanceService;
import com.feswiesbaden.attendencemanagement.service.AttendanceSessionService;
import com.feswiesbaden.attendencemanagement.service.ClassroomService;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/attendance")
@RequiredArgsConstructor
public class AttendanceController {
    private final AttendanceService attendanceService;
    private final AttendanceSessionService sessionService;
    private final StudentRepository studentRepository;
    private final AttendanceRepository attendanceRepository;
    private final AttendanceSessionRepository sessionRepository;
    private final AttendanceAuditRepository auditRepository;
    private final ClassroomRepository classroomRepository;
    private final UserRepository userRepository;
    private final ClassroomService classroomService;

    @PostMapping("/checkin/{studentId}")
    public ResponseEntity<String> checkin(@PathVariable UUID studentId, Authentication authentication) {
        if (!studentRepository.existsById(studentId)) return ResponseEntity.notFound().build();
        if (authentication == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        try {
            attendanceService.checkin(studentId, authentication.getName());
            return ResponseEntity.ok("Student checked in.");
        } catch (IllegalStateException ex) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(ex.getMessage());
        }
    }

    @RequestMapping(path = "/student/{id}", method = {RequestMethod.GET, RequestMethod.POST})
    public ResponseEntity<List<AttendanceRecordResponseDto>> getAllByStudentId(@PathVariable UUID id, Authentication authentication) {
        User user = currentUser(authentication);
        if (user == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        Student student = studentRepository.findById(id).orElse(null);
        if (student == null) return ResponseEntity.notFound().build();
        if (user.getRole() != com.feswiesbaden.attendencemanagement.entity.Role.ADMIN
                && (student.getClassroom() == null || !classroomService.hasAccess(user, student.getClassroom()))) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        return ResponseEntity.ok(attendanceRepository.findAllByStudent_Id(id).stream()
                .map(AttendanceRecordResponseDto::new).toList());
    }

    @PostMapping("/student/{studentId}/checkout")
    public ResponseEntity<String> checkoutStudent(@PathVariable UUID studentId, Authentication authentication,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(required = false) String reason) {
        User user = currentUser(authentication);
        if (user == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        Student student = studentRepository.findById(studentId).orElse(null);
        if (student == null) return ResponseEntity.notFound().build();
        if (student.getClassroom() == null || !classroomService.hasAccess(user, student.getClassroom())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        LocalDate targetDate = date != null ? date : sessionService.today();
        boolean success = sessionService.releaseStudent(studentId, targetDate, user.getUsername(), reason);
        if (!success) return ResponseEntity.status(HttpStatus.CONFLICT)
                .body("No open attendance in an active timetable session for this student.");
        return ResponseEntity.ok("Student released and checked out.");
    }

    @PostMapping("/class/{classroomId}/checkout")
    public ResponseEntity<String> checkoutClass(@PathVariable Long classroomId, Authentication authentication,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(required = false) String reason) {
        User user = currentUser(authentication);
        if (user == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        Classroom classroom = classroomRepository.findById(classroomId).orElse(null);
        if (classroom == null) return ResponseEntity.notFound().build();
        if (!classroomService.hasAccess(user, classroom)) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        LocalDate targetDate = date != null ? date : sessionService.today();
        int checkedOut = sessionService.releaseClass(classroomId, targetDate, user.getUsername(), reason);
        if (checkedOut < 0) return ResponseEntity.status(HttpStatus.CONFLICT)
                .body("There is no active timetable session for this class.");
        return ResponseEntity.ok("Class released. Checked out " + checkedOut + " students.");
    }

    @GetMapping("/class/{classroomId}/session")
    public ResponseEntity<?> getSession(@PathVariable Long classroomId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            Authentication authentication) {
        User user = currentUser(authentication);
        if (user == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        Classroom classroom = classroomRepository.findById(classroomId).orElse(null);
        if (classroom == null) return ResponseEntity.notFound().build();
        if (!classroomService.hasAccess(user, classroom)) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        AttendanceSession session = sessionService.findSession(classroomId, date != null ? date : sessionService.today()).orElse(null);
        if (session == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(new AttendanceSessionResponseDto(session));
    }


    @GetMapping("/class/{classroomId}/session/attendance")
    public ResponseEntity<List<AttendanceRecordResponseDto>> getSessionAttendance(@PathVariable Long classroomId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            Authentication authentication) {
        User user = currentUser(authentication);
        if (user == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        Classroom classroom = classroomRepository.findById(classroomId).orElse(null);
        if (classroom == null) return ResponseEntity.notFound().build();
        if (!classroomService.hasAccess(user, classroom)) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        AttendanceSession session = sessionService.findSession(classroomId, date != null ? date : sessionService.today()).orElse(null);
        if (session == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(attendanceRepository.findBySession_Id(session.getId()).stream()
                .map(AttendanceRecordResponseDto::new).toList());
    }

    @GetMapping("/session/{sessionId}/audit")
    public ResponseEntity<List<AttendanceAuditResponseDto>> getSessionAudit(@PathVariable Long sessionId,
                                                                        Authentication authentication) {
        User user = currentUser(authentication);
        if (user == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        AttendanceSession session = sessionRepository.findDetailedById(sessionId).orElse(null);
        if (session == null) return ResponseEntity.notFound().build();
        if (!classroomService.hasAccess(user, session.getTimetable().getClassroom())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        return ResponseEntity.ok(auditRepository.findDetailedBySessionId(sessionId).stream()
                .map(AttendanceAuditResponseDto::new).toList());
    }

    private User currentUser(Authentication authentication) {
        return authentication == null ? null : userRepository.findByUsername(authentication.getName());
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
        existingAttendance.setDescription(updatedAttendance.getDescription());

        Attendance savedAttendance = attendanceRepository.save(existingAttendance);
        return ResponseEntity.ok(savedAttendance);
    }
}
