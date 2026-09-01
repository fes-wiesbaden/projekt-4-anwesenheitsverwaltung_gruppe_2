package com.feswiesbaden.attendencemanagement.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

@Entity
@AllArgsConstructor
@NoArgsConstructor
@Setter
@Getter
@Table(name = "rfid_chips", uniqueConstraints = @UniqueConstraint(columnNames = "chipId"))
public class Rfid_chip {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    private String chipId;

    @JsonIgnore
    @OneToOne(mappedBy = "rfidChip")
    private Student student;

    public UUID getStudentId() {
        return student != null ? student.getId() : null;
    }
}
