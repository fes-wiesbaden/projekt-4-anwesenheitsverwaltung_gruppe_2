package com.feswiesbaden.attendencemanagement.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "attendance_settings")
@Getter
@Setter
@NoArgsConstructor
public class AttendanceSettings {
    /** A single global policy row is kept at id=1. */
    @Id
    private Integer id = 1;

    @Column(name = "late_grace_minutes", nullable = false)
    private int lateGraceMinutes = 5;
}
