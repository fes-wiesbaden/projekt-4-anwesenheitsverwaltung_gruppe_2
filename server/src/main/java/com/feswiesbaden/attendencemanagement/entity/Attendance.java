package com.feswiesbaden.attendencemanagement.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@AllArgsConstructor
@NoArgsConstructor
@Setter
@Getter
@Table(name = "attendances", uniqueConstraints = @UniqueConstraint(columnNames = {"student_id", "date"}))
public class Attendance {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private LocalDate date;

    private LocalDateTime checkin;

    private LocalDateTime checkout;

    private Attendance_status status;

    private String reason;

    @ManyToOne
    @JoinColumn(name = "student_id")
    private Student student;

}
