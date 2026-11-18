package com.feswiesbaden.attendencemanagement.dto.response;

import java.time.LocalTime;

import com.feswiesbaden.attendencemanagement.entity.Timetable;

public class TimetableResponseDto {

    public Long id;
    public Long classroomId;
    public String classroomName;
    public String dayOfWeek;
    public LocalTime startTime;
    public LocalTime checkoutTime;

    public TimetableResponseDto() { }

    public TimetableResponseDto(Timetable timetable) {
        this.id = timetable.getId();
        this.classroomId = timetable.getClassroom().getId();
        this.classroomName = timetable.getClassroom().getClassroomName();
        this.dayOfWeek = timetable.getDayOfWeek().name();
        this.startTime = timetable.getStartTime();
        this.checkoutTime = timetable.getCheckoutTime();
    }
}
