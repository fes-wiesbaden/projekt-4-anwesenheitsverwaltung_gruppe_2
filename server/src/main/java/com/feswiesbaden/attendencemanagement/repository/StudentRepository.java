package com.feswiesbaden.attendencemanagement.repository;

import com.feswiesbaden.attendencemanagement.entity.Student;
import org.jspecify.annotations.NonNull;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface StudentRepository extends JpaRepository<Student, UUID> {
    Student findByUsername(String username);

    boolean existsByUsername(String username);

    boolean existsById(@NonNull UUID id);

    Optional<Student> findByRfidChipId(UUID rfidChipId);
    List<Student> findByClassroom_Id(Long id);
    Student findByRfidChip_Id(UUID rfidChip_id);

    @Query("""
                SELECT DISTINCT s
                FROM Student s
                WHERE s.classroom.id IN (
                    SELECT c.id FROM Classroom c JOIN c.teachers t WHERE t.username = :username
                )
                OR s.classroom.id = (SELECT u.myClassroom.id FROM User u WHERE u.username = :username)
            """)
    List<Student> findStudentsByTeacherUsername(@Param("username") String username);
}
