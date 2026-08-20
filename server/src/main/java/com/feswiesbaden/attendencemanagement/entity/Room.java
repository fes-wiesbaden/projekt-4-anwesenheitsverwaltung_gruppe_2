package com.feswiesbaden.attendencemanagement.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

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

}
