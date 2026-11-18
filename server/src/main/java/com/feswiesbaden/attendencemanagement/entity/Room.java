package com.feswiesbaden.attendencemanagement.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
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

    @JsonIgnore
    @OneToMany(mappedBy = "room")
    private List<Classroom> classrooms;
}
