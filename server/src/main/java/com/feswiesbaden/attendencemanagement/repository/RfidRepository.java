package com.feswiesbaden.attendencemanagement.repository;

import com.feswiesbaden.attendencemanagement.entity.Rfid_chip;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface RfidRepository extends JpaRepository<Rfid_chip, UUID> {
    Rfid_chip findByChipId(String chipId);
    boolean existsByChipId(String chipId);
}
