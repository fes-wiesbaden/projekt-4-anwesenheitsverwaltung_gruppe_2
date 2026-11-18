package com.feswiesbaden.attendencemanagement.controller;

import java.time.DayOfWeek;
import java.util.List;
import java.util.Locale;
import java.util.Optional;

import com.feswiesbaden.attendencemanagement.entity.Role;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import com.feswiesbaden.attendencemanagement.dto.requests.SetTimetableDto;
import com.feswiesbaden.attendencemanagement.dto.response.TimetableResponseDto;
import com.feswiesbaden.attendencemanagement.entity.Classroom;
import com.feswiesbaden.attendencemanagement.entity.Timetable;
import com.feswiesbaden.attendencemanagement.entity.User;
import com.feswiesbaden.attendencemanagement.repository.ClassroomRepository;
import com.feswiesbaden.attendencemanagement.repository.UserRepository;
import com.feswiesbaden.attendencemanagement.service.ClassroomService;
import com.feswiesbaden.attendencemanagement.service.TimetableService;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/classroom/{classroomId}/timetable")
@RequiredArgsConstructor
public class TimetableController {
    private final TimetableService timetableService;
    private final ClassroomRepository classroomRepository;
    private final UserRepository userRepository;
    private final ClassroomService classroomService;

    @GetMapping
    public ResponseEntity<List<TimetableResponseDto>> getTimetable(@PathVariable Long classroomId,
                                                                    Authentication authentication) {
        User user = userRepository.findByUsername(authentication.getName());
        if (user == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        Optional<Classroom> classroom = classroomRepository.findById(classroomId);
        if (classroom.isEmpty()) return ResponseEntity.notFound().build();
        if (!classroomService.hasAccess(user, classroom.get())) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        return ResponseEntity.ok(timetableService.getTimetable(classroomId).stream().map(TimetableResponseDto::new).toList());
    }

    @PutMapping("/{day}")
    public ResponseEntity<?> setTimetable(@PathVariable Long classroomId, @PathVariable String day,
                                           @Valid @RequestBody SetTimetableDto dto, Authentication authentication) {
        User user = userRepository.findByUsername(authentication.getName());
        if (user == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        if (user.getRole() != Role.ADMIN) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        DayOfWeek dayOfWeek = parseDay(day);
        if (dayOfWeek == null || dto == null || dto.startTime == null || dto.checkoutTime == null
                || !dto.checkoutTime.isAfter(dto.startTime)) {
            return ResponseEntity.badRequest().body("Provide startTime and checkoutTime; checkoutTime must be later.");
        }
        Optional<Classroom> classroom = classroomRepository.findById(classroomId);
        if (classroom.isEmpty()) return ResponseEntity.notFound().build();
        Timetable saved = timetableService.setTimetable(classroom.get(), dayOfWeek, dto.startTime, dto.checkoutTime, user.getUsername());
        return ResponseEntity.ok(new TimetableResponseDto(saved));
    }

    @DeleteMapping("/{day}")
    public ResponseEntity<Void> deleteEntry(@PathVariable Long classroomId, @PathVariable String day,
                                              Authentication authentication) {
        User user = userRepository.findByUsername(authentication.getName());
        if (user == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        if (user.getRole() != Role.ADMIN) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        DayOfWeek dayOfWeek = parseDay(day);
        if (dayOfWeek == null) return ResponseEntity.badRequest().build();
        if (!classroomRepository.existsById(classroomId)) return ResponseEntity.notFound().build();
        try {
            timetableService.deleteEntry(classroomId, dayOfWeek, user.getUsername());
            return ResponseEntity.noContent().build();
        } catch (IllegalStateException ex) {
            return ResponseEntity.status(HttpStatus.CONFLICT).build();
        }
    }

    private DayOfWeek parseDay(String day) {
        try { return DayOfWeek.valueOf(day.trim().toUpperCase(Locale.ROOT)); }
        catch (RuntimeException ex) { return null; }
    }
}
