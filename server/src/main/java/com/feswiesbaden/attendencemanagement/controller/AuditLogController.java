package com.feswiesbaden.attendencemanagement.controller;

import com.feswiesbaden.attendencemanagement.entity.Role;
import com.feswiesbaden.attendencemanagement.entity.SystemAuditLog;
import com.feswiesbaden.attendencemanagement.repository.SystemAuditLogRepository;
import com.feswiesbaden.attendencemanagement.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/audit-logs")
@RequiredArgsConstructor
public class AuditLogController {
    private final SystemAuditLogRepository auditRepository;
    private final UserRepository userRepository;

    private boolean isAdmin(String username) {
        var user = userRepository.findByUsername(username);
        return user != null && user.getRole() == Role.ADMIN;
    }

    @GetMapping
    public ResponseEntity<List<SystemAuditLog>> all(org.springframework.security.core.Authentication auth) {
        if (auth == null || !isAdmin(auth.getName())) return ResponseEntity.status(403).build();
        return ResponseEntity.ok(auditRepository.findAllByOrderByCreatedAtDesc());
    }

    @GetMapping("/{id}")
    public ResponseEntity<SystemAuditLog> byId(@PathVariable Long id,
            org.springframework.security.core.Authentication auth) {
        if (auth == null || !isAdmin(auth.getName())) return ResponseEntity.status(403).build();
        return auditRepository.findById(id).map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/users/{userId}")
    public ResponseEntity<List<SystemAuditLog>> byUser(@PathVariable UUID userId,
            org.springframework.security.core.Authentication auth) {
        if (auth == null || !isAdmin(auth.getName())) return ResponseEntity.status(403).build();
        var user = userRepository.findById(userId).orElse(null);
        if (user == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(auditRepository.findByActorUsernameOrderByCreatedAtDesc(user.getUsername()));
    }
}
