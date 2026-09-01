package com.feswiesbaden.attendencemanagement.service;
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
}
