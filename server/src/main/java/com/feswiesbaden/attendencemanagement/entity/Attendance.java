package com.feswiesbaden.attendencemanagement.entity;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "attendances", uniqueConstraints =
        @UniqueConstraint(name = "uk_attendance_student_session", columnNames = {"student_id", "session_id"}))
public class Attendance {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private LocalDate date;

    private LocalDateTime checkin;

    private LocalDateTime checkout;

    // Kept as the existing ordinal enum mapping for compatibility with existing rows.
    private Attendance_status status;

    private String reason;

    @Column(name = "checkout_reason", length = 200)
    private String checkoutReason;

    @Column(name = "checked_out_by", length = 120)
    private String checkedOutBy;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id")
    private AttendanceSession session;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id")
    private Student student;

    @JsonIgnore
    @OneToMany(mappedBy = "attendance", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<AttendanceAuditEvent> auditEvents = new ArrayList<>();
}
