package com.feswiesbaden.attendencemanagement.dto.requests;

import lombok.Getter;
import lombok.Setter;
import com.feswiesbaden.attendencemanagement.entity.Role;

@Getter
@Setter
public class RegisterDto {

    public String displayName;
    public String username;
    public String password;
    public Role role;
}
