package com.feswiesbaden.attendencemanagement.security;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;

import org.springframework.beans.factory.annotation.Value;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Component
@Slf4j
public class JwtUtil {

//    @Value("${jwt.secret}")
//    private String jwtSecret;
//    @Value("${jwt.expiration}")
//    private String jwtExpiration;
//
//    private SecretKey key;
//
//    @PostConstruct
//    public void init(){
//        this.key = Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
//    }
//
//    public String generateToken(String username){
//        return Jwts.builder()
//                .subject(username)
//                .issuedAt(new Date((new Date()).getTime() + jwtExpiration))
//                .signWith(key)
//                .compact();
//    }
//
//    public String GetUserFromToken(String token){
//        return Jwts.parser().verifyWith(key).build()
//                .parseSignedClaims(token)
//                .getPayload()
//                .getSubject();
//    }
//
//    public boolean ValidateJwtToken(String token){
//        try {
//            Jwts.parser().verifyWith(key).build().parseSignedClaims(token);
//            return true;
//        } catch (Exception e){
//            log.error("JWT validation Error: {}", e.getMessage());
//        }
//        return false;
//    }
}
