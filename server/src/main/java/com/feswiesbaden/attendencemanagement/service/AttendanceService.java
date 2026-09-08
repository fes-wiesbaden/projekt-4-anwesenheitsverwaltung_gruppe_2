package com.feswiesbaden.attendencemanagement.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.feswiesbaden.attendencemanagement.repository.RfidRepository;

@Service
public class AttendanceService {

    @Autowired
    private RfidRepository rfidRepository;


    void checkin(String chipId) {
        if (chipId.isEmpty()) return;
        if (!rfidRepository.existsByChipId(chipId)) return;

        System.out.println("Student " + chipId + " checking out");
        // TODO
    }

    void checkout(String chipId) {
        System.out.println("Student " + chipId + " checking out");
        // TODO
    }

    void check(String chipId) {
        System.out.println("Student " + chipId + " checking");
        // TODO
    }
}
