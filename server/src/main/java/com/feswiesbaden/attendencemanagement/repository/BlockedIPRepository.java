package com.feswiesbaden.attendencemanagement.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.feswiesbaden.attendencemanagement.entity.BlockedIP;


public interface BlockedIPRepository extends JpaRepository<BlockedIP, String> {
    boolean existsByIpAddress(String ipAddress);
    Optional<BlockedIP> findByIpAddress(String ipAddress);
    void deleteByIpAddress(String ipAddress);
}
