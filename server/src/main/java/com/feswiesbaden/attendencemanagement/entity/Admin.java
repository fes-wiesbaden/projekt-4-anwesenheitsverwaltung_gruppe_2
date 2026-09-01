package com.feswiesbaden.attendencemanagement.entity;

import jakarta.persistence.Entity;

@Entity
public class Admin extends User {

    public Admin() {
        super();
        setRole(Role.ADMIN);
    }
}
