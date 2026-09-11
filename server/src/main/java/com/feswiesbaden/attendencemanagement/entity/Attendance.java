package com.feswiesbaden.attendencemanagement.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Date;

@Entity
@AllArgsConstructor
@NoArgsConstructor
@Setter
@Getter
@Table(name = "attendances")
public class Attendance {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private LocalDate date;

    private LocalDateTime checkin;

    private LocalDateTime checkout;

    private Attendance_status status;

    private String description;

    @ManyToOne
    @JoinColumn(name = "student_id")
    private Student student;

}
