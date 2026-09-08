package com.feswiesbaden.attendencemanagement.dto.requests;

import lombok.Getter;

@Getter 
public class ChangePasswordDto {
    private String oldPassword;
    private String newPassword;
}
