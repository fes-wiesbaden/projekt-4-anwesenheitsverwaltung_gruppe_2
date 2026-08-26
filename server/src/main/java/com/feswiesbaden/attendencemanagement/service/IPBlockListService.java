package com.feswiesbaden.attendencemanagement.service;

import org.springframework.stereotype.Service;

import com.feswiesbaden.attendencemanagement.entity.BlockedIP;
import com.feswiesbaden.attendencemanagement.repository.BlockedIPRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class IPBlockListService {

    private final BlockedIPRepository repository;

    public void blockIP(String ipAddress, String reason, String blockedBy){
        if (!repository.existsByIpAddress(ipAddress)) {
            repository.save(
                new BlockedIP(ipAddress, reason, blockedBy)
            );
        }
    }

    public void unblockIP(String ipAddress){
        repository.deleteByIpAddress(ipAddress);
    }

    public boolean isBlocked(String ipAddress) {
    return repository.existsByIpAddress(ipAddress);
}
}
