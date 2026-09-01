package com.feswiesbaden.attendencemanagement.service;

import com.feswiesbaden.attendencemanagement.entity.Rfid_chip;
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

import static org.hibernate.metamodel.mapping.ordering.OrderByFragmentTranslator.check;

@Service
public class MqttService {

    private final RfidRepository rfidRepository;
    private final AttendanceService attendanceService;
    private final CardService cardService;
    private final String brokerUrl;

    private static final String CLIENT_ID = MqttClient.generateClientId();
    private final String[] topics = new String[]{
            "attendance/reader/checkin",
            "attendance/reader/checkout",
            "attendance/reader/check",
            "attendance/reader/set"
    };

    private enum CheckResult {CHECKED_IN, CHECKED_OUT, CHECKED, INVALID}

    private static final String TOPIC_SET_RFID = "attendance/server/setRfid";
    private static final String TOPIC_SET_RESULT = "attendance/server/setResult";
    private static final String TOPIC_STATUS = "attendance/server/status";

    private static final String TOPIC_CHECK_IN_RESULT = "attendance/server/checkin";
    private static final String TOPIC_CHECK_OUT_RESULT = "attendance/server/checkout";
    private static final String TOPIC_CHECK_RESULT = "attendance/server/check";

    MqttClient client;

    @Autowired
    public MqttService(
            RfidRepository rfidRepository,
            AttendanceRepository attendanceRepository,
            StudentRepository studentRepository,
            ClassroomRepository classroomRepository,
            AttendanceService attendanceService,
            CardService cardService,
            @Value("${mqtt.broker.url}") String brokerUrl) {
        this.rfidRepository = rfidRepository;
        this.attendanceService = attendanceService;
        this.cardService = cardService;
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
        client.subscribe(topics, new int[]{1, 1, 1, 1});

        // inform mqtt
        client.publish(TOPIC_STATUS, "Server is online!".getBytes(StandardCharsets.UTF_8),
                2, false);
    }

    public void handleMqttMessages(String topic, MqttMessage message) throws MqttException {
        String chipId = new String(message.getPayload(), StandardCharsets.UTF_8).trim().toLowerCase();
        switch (topic) {
            case "attendance/reader/checkin":
                attendanceService.checkin(chipId);
                client.publish(TOPIC_CHECK_IN_RESULT, "CHECKED IN".getBytes(StandardCharsets.UTF_8), 2, false);
                break;
            case "attendance/reader/checkout":
                attendanceService.checkout(chipId);
                client.publish(TOPIC_CHECK_OUT_RESULT, "CHECKED OUT".getBytes(StandardCharsets.UTF_8), 2, false);
                break;
            case "attendance/reader/check":
                attendanceService.check(chipId);
                client.publish(TOPIC_CHECK_RESULT, "CHECKED".getBytes(StandardCharsets.UTF_8), 2, false);
                break;
            case "attendance/reader/set":
                SaveResult saved = cardService.saveRfid(chipId);

                switch (saved) {
                    case DUPLICATE -> client.publish(TOPIC_SET_RESULT,
                            "Chip is already in DB".getBytes(StandardCharsets.UTF_8), 2, false);
                    case SAVED -> client.publish(TOPIC_SET_RESULT,
                            "Saved".getBytes(StandardCharsets.UTF_8), 2, false);
                    case INVALID -> client.publish(TOPIC_SET_RESULT,
                            "Chip is invalid".getBytes(StandardCharsets.UTF_8), 2, false);
                }
                break;
            default:
                break;
        }
    }

    public void setRfid() throws MqttException {
        client.publish(TOPIC_SET_RFID, new byte[0], 1, false);
    }




}
