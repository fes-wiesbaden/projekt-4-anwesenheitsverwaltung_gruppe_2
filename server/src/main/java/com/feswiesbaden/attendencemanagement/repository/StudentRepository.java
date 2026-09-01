package com.feswiesbaden.attendencemanagement.repository;

import com.feswiesbaden.attendencemanagement.entity.Student;
import org.jspecify.annotations.NonNull;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface StudentRepository extends JpaRepository<Student, UUID > {
    Student findByUsername(String username);
    boolean existsByUsername(String username);
    boolean existsById(@NonNull UUID id);
    Optional<Student> findByRfidChipId(UUID rfidChipId);
}
