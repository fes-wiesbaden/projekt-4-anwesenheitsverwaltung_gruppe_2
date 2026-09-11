package com.feswiesbaden.attendencemanagement.dto.response;

public class SetRfidResponseDto {

    public String requestId;
    public String status;

    public SetRfidResponseDto() {
    }

    public SetRfidResponseDto(String requestId, String status) {
        this.requestId = requestId;
        this.status = status;
    }
}
