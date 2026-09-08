package com.feswiesbaden.attendencemanagement.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.feswiesbaden.attendencemanagement.dto.requests.ChangePasswordDto;
import com.feswiesbaden.attendencemanagement.repository.UserRepository;
import com.feswiesbaden.attendencemanagement.entity.User;

import org.springframework.web.bind.annotation.RequestBody;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/user")
@RequiredArgsConstructor 
public class UserController {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @PatchMapping("/changePasswordOnFirstLogin")
    public ResponseEntity<String> changePassword(@RequestBody ChangePasswordDto dto, Authentication authentication) {
        User user = userRepository.findByUsername(authentication.getName());

        if (user == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }

        if (!passwordEncoder.matches(dto.getOldPassword(), user.getPassword())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Initialpasswort ist inkorrekt.");

        }

        if (dto.getNewPassword() == null || dto.getNewPassword().isBlank()) {
            return ResponseEntity.badRequest().body("Passwortfeld darf nicht leer sein");
        }

        user.setPassword(passwordEncoder.encode(dto.getNewPassword()));
        user.setFirstLogin(false);
        userRepository.save(user);

        return ResponseEntity.ok("Passwort erfolgreich geändert.");
    }
}
