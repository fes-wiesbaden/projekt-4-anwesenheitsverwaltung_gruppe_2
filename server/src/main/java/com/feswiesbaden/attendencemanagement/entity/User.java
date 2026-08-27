package com.feswiesbaden.attendencemanagement.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.util.UUID;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "users")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    private String displayName;

    @Column(unique = true)
    private String username;

    private String password;

    private LocalDate createdAt;

    @Enumerated(EnumType.STRING)
    private Role role;

}
