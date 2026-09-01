package com.feswiesbaden.attendencemanagement.controller;

import aj.org.objectweb.asm.ClassReader;
import com.feswiesbaden.attendencemanagement.dto.requests.CheckinDto;
import com.feswiesbaden.attendencemanagement.dto.response.CheckinResponseDto;
import com.feswiesbaden.attendencemanagement.entity.Attendance;
import com.feswiesbaden.attendencemanagement.entity.Attendance_status;
import com.feswiesbaden.attendencemanagement.entity.Classroom;
import com.feswiesbaden.attendencemanagement.entity.Student;
import com.feswiesbaden.attendencemanagement.repository.AttendanceRepository;
import com.feswiesbaden.attendencemanagement.repository.ClassroomRepository;
import com.feswiesbaden.attendencemanagement.repository.StudentRepository;
import com.feswiesbaden.attendencemanagement.service.AttendanceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.sql.Date;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/attendance")
public class AttendanceController {

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private AttendanceRepository attendanceRepository;

    @Autowired
    private AttendanceService attendanceService;

    @Autowired
    private ClassroomRepository classroomRepository;

    @PostMapping("/checkin")
    public ResponseEntity<CheckinResponseDto> Checkin(@RequestBody CheckinDto dto){
        if (dto.username == null || dto.username.isBlank()) return ResponseEntity.badRequest().build();
        if (!studentRepository.existsByUsername(dto.username)) return ResponseEntity.notFound().build();

        LocalDateTime checkinTime = LocalDateTime.now();
        Date date = Date.valueOf(checkinTime.toLocalDate());

        Student student = studentRepository.findByUsername(dto.username);

        List<Classroom> classroom = classroomRepository.findAll();

        Attendance attendance = new Attendance();
        attendance.setCheckin(checkinTime);
        attendance.setDate(date);
        attendance.setStatus(Attendance_status.ANWESEND);
        attendance.setStudent(student);

        attendanceRepository.save(attendance);
        System.out.println("Attendance Saved");

        return ResponseEntity.ok(new CheckinResponseDto());
    }
}
