package com.feswiesbaden.attendencemanagement.controller;

import java.time.DayOfWeek;
import java.util.List;
import java.util.Locale;
import java.util.Optional;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

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
    public ResponseEntity<List<TimetableResponseDto>> GetTimetable(@PathVariable Long classroomId,
            Authentication authentication) {
        User user = userRepository.findByUsername(authentication.getName());
        if (user == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();

        Optional<Classroom> classroomOpt = classroomRepository.findById(classroomId);
        if (classroomOpt.isEmpty()) return ResponseEntity.notFound().build();

        if (!classroomService.hasAccess(user, classroomOpt.get())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        return ResponseEntity.ok(timetableService.getTimetable(classroomId).stream()
                .map(TimetableResponseDto::new)
                .toList());
    }

    @PutMapping("/{day}")
    public ResponseEntity<TimetableResponseDto> SetCheckoutTime(@PathVariable Long classroomId,
            @PathVariable String day,
            @RequestBody SetTimetableDto dto,
            Authentication authentication) {
        User user = userRepository.findByUsername(authentication.getName());
        if (user == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();

        DayOfWeek dayOfWeek = parseDay(day);
        if (dayOfWeek == null) return ResponseEntity.badRequest().build();
        if (dto == null || dto.checkoutTime == null) return ResponseEntity.badRequest().build();

        Optional<Classroom> classroomOpt = classroomRepository.findById(classroomId);
        if (classroomOpt.isEmpty()) return ResponseEntity.notFound().build();

        if (!classroomService.hasAccess(user, classroomOpt.get())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        Timetable saved = timetableService.setCheckoutTime(classroomOpt.get(), dayOfWeek, dto.checkoutTime);
        return ResponseEntity.ok(new TimetableResponseDto(saved));
    }

    @DeleteMapping("/{day}")
    public ResponseEntity<Void> DeleteEntry(@PathVariable Long classroomId,
            @PathVariable String day,
            Authentication authentication) {
        User user = userRepository.findByUsername(authentication.getName());
        if (user == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();

        DayOfWeek dayOfWeek = parseDay(day);
        if (dayOfWeek == null) return ResponseEntity.badRequest().build();

        Optional<Classroom> classroomOpt = classroomRepository.findById(classroomId);
        if (classroomOpt.isEmpty()) return ResponseEntity.notFound().build();

        if (!classroomService.hasAccess(user, classroomOpt.get())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        timetableService.deleteEntry(classroomId, dayOfWeek);
        return ResponseEntity.noContent().build();
    }

    private DayOfWeek parseDay(String day) {
        try {
            return DayOfWeek.valueOf(day.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException e) {
            return null;
        }
    }
}
