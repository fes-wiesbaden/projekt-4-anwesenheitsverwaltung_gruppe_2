#include <SPI.h>
#include <MFRC522.h>
#include <WiFi.h>
#include <PubSubClient.h>
#include <DIYables_LCD_I2C.h>

// ---------- WiFi & MQTT ----------
const char* WIFI_SSID     = "FES-SuS";
const char* WIFI_PASSWORD = "SuS-WLAN!Key24";

const char MQTT_BROKER_ADRRESS[] = "10.93.137.0";  
const int MQTT_PORT = 1883;
const char MQTT_CLIENT_ID[] = "esp32-rfid-reader";  
const char MQTT_USERNAME[] = "";                        
const char MQTT_PASSWORD[] = "";                        

// The MQTT topics that ESP32 should publish/subscribe
const char PUBLISH_TOPIC[] = "esp32-rfid-reader/checkin";    
const char SUBSCRIBE_TOPIC[] = "esp32-rfid-reader/checkout";  

const int PUBLISH_INTERVAL = 5000;

const char* topic_pub = "attendance/esp32/status";
const char* topic_sub = "attendance/esp32/commands";

// ------------ LCD------------------
DIYables_LCD_I2C lcd(0x27, 16, 2); // I2C address 0x27, 16 column and 2 rows

#define SS_PIN  5  // ESP32 pin GPIO5 
#define RST_PIN 27 // ESP32 pin GPIO27 

#define CHECK_IN_BTN 27
#define CHECK_BTN 26
#define CHECK_OUT_BTN 25

MFRC522 rfid(SS_PIN, RST_PIN);

enum Mode {MODE_NONE, MODE_CHECK_IN, MODE_CHECK_OUT, MODE_CHECK};
Mode currentMode = MODE_NONE;

// Debounce state for each button
int lastState_in  = HIGH;
int lastState_out = HIGH;
int lastState_chk = HIGH;

unsigned long lastDebounceTime = 0;
const unsigned long debounceDelay = 50;

WiFiClient espClient;
PubSubClient client(espClient);


void lcd_write(const char* text, const char* text2 = nullptr) {
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print(text);

  if (text2 != nullptr && strlen(text2) > 0) {
    lcd.setCursor(0, 1);
    lcd.print(text2);
  }
}

void setup() {

  Serial.begin(115200);
  SPI.begin(); 
  rfid.PCD_Init(); 

  // init LCD
  lcd.init();
  lcd.backlight();

  lcd_write("Attendance Managment");
  delay(2000);

  // setup WIFI
  setupWifi();

  // setup MQTT
  setup_mqtt();


  // init btns
  pinMode(CHECK_IN_BTN, INPUT_PULLUP);
  pinMode(CHECK_OUT_BTN, INPUT_PULLUP);
  pinMode(CHECK_BTN, INPUT_PULLUP);


  Serial.println("System ready. Press a button, then tap a card.");
  lcd_write("Select an Action below...");
}

void loop() {
  handleButtons();
  loop_mqtt();

  if (currentMode != MODE_NONE){
    if (rfid.PICC_IsNewCardPresent() && rfid.PICC_ReadCardSerial()){
      String uid = "";
      for(byte i = 0; i < rfid.uid.size; i++){
        uid += String(rfid.uid.uidByte[i] < 0x10 ? "0": "");
        uid += String(rfid.uid.uidByte[i], HEX);
      }
      uid.toUpperCase();

      switch (currentMode) {
      case MODE_CHECK_IN:
        Serial.print("CHECK-IN -> UID: ");
        Serial.println(uid);

        lcd_write("User Test", uid.c_str());
        delay(1000);

        // TODO:
        client.publish("attendance/reader/checkin", uid.c_str(), true);

        break;
      case MODE_CHECK_OUT:
        Serial.print("CHECK-OUT -> UID: ");
        Serial.println(uid);

        lcd_write("User Test", uid.c_str());
        delay(1000);
        
        // TODO:
        client.publish("attendance/reader/checkout", uid.c_str(), true);

        break;
      case MODE_CHECK:
        Serial.print("CHECK -> UID: ");
        Serial.println(uid);

        lcd_write("User Test", uid.c_str());
        delay(1000);
        
        // TODO:
        client.publish("attendance/reader/check", uid.c_str(), true);

        break;
      default:
        break;
      }

      rfid.PICC_HaltA();
      rfid.PCD_StopCrypto1();

      currentMode = MODE_NONE;
      Serial.println("System ready. Press a button, then tap a card.");
      lcd_write("Select an Action below...");
    }
  }
}



void handleButtons(){
  int reading_in = digitalRead(CHECK_IN_BTN);
  int reading_out = digitalRead(CHECK_OUT_BTN);
  int reading_chk = digitalRead(CHECK_BTN);

  unsigned long now = millis();
  if (now - lastDebounceTime > debounceDelay ){
    if (lastState_in == HIGH && reading_in == LOW){
      currentMode = MODE_CHECK_IN;
      Serial.println("Mode: CHECK_IN. Tap your card...");
      lcd_write("CHECK IN", "SCAN RFID CARD!");
      lastDebounceTime = now;
    }

    if (lastState_out == HIGH && reading_out == LOW ){
      currentMode = MODE_CHECK_OUT;
      Serial.println("Mode: CHECK_OUT. Tap your card...");
      lcd_write("CHECK OUT", "SCAN RFID CARD!");
      lastDebounceTime = now;
    }

    if (lastState_chk == HIGH && reading_chk == LOW ){
      currentMode = MODE_CHECK;
      Serial.println("Mode: CHECK. Tap your card...");
      lcd_write("CHECK", "SCAN RFID CARD!");
      lastDebounceTime = now;
    }
  }

  lastState_in = reading_in;
  lastState_out = reading_out;
  lastState_chk = reading_chk;
}

void setupWifi(){
  delay(20);
  Serial.print("Connecting to WIFI: ");
  lcd_write("Connecting to WIFI: ");
  Serial.println(WIFI_SSID);
  lcd_write(WIFI_SSID);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  while(WiFi.status() != WL_CONNECTED){
    delay(500);
    Serial.print(".");
    lcd_write(".");
  }

  Serial.println();
  Serial.print("Wifi connected, IP: ");
  lcd_write("Wifi connected");
  delay(200);
  Serial.println(WiFi.localIP());
}


void mqtt_callback(char* topic, byte* payload, unsigned int length){
  Serial.print("Message arrived on topic: ");
  Serial.println(topic);
  Serial.print("Payload: ");
  for (unsigned int i = 0; i < length; i++){
    Serial.print((char)payload[i]);
  }
  Serial.println();

  // TODO:
}

void reconnect_mqtt(){
  while(!client.connected()){
    Serial.print("Attempting MQTT connection...");
    bool connected;

    if (strlen(MQTT_USERNAME) > 0){
      connected = client.connect(MQTT_CLIENT_ID, MQTT_USERNAME, MQTT_PASSWORD);
    } else {
      connected = client.connect(MQTT_CLIENT_ID);
    }

    if (connected){
      Serial.println("Connected");
      client.subscribe(topic_sub);
      client.publish(topic_pub, "rfid_reader online");
    } else {
      Serial.print("failed, rc=");
      Serial.print(client.state());
      Serial.println(" retrying in 5 seconds");
      delay(PUBLISH_INTERVAL);
    }
  }
}


void setup_mqtt(){
  client.setServer(MQTT_BROKER_ADRRESS, MQTT_PORT);
  client.setCallback(mqtt_callback);
}

void loop_mqtt(){
  if (!client.connected()){
    reconnect_mqtt();
  }
  client.loop();
}