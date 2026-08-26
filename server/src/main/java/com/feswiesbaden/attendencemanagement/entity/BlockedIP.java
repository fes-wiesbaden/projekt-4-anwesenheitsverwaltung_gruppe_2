package com.feswiesbaden.attendencemanagement.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.Instant;

@Entity
@Table(name = "blocked_ips")
@Getter
@Setter
@NoArgsConstructor
public class BlockedIP {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(unique = true, nullable = false)
    private String ipAddress;

    private String reason;

    private String blockedBy;

    private Instant blockedAt = Instant.now();

    public BlockedIP(String ipAddress, String reason, String blockedBy) {
        this.ipAddress = ipAddress;
        this.reason = reason;
        this.blockedBy = blockedBy;
    }
}
