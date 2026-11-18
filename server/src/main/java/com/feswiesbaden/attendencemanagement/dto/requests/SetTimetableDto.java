package com.feswiesbaden.attendencemanagement.dto.requests;

import java.time.LocalTime;

import jakarta.validation.constraints.NotNull;

public class SetTimetableDto {
    @NotNull
    public LocalTime startTime;

    @NotNull
    public LocalTime checkoutTime;
}
