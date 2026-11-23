package com.feswiesbaden.attendencemanagement.service;

import com.feswiesbaden.attendencemanagement.entity.SystemAuditLog;
import com.feswiesbaden.attendencemanagement.repository.SystemAuditLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class SystemAuditLogService {
    private final SystemAuditLogRepository repository;

    @Transactional
    public void record(String actor, String action, String entityType, String entityId,
                       String description, String beforeValue, String afterValue) {
        SystemAuditLog log = new SystemAuditLog();
        log.setActorUsername(actor == null || actor.isBlank() ? "SYSTEM" : actor);
        log.setActionType(action);
        log.setEntityType(entityType);
        log.setEntityId(entityId);
        log.setDescription(description);
        log.setBeforeValue(beforeValue);
        log.setAfterValue(afterValue);
        repository.save(log);
    }
}
