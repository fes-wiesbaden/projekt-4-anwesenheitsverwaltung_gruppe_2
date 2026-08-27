package com.feswiesbaden.attendencemanagement.login;

import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.feswiesbaden.attendencemanagement.dto.requests.LoginDto;
import com.feswiesbaden.attendencemanagement.dto.response.LoginResponseDto;
import com.feswiesbaden.attendencemanagement.jwt.JwtUtil;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final JwtUtil jwtUtil;

    @PostMapping("/login")
    public ResponseEntity<LoginResponseDto> login(@RequestBody LoginDto request){

                var authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getUsername(),
                        request.getPassword()
                ));

                String token = jwtUtil.generateToken(authentication);
                
                return ResponseEntity.ok(new LoginResponseDto(token));
    }

    
}
