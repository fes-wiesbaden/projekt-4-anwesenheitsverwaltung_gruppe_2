package com.feswiesbaden.attendencemanagement.service;

import java.time.LocalDate;

import com.feswiesbaden.attendencemanagement.entity.Classroom;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import com.feswiesbaden.attendencemanagement.entity.Role;
import com.feswiesbaden.attendencemanagement.entity.User;
import com.feswiesbaden.attendencemanagement.repository.UserRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements ApplicationRunner {

    @Value("${spring.security.user.name}")
    private String username;

    @Value("${spring.security.user.password}")
    private String password;

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(ApplicationArguments args) {
        if (!userRepository.existsByUsername(username)) {
            User admin = new User(
                    null,
                    username,
                    username,
                    passwordEncoder.encode(password),
                    false,
                    LocalDate.now(),
                    Role.ADMIN,
                    null,
                    null
            );
            userRepository.save(admin);
            log.info("Default admin user created");
        }
    }
}
