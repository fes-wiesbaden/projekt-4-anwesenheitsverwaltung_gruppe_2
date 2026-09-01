package com.feswiesbaden.attendencemanagement.entity;

import java.util.List;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@AllArgsConstructor
@NoArgsConstructor
@Setter
@Getter
@Table(name = "classrooms")
public class Classroom {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String classroomName;

    @ManyToOne
    @JoinColumn(name = "room_id")
    private Room room;

    @OneToMany
    private List<Student> students;

    @OneToMany(mappedBy = "classroom")
    private List<Attendance> attendances;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;

}
