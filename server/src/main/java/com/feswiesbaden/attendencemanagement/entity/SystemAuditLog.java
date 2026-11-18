package com.feswiesbaden.attendencemanagement.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDateTime;

@Entity
@Table(name = "system_audit_logs", indexes = {
    @Index(name = "idx_system_audit_created", columnList = "created_at"),
    @Index(name = "idx_system_audit_actor", columnList = "actor_username")
})
@Getter @Setter @NoArgsConstructor
public class SystemAuditLog {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name="actor_username", nullable=false, length=120)
    private String actorUsername;
    @Column(name="action_type", nullable=false, length=80)
    private String actionType;
    @Column(name="entity_type", nullable=false, length=80)
    private String entityType;
    @Column(name="entity_id", length=120)
    private String entityId;
    @Column(length=1000)
    private String description;
    @Column(name="before_value", columnDefinition="text")
    private String beforeValue;
    @Column(name="after_value", columnDefinition="text")
    private String afterValue;
    @Column(name="created_at", nullable=false)
    private LocalDateTime createdAt;
    @PrePersist void onCreate() { if (createdAt == null) createdAt = LocalDateTime.now(); }
}
