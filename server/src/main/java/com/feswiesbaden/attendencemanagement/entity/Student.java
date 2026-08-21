package com.feswiesbaden.attendencemanagement.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Entity
@AllArgsConstructor
@NoArgsConstructor
@Setter
@Getter
@Table(name = "students")
public class Student {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String displayName;

    private String username;

    @ManyToOne
    @JoinColumn(name = "classroom_id")
    private Classroom classroom;

    @OneToOne
    @JoinColumn(name = "rfid_chip_id")
    private Rfid_chip rfidChip;

    @OneToMany(mappedBy = "student", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Attendance> attendances;
}
