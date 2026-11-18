package com.feswiesbaden.attendencemanagement.controller;

import org.springframework.http.ResponseEntity;
import jakarta.validation.Valid;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.feswiesbaden.attendencemanagement.dto.requests.LoginDto;
import com.feswiesbaden.attendencemanagement.dto.response.LoginResponseDto;
import com.feswiesbaden.attendencemanagement.dto.response.LogoutResponseDto;
import com.feswiesbaden.attendencemanagement.jwt.JwtUtil;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final JwtUtil jwtUtil;

    @PostMapping("/login")
    public ResponseEntity<LoginResponseDto> login(@Valid @RequestBody LoginDto request) {
        if (request == null || request.getUsername() == null || request.getUsername().isBlank()
                || request.getPassword() == null || request.getPassword().isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        try {
            var authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            request.getUsername().trim(), request.getPassword()));
            String token = jwtUtil.generateToken(authentication);
            return ResponseEntity.ok(new LoginResponseDto(token));
        } catch (AuthenticationException ex) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<LogoutResponseDto> logout() {
        LogoutResponseDto response = new LogoutResponseDto();
        response.LoggedOut = true;
        return ResponseEntity.ok(response);
    }
}
