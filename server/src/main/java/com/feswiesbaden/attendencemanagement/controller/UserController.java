package com.feswiesbaden.attendencemanagement.controller;

import com.feswiesbaden.attendencemanagement.dto.requests.ChangePasswordDto;
import com.feswiesbaden.attendencemanagement.entity.User;
import com.feswiesbaden.attendencemanagement.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/user")
@RequiredArgsConstructor
public class UserController {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @PatchMapping("/changePasswordOnFirstLogin")
    public ResponseEntity<String> changePassword(@RequestBody ChangePasswordDto dto,
                                                  Authentication authentication) {
        if (dto == null || dto.getOldPassword() == null || dto.getNewPassword() == null
                || dto.getNewPassword().isBlank() || dto.getNewPassword().length() < 10) {
            return ResponseEntity.badRequest()
                    .body("A current password and a new password of at least 10 characters are required.");
        }

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
