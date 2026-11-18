package com.feswiesbaden.attendencemanagement.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.feswiesbaden.attendencemanagement.entity.SaveResult;
import jakarta.annotation.PostConstruct;
import org.springframework.scheduling.annotation.Scheduled;
import lombok.extern.slf4j.Slf4j;
import org.eclipse.paho.client.mqttv3.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.eclipse.paho.client.mqttv3.persist.MemoryPersistence;

import java.nio.charset.StandardCharsets;
import java.util.LinkedHashMap;
import java.util.Map;

@Service
@Slf4j
public class MqttService {

    private final AttendanceService attendanceService;
    private final CardService cardService;
    private final SetRfidService setRfidService;
    private final String brokerUrl;
    private final String brokerUsername;
    private final String brokerPassword;

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

    private volatile MqttClient client;

    @Autowired
    public MqttService(
            AttendanceService attendanceService,
            CardService cardService,
            SetRfidService setRfidService,
            @Value("${mqtt.broker.url}") String brokerUrl,
            @Value("${mqtt.username:}") String brokerUsername,
            @Value("${mqtt.password:}") String brokerPassword) {
        this.attendanceService = attendanceService;
        this.cardService = cardService;
        this.setRfidService = setRfidService;
        this.brokerUrl = brokerUrl;
        this.brokerUsername = brokerUsername;
        this.brokerPassword = brokerPassword;
    }

    @PostConstruct
    public void init() {
        try {
            client = new MqttClient(brokerUrl, CLIENT_ID, new MemoryPersistence());
            client.setCallback(new MqttCallback() {
                private final java.util.concurrent.ExecutorService mqttWorker =
                        java.util.concurrent.Executors.newSingleThreadExecutor(r -> {
                            Thread thread = new Thread(r, "attendance-mqtt-worker");
                            thread.setDaemon(true);
                            return thread;
                        });

                @Override
                public void connectionLost(Throwable cause) {
                    log.warn("MQTT connection lost; scheduled reconnect will retry", cause);
                }

                @Override
                public void messageArrived(String topic, MqttMessage message) {
                    mqttWorker.submit(() -> {
                        try {
                            handleMqttMessages(topic, message);
                        } catch (Exception e) {
                            log.error("Error handling MQTT message on {}", topic, e);
                        }
                    });
                }

                @Override
                public void deliveryComplete(IMqttDeliveryToken token) { }
            });
            connectAndSubscribe();
        } catch (Exception ex) {
            // Do not prevent the REST API from starting if Mosquitto is temporarily unavailable.
            log.error("Initial MQTT connection failed; will retry automatically", ex);
        }
    }

    @Scheduled(fixedDelayString = "${mqtt.reconnect-delay-ms:5000}")
    public void reconnectIfNeeded() {
        if (client == null || client.isConnected()) return;
        try {
            connectAndSubscribe();
        } catch (Exception ex) {
            log.warn("MQTT reconnect attempt failed", ex);
        }
    }

    private synchronized void connectAndSubscribe() throws MqttException {
        if (client == null || client.isConnected()) return;
        MqttConnectOptions options = new MqttConnectOptions();
        options.setCleanSession(true);
        if (brokerUsername != null && !brokerUsername.isBlank()) {
            options.setUserName(brokerUsername);
            if (brokerPassword != null && !brokerPassword.isEmpty()) {
                options.setPassword(brokerPassword.toCharArray());
            }
        }
        options.setConnectionTimeout(5);
        options.setKeepAliveInterval(30);
        client.connect(options);
        client.subscribe(topics, new int[]{1, 1});
        client.publish(TOPIC_STATUS, "Server is online!".getBytes(StandardCharsets.UTF_8), 1, false);
        log.info("Connected to MQTT broker {} and subscribed to RFID topics", brokerUrl);
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
        String chipId = payload.trim().replaceAll("\\s+", "").toLowerCase(java.util.Locale.ROOT);
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
                chipId = node.path("uid").asText("");
            }
        } catch (Exception ignored) {
            // Legacy firmware may publish the UID as plain text without a request ID.
        }

        if (requestId.isBlank()) {
            requestId = setRfidService.getSinglePendingRequestId();
        }
        if (!setRfidService.claimSet(requestId)) {
            publishSetResult(requestId == null ? "" : requestId, chipId,
                    "REJECTED_NO_PENDING_REQUEST");
            log.warn("Rejected RFID enrollment response without a unique pending admin request");
            return;
        }

        String normalizedUid = chipId == null ? "" : chipId.trim()
                .replaceAll("\\s+", "").toLowerCase(java.util.Locale.ROOT);
        try {
            SaveResult saved = cardService.saveRfid(normalizedUid);
            String status = saved.name();
            setRfidService.completeSet(requestId, status);
            publishSetResult(requestId, normalizedUid, status);
        } catch (Exception ex) {
            setRfidService.completeSet(requestId, "FAILED");
            publishSetResult(requestId, normalizedUid, "FAILED");
            log.error("Failed to store scanned RFID UID", ex);
        }
    }

    private void publishSetResult(String requestId, String chipId, String status) throws MqttException {
        try {
            String result = objectMapper.writeValueAsString(Map.of(
                    "requestId", requestId,
                    "uid", chipId == null ? "" : chipId,
                    "status", status));
            client.publish(TOPIC_SET_RESULT, result.getBytes(StandardCharsets.UTF_8), 2, false);
        } catch (JsonProcessingException e) {
            log.error("Failed to serialize RFID enrollment result", e);
        }
    }

    public void setRfid(String requestId) throws MqttException, JsonProcessingException {
        if (client == null) throw new IllegalStateException("MQTT client has not been initialized.");
        if (!client.isConnected()) connectAndSubscribe();
        String payload = objectMapper.writeValueAsString(Map.of("requestId", requestId));
        client.publish(TOPIC_SET_RFID, payload.getBytes(StandardCharsets.UTF_8), 1, false);
    }




}
