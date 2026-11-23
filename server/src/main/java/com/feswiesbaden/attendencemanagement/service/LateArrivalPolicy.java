package com.feswiesbaden.attendencemanagement.service;

import java.time.LocalDateTime;

public final class LateArrivalPolicy {
    private LateArrivalPolicy() {}

    /** The threshold is inclusive: exactly start + grace minutes is late. */
    public static boolean isLate(LocalDateTime checkin, LocalDateTime scheduledStart, int graceMinutes) {
        if (checkin == null || scheduledStart == null) return false;
        if (graceMinutes < 0) throw new IllegalArgumentException("Grace minutes cannot be negative.");
        return !checkin.isBefore(scheduledStart.plusMinutes(graceMinutes));
    }
}
