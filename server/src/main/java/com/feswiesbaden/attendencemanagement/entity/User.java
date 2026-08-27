package com.feswiesbaden.attendencemanagement.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "users")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String displayName;

    @Column(unique = true)
    private String username;

    private String password;

    @Column(unique = true)
    private String chipId;

    @Enumerated(EnumType.STRING)
    private Role role;

}
