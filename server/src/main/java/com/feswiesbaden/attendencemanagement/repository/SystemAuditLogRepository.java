package com.feswiesbaden.attendencemanagement.repository;

import com.feswiesbaden.attendencemanagement.entity.SystemAuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface SystemAuditLogRepository extends JpaRepository<SystemAuditLog, Long> {
    List<SystemAuditLog> findAllByOrderByCreatedAtDesc();
    List<SystemAuditLog> findByActorUsernameOrderByCreatedAtDesc(String actorUsername);
}
