package com.feswiesbaden.attendencemanagement.controller;

import java.time.LocalDate;
import java.time.LocalDateTime;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.feswiesbaden.attendencemanagement.dto.requests.CheckinDto;
import com.feswiesbaden.attendencemanagement.dto.response.CheckinResponseDto;
import com.feswiesbaden.attendencemanagement.entity.Attendance;
import com.feswiesbaden.attendencemanagement.entity.Attendance_status;
import com.feswiesbaden.attendencemanagement.entity.Student;
import com.feswiesbaden.attendencemanagement.repository.AttendanceRepository;
import com.feswiesbaden.attendencemanagement.repository.StudentRepository;

@RestController
@RequestMapping("/api/attendance")
public class AttendanceController {

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private AttendanceRepository attendanceRepository;


    @PostMapping("/checkin")
    public ResponseEntity<CheckinResponseDto> checkin(@RequestBody CheckinDto dto){
        if (dto.username == null || dto.username.isBlank()) return ResponseEntity.badRequest().build();
        if (!studentRepository.existsByUsername(dto.username)) return ResponseEntity.notFound().build();

        LocalDateTime checkinTime = LocalDateTime.now();
       LocalDate date = checkinTime.toLocalDate();

        Student student = studentRepository.findByUsername(dto.username);

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
