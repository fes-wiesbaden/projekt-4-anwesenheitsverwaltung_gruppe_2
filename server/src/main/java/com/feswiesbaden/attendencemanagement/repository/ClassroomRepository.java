package com.feswiesbaden.attendencemanagement.repository;

import com.feswiesbaden.attendencemanagement.entity.BlockedIP;
import com.feswiesbaden.attendencemanagement.entity.Classroom;
import com.feswiesbaden.attendencemanagement.entity.Student;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

import java.util.List;
import java.util.UUID;

import java.util.Optional;
@Repository
public interface ClassroomRepository extends JpaRepository<Classroom, Long> {
    boolean existsByClassroomName(String name);
}
