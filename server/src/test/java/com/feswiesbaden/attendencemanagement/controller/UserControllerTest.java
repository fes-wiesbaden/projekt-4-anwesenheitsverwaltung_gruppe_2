package com.feswiesbaden.attendencemanagement.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertEquals;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import com.feswiesbaden.attendencemanagement.dto.requests.ChangePasswordDto;
import com.feswiesbaden.attendencemanagement.entity.User;
import com.feswiesbaden.attendencemanagement.repository.UserRepository;

@ExtendWith(MockitoExtension.class)
class UserControllerTest {
    
    @Mock 
    private UserRepository userRepository;

    @Mock 
    private PasswordEncoder passwordEncoder;

    @Mock 
    private Authentication authentication;

    @InjectMocks 
    private UserController userController;

    private User user;
    private ChangePasswordDto dto;

    @BeforeEach 
    void setUp() {
        user = new User();
        user.setUsername("testTeacher");
        user.setPassword("old-Password123");
        user.setFirstLogin(true);
    }

    @Test
    void changePassword_wrongOldPassword_returnsUnauthorized(){
        dto = new ChangePasswordDto();
        dto.setOldPassword("wrong-password123");
        dto.setNewPassword("newPassword123");

        when(authentication.getName()).thenReturn("testTeacher");
        when(userRepository.findByUsername("testTeacher")).thenReturn(user);
        when(passwordEncoder.matches("wrong-password123", "old-Password123")).thenReturn(false);

        ResponseEntity<String> response = userController.changePassword(dto, authentication);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
        verify(userRepository, never()).save(any(User.class));
    }

    @Test 
    void changePassword_blankNewPassword_returnsBadRequest(){
        dto = new ChangePasswordDto();
        dto.setOldPassword("correct-password");
        dto.setNewPassword("     ");

        when(authentication.getName()).thenReturn("testTeacher");
        when(userRepository.findByUsername("testTeacher")).thenReturn(user);
        when(passwordEncoder.matches("correct-password", "old-Password123")).thenReturn(true);

        ResponseEntity<String> response = userController.changePassword(dto, authentication);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        verify(userRepository,never()).save(any(User.class));
    }

    @Test 
    void changePassword_userNotFound_returnsNotFound(){
        dto = new ChangePasswordDto();
        dto.setOldPassword("correct-password");
        dto.setNewPassword("newPassword123");

        when(authentication.getName()).thenReturn("ghost");
        when(userRepository.findByUsername("ghost")).thenReturn(null);

        ResponseEntity<String> response = userController.changePassword(dto, authentication);

        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
        verifyNoInteractions(passwordEncoder);
    }

    @Test
    void changePassword_validRequest_updatesPasswordAndClearsFirstLogin(){
        dto = new ChangePasswordDto();
        dto.setOldPassword("correct-Password");
        dto.setNewPassword("newPassword123");

        when(authentication.getName()).thenReturn("testTeacher");
        when(userRepository.findByUsername("testTeacher")).thenReturn(user);
        when(passwordEncoder.matches("correct-Password", "old-Password123")).thenReturn(true);
        when(passwordEncoder.encode("newPassword123")).thenReturn("encoded-new-password");

        ResponseEntity<String> response = userController.changePassword(dto, authentication);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertThat(user.getPassword()).isEqualTo("encoded-new-password");
        assertThat(user.isFirstLogin()).isFalse();
        verify(userRepository).save(user);
    }
}
