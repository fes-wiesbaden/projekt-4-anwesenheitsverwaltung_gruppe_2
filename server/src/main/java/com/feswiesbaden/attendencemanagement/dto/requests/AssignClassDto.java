package com.feswiesbaden.attendencemanagement.dto.requests;

import com.feswiesbaden.attendencemanagement.entity.Classroom;

import lombok.Getter;

@Getter
public class AssignClassDto {
    private String username;
    private long classroomId;
}
