package com.feswiesbaden.attendencemanagement.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.feswiesbaden.attendencemanagement.entity.Classroom;

@Repository
public interface ClassroomRepository extends JpaRepository<Classroom, Long> {
    boolean existsByClassroomName(String name);

    @Query("""
                SELECT DISTINCT c.classroomName
                FROM Classroom c
                LEFT JOIN c.teachers t
                WHERE t.username = :username
                   OR c.id = (SELECT u.myClassroom.id FROM User u WHERE u.username = :username)
            """)
    List<String> findClassroomNamesByTeacherUsername(
            @Param("username") String username);

    

    Optional<Classroom> findByClassroomName(String classroomName);
}
