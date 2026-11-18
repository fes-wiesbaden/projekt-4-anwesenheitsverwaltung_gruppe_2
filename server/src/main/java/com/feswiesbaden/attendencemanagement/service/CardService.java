package com.feswiesbaden.attendencemanagement.service;

import com.feswiesbaden.attendencemanagement.entity.Rfid_chip;
import com.feswiesbaden.attendencemanagement.entity.SaveResult;
import com.feswiesbaden.attendencemanagement.repository.RfidRepository;
import org.eclipse.paho.client.mqttv3.MqttException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import lombok.extern.slf4j.Slf4j;

import java.util.UUID;

@Service
@Slf4j
public class CardService {

    @Autowired
    private RfidRepository rfidRepository;


    public SaveResult saveRfid(String chipId) throws MqttException {
        if (chipId == null) return SaveResult.INVALID;
        chipId = chipId.trim().replaceAll("\\s+", "").toLowerCase(java.util.Locale.ROOT);
        if (chipId.isEmpty()) return SaveResult.INVALID;
        if (rfidRepository.existsByChipId(chipId)) return SaveResult.DUPLICATE;

        Rfid_chip chip = new Rfid_chip();
        chip.setChipId(chipId);

        try {
            rfidRepository.saveAndFlush(chip);
            log.info("RFID chip registered");
            return SaveResult.SAVED;
        } catch (DataIntegrityViolationException e) {
            log.info("Duplicate RFID chip registration rejected");
            return SaveResult.DUPLICATE;
        }
    }

}
