package com.feswiesbaden.attendencemanagement.controller;

import com.feswiesbaden.attendencemanagement.service.MqttService;
import org.eclipse.paho.client.mqttv3.MqttException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/rfid")
public class CardController {

    @Autowired
    private MqttService mqttService;

    @GetMapping("/set")
    public String SetRfid() throws MqttException {
        mqttService.setRfid();
        return "Set RFID";
    }
}
