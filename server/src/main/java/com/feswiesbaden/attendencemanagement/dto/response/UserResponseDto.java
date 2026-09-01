package com.feswiesbaden.attendencemanagement.dto.response;

import java.time.LocalDate;
import java.util.UUID;

import com.feswiesbaden.attendencemanagement.entity.Role;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class UserResponseDto {

    private UUID id;
    private String displayName;
    private String username;
    private final  LocalDate createdAt;
    private Role role;
}