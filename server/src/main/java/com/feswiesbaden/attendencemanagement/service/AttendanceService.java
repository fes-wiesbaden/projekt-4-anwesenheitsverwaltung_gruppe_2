package com.feswiesbaden.attendencemanagement.service;

import com.feswiesbaden.attendencemanagement.repository.AttendanceRepository;
import com.feswiesbaden.attendencemanagement.repository.RfidRepository;
import com.feswiesbaden.attendencemanagement.repository.StudentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class AttendanceService {

    @Autowired
    private RfidRepository rfidRepository;

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private AttendanceRepository attendanceRepository;

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
