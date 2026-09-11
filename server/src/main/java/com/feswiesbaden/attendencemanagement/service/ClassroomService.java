package com.feswiesbaden.attendencemanagement.service;

import java.time.LocalDate;
import java.util.List;

import org.springframework.stereotype.Service;

import com.feswiesbaden.attendencemanagement.entity.Attendance;
import com.feswiesbaden.attendencemanagement.entity.Classroom;
import com.feswiesbaden.attendencemanagement.entity.Role;
import com.feswiesbaden.attendencemanagement.entity.User;
import com.feswiesbaden.attendencemanagement.exceptions.ClassroomNotFoundException;
import com.feswiesbaden.attendencemanagement.repository.AttendanceRepository;
import com.feswiesbaden.attendencemanagement.repository.ClassroomRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ClassroomService {
    private final ClassroomRepository classroomRepository;
    private final AttendanceRepository attendanceRepository;

    public Classroom findById(Long id) {
        return classroomRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Classroom nicht gefunden"));
    }

    public List<String> getAvailableClassrooms(String username) {
        return classroomRepository.findClassroomNamesByTeacherUsername(username);
    }

    public boolean isOwner(User user, Classroom classroom) {
        return user.getMyClassroom() != null
                && user.getMyClassroom().getId().equals(classroom.getId());
    }

    public boolean hasAccess(User user, Classroom classroom) {
        return user.getRole() == Role.ADMIN || isOwner(user, classroom)
                || classroom.getTeachers().stream().anyMatch(t -> t.getId().equals(user.getId()));
    }

    public List<Attendance> getAttendances(String className, LocalDate date) {
        Classroom classroom = classroomRepository.findByClassroomName(className)
                .orElseThrow(() -> new ClassroomNotFoundException(className));

        return attendanceRepository.findByStudent_ClassroomAndCheckinBetween(
                classroom, date.atStartOfDay(), date.atTime(23, 59, 59));
    }
}
