package com.feswiesbaden.attendencemanagement.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Entity
@Setter
@Getter
@Table(name = "rooms")
public class Room {
    @Id
    @GeneratedValue
    private Long id;

    private String roomName;

    private String roomNumber;

    @OneToMany(mappedBy = "room")
    private List<Classroom> classrooms;
}
