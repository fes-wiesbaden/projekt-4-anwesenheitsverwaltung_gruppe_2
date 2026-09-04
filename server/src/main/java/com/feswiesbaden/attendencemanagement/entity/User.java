package com.feswiesbaden.attendencemanagement.entity;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import static com.feswiesbaden.attendencemanagement.entity.Role.USER;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "users")
@Getter @Setter
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    private String displayName;

    @Column(unique = true, nullable = false)
    private String username;

    @Column(nullable=false)
    private String password;

    private boolean firstLogin;

    private LocalDate createdAt;

    @Enumerated(EnumType.STRING)
    private Role role = USER;

    @OneToOne
    @JoinColumn()
    private Classroom myClassroom; //Klassen-Lehrer

    @ManyToMany(mappedBy = "classes")
    private List<Classroom> classes;//Alle Klassen die unterrichtet werden.

}
