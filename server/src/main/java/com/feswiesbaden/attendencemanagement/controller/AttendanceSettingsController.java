package com.feswiesbaden.attendencemanagement.controller;

import com.feswiesbaden.attendencemanagement.entity.AttendanceSettings;
import com.feswiesbaden.attendencemanagement.entity.Role;
import com.feswiesbaden.attendencemanagement.repository.UserRepository;
import com.feswiesbaden.attendencemanagement.service.AttendanceSettingsService;
import com.feswiesbaden.attendencemanagement.service.SystemAuditLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/settings/attendance")
@RequiredArgsConstructor
public class AttendanceSettingsController {
    private final AttendanceSettingsService settingsService;
    private final UserRepository userRepository;
    private final SystemAuditLogService auditLogService;

    @GetMapping("/late-threshold")
    public ResponseEntity<?> getLateThreshold(Authentication auth) {
        if (IsUserAdmin(auth)) return ResponseEntity.status(403).body(Map.of("error", "Admin access required."));
        return ResponseEntity.ok(Map.of("lateGraceMinutes", settingsService.getLateGraceMinutes(),
                "meaning", "A check-in at or after scheduled start plus this many minutes is marked late."));
    }

    @PutMapping("/late-threshold")
    public ResponseEntity<?> updateLateThreshold(@RequestBody Map<String, Object> body, Authentication auth) {
        if (IsUserAdmin(auth)) return ResponseEntity.status(403).body(Map.of("error", "Admin access required."));
        if (body == null || !(body.get("lateGraceMinutes") instanceof Number number)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Provide lateGraceMinutes as an integer."));
        }
        int minutes = number.intValue();
        if (number.doubleValue() != minutes || minutes < 0 || minutes > 180) {
            return ResponseEntity.badRequest().body(Map.of("error", "lateGraceMinutes must be an integer from 0 to 180."));
        }
        int oldValue = settingsService.getLateGraceMinutes();
        AttendanceSettings saved = settingsService.updateLateGraceMinutes(minutes);
        auditLogService.record(auth.getName(), "LATE_THRESHOLD_CHANGED", "ATTENDANCE_SETTINGS", "1",
                "Updated late-arrival grace threshold", String.valueOf(oldValue), String.valueOf(minutes));
        return ResponseEntity.ok(Map.of("lateGraceMinutes", saved.getLateGraceMinutes()));
    }

    private boolean IsUserAdmin(Authentication auth) {
        if (auth == null) return true;
        var user = userRepository.findByUsername(auth.getName());
        return user == null || user.getRole() != Role.ADMIN;
    }
}
