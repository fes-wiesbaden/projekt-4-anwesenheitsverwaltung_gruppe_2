package com.feswiesbaden.attendencemanagement.service;

import org.eclipse.paho.client.mqttv3.*;
import org.springframework.stereotype.Service;
import org.eclipse.paho.client.mqttv3.persist.MemoryPersistence;

import java.nio.charset.StandardCharsets;
import java.util.Arrays;

@Service
public class MqttService {

   private static final String BROKER_URL = "tcp://localhost:1883";
   private static final String CLIENT_ID = MqttClient.generateClientId();

   public String[] topics = {
           "attendance/reader/checkin",
           "attendance/reader/checkout",
           "attendance/reader/check"
   };

   MqttClient client;

   public MqttService() throws MqttException{
       client = new MqttClient(BROKER_URL, CLIENT_ID, new MemoryPersistence());
       MqttConnectOptions options = new MqttConnectOptions();
       options.setCleanSession(true);

       client.setCallback(new MqttCallback() {
           @Override
           public void connectionLost(Throwable cause) {

           }

           @Override
           public void messageArrived(String topic, MqttMessage message) throws Exception {
               HandleMqttMessages(topic, message);
//               System.out.println(topic + ": " + message);
           }

           @Override
           public void deliveryComplete(IMqttDeliveryToken token) {

           }
       });

       client.connect(options);
       client.subscribe("#", 1);

       client.publish("attendance/server/status", "Server is online!".getBytes(StandardCharsets.UTF_8),
               2, false);
   }

   public void HandleMqttMessages(String topic, MqttMessage message){
        switch (topic) {
            case "attendance/reader/checkin":
                System.out.println("Student " + message + " checking in");
                break;
            case "attendance/reader/checkout":
                System.out.println("Student " + message + " checking out");
                break;
            default:
                break;
        }
   }
}
