package com.feswiesbaden.attendencemanagement.service;

import com.feswiesbaden.attendencemanagement.entity.AttendanceSettings;
import com.feswiesbaden.attendencemanagement.repository.AttendanceSettingsRepository;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AttendanceSettingsService {
    public static final int DEFAULT_LATE_GRACE_MINUTES = 5;
    private static final int SETTINGS_ID = 1;
    private final AttendanceSettingsRepository repository;

    @PostConstruct
    @Transactional
    public void ensureDefaultSettings() {
        if (!repository.existsById(SETTINGS_ID)) {
            AttendanceSettings settings = new AttendanceSettings();
            settings.setId(SETTINGS_ID);
            settings.setLateGraceMinutes(DEFAULT_LATE_GRACE_MINUTES);
            repository.save(settings);
        }
    }

    @Transactional(readOnly = true)
    public int getLateGraceMinutes() {
        return repository.findById(SETTINGS_ID)
                .map(AttendanceSettings::getLateGraceMinutes)
                .orElse(DEFAULT_LATE_GRACE_MINUTES);
    }

    @Transactional
    public AttendanceSettings updateLateGraceMinutes(int minutes) {
        if (minutes < 0 || minutes > 180) {
            throw new IllegalArgumentException("lateGraceMinutes must be between 0 and 180.");
        }
        AttendanceSettings settings = repository.findById(SETTINGS_ID).orElseGet(() -> {
            AttendanceSettings created = new AttendanceSettings();
            created.setId(SETTINGS_ID);
            return created;
        });
        settings.setLateGraceMinutes(minutes);
        return repository.save(settings);
    }
}
