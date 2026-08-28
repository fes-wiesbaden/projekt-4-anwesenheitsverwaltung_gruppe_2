package com.feswiesbaden.attendencemanagement.dto.response;

import java.util.UUID;

public class CreateStudentResponseDto {
    public UUID id;
    public String username;
    public CreateStudentResponseDto(UUID id, String username) {
        this.id = id;
        this.username = username;
    }
}
