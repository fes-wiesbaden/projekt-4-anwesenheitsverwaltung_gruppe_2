package com.feswiesbaden.attendencemanagement.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.feswiesbaden.attendencemanagement.entity.User;


@Repository
public interface UserRepository extends JpaRepository<User, UUID> {
    User findByUsername(String username);
    boolean existsByUsername(String username);
    @Query("SELECT c FROM User u JOIN u.classes c WHERE u.id = :userId")
    List<String> getAvailableClassrooms(@Param("userId") UUID userId);
}
