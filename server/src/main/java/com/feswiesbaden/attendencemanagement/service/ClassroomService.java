package com.feswiesbaden.attendencemanagement.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.feswiesbaden.attendencemanagement.entity.Classroom;
import lombok.RequiredArgsConstructor;
import com.feswiesbaden.attendencemanagement.repository.ClassroomRepository;

@Service
@RequiredArgsConstructor
public class ClassroomService {
    private final ClassroomRepository classroomRepository;

    public Classroom findById(Long id) {
        return classroomRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Classroom nicht gefunden"));
    }

    public List<String> getAvailableClassrooms(String username) {
        return classroomRepository.findClassroomNamesByTeacherUsername(username);
    }
}
