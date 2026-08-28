package com.feswiesbaden.attendencemanagement.dto.requests;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class LoginDto {
    @NotBlank
    @Size(max = 30)
    public String username;

    @NotBlank
    @Size(max = 100)
    public String password;
}
