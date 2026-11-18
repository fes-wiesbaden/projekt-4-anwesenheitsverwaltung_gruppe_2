package com.feswiesbaden.attendencemanagement.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataIntegrityViolationException;

import com.feswiesbaden.attendencemanagement.entity.Rfid_chip;
import com.feswiesbaden.attendencemanagement.entity.SaveResult;
import com.feswiesbaden.attendencemanagement.repository.RfidRepository;
import com.feswiesbaden.attendencemanagement.repository.StudentRepository;

@ExtendWith(MockitoExtension.class)
class CardServiceTest {

    @Mock
    private StudentRepository studentRepository;

    @Mock
    private RfidRepository rfidRepository;

    @InjectMocks
    private CardService cardService;

    @Test
    void saveRfid_emptyChipIdReturnsInvalid() throws Exception {
        assertThat(cardService.saveRfid("")).isEqualTo(SaveResult.INVALID);
        verify(rfidRepository, never()).existsByChipId(any());
        verify(rfidRepository, never()).save(any(Rfid_chip.class));
    }

    @Test
    void saveRfid_existingChipReturnsDuplicateWithoutSaving() throws Exception {
        when(rfidRepository.existsByChipId("card-1")).thenReturn(true);

        assertThat(cardService.saveRfid("card-1")).isEqualTo(SaveResult.DUPLICATE);

        verify(rfidRepository, never()).save(any(Rfid_chip.class));
    }

    @Test
    void saveRfid_newChipPersistsChip() throws Exception {
        when(rfidRepository.existsByChipId("card-1")).thenReturn(false);

        assertThat(cardService.saveRfid("card-1")).isEqualTo(SaveResult.SAVED);

        verify(rfidRepository).save(org.mockito.ArgumentMatchers.argThat(
                chip -> "card-1".equals(chip.getChipId())));
    }

    @Test
    void saveRfid_integrityConflictReturnsDuplicate() throws Exception {
        when(rfidRepository.existsByChipId("card-1")).thenReturn(false);
        when(rfidRepository.save(any(Rfid_chip.class)))
                .thenThrow(new DataIntegrityViolationException("duplicate chip"));

        assertThat(cardService.saveRfid("card-1")).isEqualTo(SaveResult.DUPLICATE);
    }
}
