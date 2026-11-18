package com.feswiesbaden.attendencemanagement.repository;

import com.feswiesbaden.attendencemanagement.entity.AttendanceSettings;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AttendanceSettingsRepository extends JpaRepository<AttendanceSettings, Integer> {
}
