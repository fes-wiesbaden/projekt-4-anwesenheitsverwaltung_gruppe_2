package com.feswiesbaden.attendencemanagement.entity;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import static com.feswiesbaden.attendencemanagement.entity.Role.USER;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
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

    private LocalDate createdAt;

    @Enumerated(EnumType.STRING)
    private Role role = USER;

    @Column(nullable = true)
    @OneToOne
    private Classroom myClassroom; //Klassen-Lehrer

    @ManyToMany
    private List<Classroom> classes;//Alle Klassen die unterrichtet werden.

}
