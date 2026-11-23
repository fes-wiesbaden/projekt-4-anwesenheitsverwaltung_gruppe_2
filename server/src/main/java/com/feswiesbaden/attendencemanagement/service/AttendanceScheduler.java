package com.feswiesbaden.attendencemanagement.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class AttendanceScheduler {
    private final AttendanceSessionService attendanceSessionService;

    @Scheduled(fixedDelayString = "${app.attendance.scheduler-delay-ms:15000}")
    public void processTimetable() {
        try {
            attendanceSessionService.processScheduledSessions();
        } catch (Exception ex) {
            log.error("Failed to process scheduled attendance sessions", ex);
        }
    }
}
