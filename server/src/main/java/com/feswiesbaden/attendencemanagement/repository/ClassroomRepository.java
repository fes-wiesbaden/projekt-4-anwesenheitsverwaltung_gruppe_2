package com.feswiesbaden.attendencemanagement.repository;

import com.feswiesbaden.attendencemanagement.entity.Classroom;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface ClassroomRepository extends JpaRepository<Classroom, Long> {
    boolean existsByClassroomName(String name);

    @Query("""
                SELECT c.classroomname
                FROM Classroom c
                JOIN c.teachers t
                WHERE t.username = :username
            """)
    List<String> findClassroomNamesByTeacherUsername(
            @Param("username") String username);

    Optional<Classroom> findByClassroomName(String classroomName);
}
