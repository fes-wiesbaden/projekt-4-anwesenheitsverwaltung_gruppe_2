package com.feswiesbaden.attendencemanagement.service;

import com.feswiesbaden.attendencemanagement.entity.Rfid_chip;
import com.feswiesbaden.attendencemanagement.entity.SaveResult;
import com.feswiesbaden.attendencemanagement.repository.RfidRepository;
import com.feswiesbaden.attendencemanagement.repository.StudentRepository;
import org.eclipse.paho.client.mqttv3.MqttException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;


@Service
public class CardService {

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private RfidRepository rfidRepository;


    public SaveResult saveRfid(String chipId) throws MqttException {
        if (chipId.isEmpty()) return SaveResult.INVALID;
        if (rfidRepository.existsByChipId(chipId)) return SaveResult.DUPLICATE;

        Rfid_chip chip = new Rfid_chip();
        chip.setChipId(chipId);

        try {
            rfidRepository.save(chip);
            System.out.println("Saved " + chipId + " Chip to DB!");
            return SaveResult.SAVED;
        } catch (DataIntegrityViolationException e) {
            System.out.println(chipId + " Chip is already in DB!");
            return SaveResult.DUPLICATE;
        }
    }

}
