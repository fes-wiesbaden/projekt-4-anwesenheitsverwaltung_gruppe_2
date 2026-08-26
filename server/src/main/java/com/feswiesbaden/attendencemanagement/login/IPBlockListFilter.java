package com.feswiesbaden.attendencemanagement.login;

import java.io.IOException;

import org.springframework.web.filter.OncePerRequestFilter;

import com.feswiesbaden.attendencemanagement.service.IPBlockListService;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@RequiredArgsConstructor
public class IPBlockListFilter extends OncePerRequestFilter{

    private final IPBlockListService ipBlockListService;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {

        String clientIp = request.getRemoteAddr();

        if (ipBlockListService.isBlocked(clientIp)) {
            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
            response.getWriter().write("IP Address Blocked");
            return;
        }

        // Proceed to the next filter in the chain
        filterChain.doFilter(request, response);
    }
}
