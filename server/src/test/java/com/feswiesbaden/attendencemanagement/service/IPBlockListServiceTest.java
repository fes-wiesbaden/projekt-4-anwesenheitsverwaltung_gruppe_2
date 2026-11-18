package com.feswiesbaden.attendencemanagement.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.feswiesbaden.attendencemanagement.entity.BlockedIP;
import com.feswiesbaden.attendencemanagement.repository.BlockedIPRepository;

@ExtendWith(MockitoExtension.class)
class IPBlockListServiceTest {

    @Mock
    private BlockedIPRepository repository;

    @InjectMocks
    private IPBlockListService service;

    @Test
    void blockIP_savesNewBlockWithReasonAndActor() {
        when(repository.existsByIpAddress("192.0.2.1")).thenReturn(false);

        service.blockIP("192.0.2.1", "abuse", "admin");

        ArgumentCaptor<BlockedIP> captor = ArgumentCaptor.forClass(BlockedIP.class);
        verify(repository).save(captor.capture());
        assertThat(captor.getValue().getIpAddress()).isEqualTo("192.0.2.1");
        assertThat(captor.getValue().getReason()).isEqualTo("abuse");
        assertThat(captor.getValue().getBlockedBy()).isEqualTo("admin");
    }

    @Test
    void blockIP_doesNotCreateDuplicate() {
        when(repository.existsByIpAddress("192.0.2.1")).thenReturn(true);

        service.blockIP("192.0.2.1", "abuse", "admin");

        verify(repository, never()).save(any(BlockedIP.class));
    }

    @Test
    void unblockIPDeletesMatchingAddress() {
        service.unblockIP("192.0.2.1");

        verify(repository).deleteByIpAddress("192.0.2.1");
    }

    @Test
    void isBlockedReturnsRepositoryResult() {
        when(repository.existsByIpAddress("192.0.2.1")).thenReturn(true);

        assertThat(service.isBlocked("192.0.2.1")).isTrue();
    }
}
