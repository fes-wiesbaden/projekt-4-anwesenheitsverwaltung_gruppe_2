package com.feswiesbaden.attendencemanagement.service;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class SetRfidServiceTest {

    @Test
    void startSetCreatesPendingRequestThatCanBeCompleted() {
        SetRfidService service = new SetRfidService();

        String requestId = service.startSet();

        assertThat(service.getStatus(requestId)).isEqualTo(SetRfidService.STATUS_PENDING);

        service.completeSet(requestId, "SAVED");

        assertThat(service.getStatus(requestId)).isEqualTo("SAVED");
    }

    @Test
    void cancelSetAndUnknownRequestReturnNotFound() {
        SetRfidService service = new SetRfidService();
        String requestId = service.startSet();

        service.cancelSet(requestId);

        assertThat(service.getStatus(requestId)).isEqualTo(SetRfidService.STATUS_NOT_FOUND);
        assertThat(service.getStatus("unknown")).isEqualTo(SetRfidService.STATUS_NOT_FOUND);
    }
}
