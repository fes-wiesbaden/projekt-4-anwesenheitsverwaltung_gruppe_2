package com.feswiesbaden.attendencemanagement.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.feswiesbaden.attendencemanagement.entity.SaveResult;
import com.feswiesbaden.attendencemanagement.repository.AttendanceRepository;
import com.feswiesbaden.attendencemanagement.repository.ClassroomRepository;
import com.feswiesbaden.attendencemanagement.repository.RfidRepository;
import com.feswiesbaden.attendencemanagement.repository.StudentRepository;
import jakarta.annotation.PostConstruct;
import org.eclipse.paho.client.mqttv3.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.eclipse.paho.client.mqttv3.persist.MemoryPersistence;

import java.nio.charset.StandardCharsets;
import java.util.LinkedHashMap;
import java.util.Map;

@Service
public class MqttService {

    private final RfidRepository rfidRepository;
    private final AttendanceService attendanceService;
    private final CardService cardService;
    private final SetRfidService setRfidService;
    private final String brokerUrl;

    private final ObjectMapper objectMapper = new ObjectMapper();

    private static final String CLIENT_ID = MqttClient.generateClientId();
    private final String[] topics = new String[]{
            "attendance/reader/scan",
            "attendance/reader/set"
    };

    private static final String TOPIC_SET_RFID = "attendance/server/setRfid";
    private static final String TOPIC_SET_RESULT = "attendance/server/setResult";
    private static final String TOPIC_STATUS = "attendance/server/status";

    private static final String TOPIC_SCAN_RESULT = "attendance/server/scanResult";

    MqttClient client;

    @Autowired
    public MqttService(
            RfidRepository rfidRepository,
            AttendanceRepository attendanceRepository,
            StudentRepository studentRepository,
            ClassroomRepository classroomRepository,
            AttendanceService attendanceService,
            CardService cardService,
            SetRfidService setRfidService,
            @Value("${mqtt.broker.url}") String brokerUrl) {
        this.rfidRepository = rfidRepository;
        this.attendanceService = attendanceService;
        this.cardService = cardService;
        this.setRfidService = setRfidService;
        this.brokerUrl = brokerUrl;
    }

    @PostConstruct
    public void init() throws MqttException {
        client = new MqttClient(brokerUrl, CLIENT_ID, new MemoryPersistence());
        MqttConnectOptions options = new MqttConnectOptions();
        options.setCleanSession(true);

        client.setCallback(new MqttCallback() {
            @Override
            public void connectionLost(Throwable cause) {
                System.err.println("Connection lost: " + cause.getMessage());
            }

            private final java.util.concurrent.ExecutorService mqttWorker =
                    java.util.concurrent.Executors.newSingleThreadExecutor();

            @Override
            public void messageArrived(String topic, MqttMessage message) {
                mqttWorker.submit(() -> {
                    try {
                        handleMqttMessages(topic, message);
                    } catch (Exception e) {
                        System.err.println("Error handling MQTT message on " + topic + ": " + e.getMessage());
                    }
                });
            }

            @Override
            public void deliveryComplete(IMqttDeliveryToken token) {

            }
        });

        client.connect(options);
//       client.subscribe("#", 1);
        client.subscribe(topics, new int[]{1, 1});

        // inform mqtt
        client.publish(TOPIC_STATUS, "Server is online!".getBytes(StandardCharsets.UTF_8),
                2, false);
    }

    public void handleMqttMessages(String topic, MqttMessage message) throws MqttException {
        String payload = new String(message.getPayload(), StandardCharsets.UTF_8).trim();
        switch (topic) {
            case "attendance/reader/scan":
                handleScan(payload);
                break;
            case "attendance/reader/set":
                handleSetRfid(payload);
                break;
            default:
                break;
        }
    }

    private void handleScan(String payload) {
        String chipId = payload.toLowerCase();
        AttendanceService.ScanResult result = attendanceService.handleScan(chipId);

        try {
            Map<String, String> json = new LinkedHashMap<>();
            json.put("uid", chipId);
            json.put("status", result.status());
            if (result.time() != null) {
                json.put("time", result.time());
            }
            client.publish(TOPIC_SCAN_RESULT,
                    objectMapper.writeValueAsString(json).getBytes(StandardCharsets.UTF_8), 2, false);
        } catch (Exception e) {
            System.err.println("Failed to publish scan result: " + e.getMessage());
        }
    }

    private void handleSetRfid(String payload) throws MqttException {
        String requestId = "";
        String chipId = payload;

        try {
            JsonNode node = objectMapper.readTree(payload);
            if (node.isObject()) {
                requestId = node.path("requestId").asText("");
                chipId = node.path("uid").asText(payload);
            }
        } catch (Exception e) {
            System.err.println("Invalid set payload: " + e.getMessage());
        }

        chipId = chipId.trim().toLowerCase();
        SaveResult saved = cardService.saveRfid(chipId);
        String status = saved.name();

        if (!requestId.isEmpty()) {
            setRfidService.completeSet(requestId, status);
        }

        try {
            String result = objectMapper.writeValueAsString(Map.of(
                    "requestId", requestId,
                    "uid", chipId,
                    "status", status));
            client.publish(TOPIC_SET_RESULT, result.getBytes(StandardCharsets.UTF_8), 2, false);
        } catch (Exception e) {
            System.err.println("Failed to publish set result: " + e.getMessage());
        }
    }

    public void setRfid(String requestId) throws MqttException, JsonProcessingException {
        String payload = objectMapper.writeValueAsString(Map.of("requestId", requestId));
        client.publish(TOPIC_SET_RFID, payload.getBytes(StandardCharsets.UTF_8), 1, false);
    }




}
