package com.feswiesbaden.attendencemanagement.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "attendance_audit_events")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AttendanceAuditEvent {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "attendance_id", nullable = false)
    private Attendance attendance;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "session_id", nullable = false)
    private AttendanceSession session;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private AttendanceAuditEventType eventType;

    @Column(name = "event_at", nullable = false)
    private LocalDateTime eventAt;

    @Column(name = "actor_username", nullable = false, length = 120)
    private String actorUsername;

    @Column(length = 500)
    private String details;
}
