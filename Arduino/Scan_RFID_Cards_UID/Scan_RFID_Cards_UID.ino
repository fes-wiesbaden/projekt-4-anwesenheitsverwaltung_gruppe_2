#include <SPI.h>
#include <MFRC522.h>
#include <WiFi.h>
#include <PubSubClient.h>
#include <DIYables_LCD_I2C.h>

// ---------- WiFi & MQTT ----------
const char* WIFI_SSID = "FES-SuS";
const char* WIFI_PASSWORD = "SuS-WLAN!Key24";

const char MQTT_BROKER_ADRRESS[] = "10.93.137.8";
const int MQTT_PORT = 1883;
const char MQTT_CLIENT_ID[] = "esp32-rfid-reader";
const char MQTT_USERNAME[] = "";
const char MQTT_PASSWORD[] = "";

const char* topic_pub = "attendance/esp32/status";
const char* topic_sub = "attendance/esp32/commands";
const char* topic_set_command = "attendance/server/setRfid";
const char* topic_set_result = "attendance/server/setResult";
const char* topic_scan = "attendance/reader/scan";
const char* topic_scan_result = "attendance/server/scanResult";

const int SCAN_COOLDOWN_MS = 2000;
const int SCAN_RESULT_TIMEOUT_MS = 5000;

// ------------ LCD------------------
DIYables_LCD_I2C lcd(0x27, 16, 2);  // I2C address 0x27, 16 column and 2 rows

#define SS_PIN 5    // ESP32 pin GPIO5
#define RST_PIN 27  // ESP32 pin GPIO27

MFRC522 rfid(SS_PIN, RST_PIN);

enum Mode { MODE_NONE,
            MODE_SET };
Mode currentMode = MODE_NONE;
String pendingRequestId = "";

unsigned long lastScanTime = 0;
bool scanPending = false;
unsigned long scanPendingSince = 0;

WiFiClient espClient;
PubSubClient client(espClient);


void lcd_write(const char* text, const char* text2 = nullptr) {
  lcd.clear();
  lcd.setCursor(0, 0);

  String line1 = String(text);

  if (text2 == nullptr || strlen(text2) == 0) {
    if (line1.length() <= 16) {
      lcd.print(line1.c_str());
      return;
    }
    lcd.print(line1.substring(0, 16).c_str());
    lcd.setCursor(0, 1);
    lcd.print(line1.substring(16, 32).c_str());
    return;
  }

  if (line1.length() > 16) {
    line1 = line1.substring(0, 16);
  }
  lcd.print(line1.c_str());

  String line2 = String(text2);
  if (line2.length() > 16) {
    line2 = line2.substring(0, 16);
  }
  lcd.setCursor(0, 1);
  lcd.print(line2.c_str());
}

String extractJsonField(const String& json, const String& field) {
  String key = "\"" + field + "\"";
  int start = json.indexOf(key);
  if (start < 0) return "";
  start = json.indexOf(':', start + key.length());
  if (start < 0) return "";
  start++;
  while (start < (int)json.length() && json[start] == ' ') start++;
  if (start >= (int)json.length()) return "";

  if (json[start] == '"') {
    int end = json.indexOf('"', start + 1);
    if (end < 0) return "";
    return json.substring(start + 1, end);
  }

  int end = json.indexOf(',', start);
  if (end < 0) end = json.indexOf('}', start);
  if (end < 0) end = json.length();
  String value = json.substring(start, end);
  value.trim();
  return value;
}

void setup() {

  Serial.begin(115200);
  SPI.begin();
  rfid.PCD_Init();

  // init LCD
  lcd.init();
  lcd.backlight();

  lcd_write("Attendance", "Managment");
  delay(2000);

  // setup WIFI
  setupWifi();

  // setup MQTT
  setup_mqtt();

  Serial.println("System ready. Tap a card.");
  lcd_write("Tap your card");
}

void loop() {
  loop_mqtt();

  if (scanPending && millis() - scanPendingSince > SCAN_RESULT_TIMEOUT_MS) {
    scanPending = false;
    lcd_write("No response from", "server!");
    delay(2000);
    lcd_write("Tap your card");
  }

  if (rfid.PICC_IsNewCardPresent() && rfid.PICC_ReadCardSerial()) {
    String uid = "";
    for (byte i = 0; i < rfid.uid.size; i++) {
      uid += String(rfid.uid.uidByte[i] < 0x10 ? "0" : "");
      uid += String(rfid.uid.uidByte[i], HEX);
    }
    uid.toUpperCase();

    handleCardRead(uid);

    rfid.PICC_HaltA();
    rfid.PCD_StopCrypto1();
  }
}

void handleCardRead(const String& uid) {
  unsigned long now = millis();
  if (now - lastScanTime < SCAN_COOLDOWN_MS) {
    return;
  }
  lastScanTime = now;

  if (currentMode == MODE_SET) {
    currentMode = MODE_NONE;

    Serial.print("SET -> UID: ");
    Serial.println(uid);

    lcd_write("Saving card...");
    delay(1000);

    String setMsg = "{\"requestId\":\"" + pendingRequestId + "\",\"uid\":\"" + uid + "\"}";
    client.publish("attendance/reader/set", setMsg.c_str(), false);
    pendingRequestId = "";
    return;
  }

  Serial.print("SCAN -> UID: ");
  Serial.println(uid);

  lcd_write("Checking...");
  scanPending = true;
  scanPendingSince = now;
  client.publish(topic_scan, uid.c_str(), false);
}

void setupWifi() {
  delay(20);
  Serial.print("Connecting to WIFI: ");
  lcd_write("Connecting to", WIFI_SSID);
  Serial.println(WIFI_SSID);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
    lcd_write(".");
  }

  Serial.println();
  Serial.print("Wifi connected, IP: ");
  lcd_write("Wifi connected");
  delay(1000);
  Serial.println(WiFi.localIP());
}


void mqtt_callback(char* topic, byte* payload, unsigned int length) {
  Serial.print("Message arrived on topic: ");
  Serial.println(topic);

  String msg;
  for (unsigned int i = 0; i < length; i++) {
    msg += (char)payload[i];
  }
  Serial.print("Payload: ");
  Serial.println(msg);

  if (strcmp(topic, topic_set_command) == 0) {
    pendingRequestId = extractJsonField(msg, "requestId");

    currentMode = MODE_SET;
    Serial.println("Mode: SET. Tap your card...");
    lcd_write("Set", "SCAN RFID CARD!");
  }

  if (strcmp(topic, topic_set_result) == 0) {
    String status = extractJsonField(msg, "status");
    String uid = extractJsonField(msg, "uid");
    Serial.println("Set result: " + status + " (UID: " + uid + ")");

    if (status == "SAVED") {
      lcd_write("Card saved!");
    } else if (status == "DUPLICATE") {
      lcd_write("Card already", "in database!");
    } else if (status == "INVALID") {
      lcd_write("Invalid card!");
    } else {
      lcd_write("Set failed:", status.c_str());
    }
    delay(2000);
    lcd_write("Tap your card");
  }

  if (strcmp(topic, topic_scan_result) == 0) {
    scanPending = false;

    String status = extractJsonField(msg, "status");
    String uid = extractJsonField(msg, "uid");
    String time = extractJsonField(msg, "time");
    Serial.println("Scan result: " + status + " (UID: " + uid + ", time: " + time + ")");

    String line2 = time;
    if (status == "CHECKED_IN") {
      line2 = "at " + time;
      lcd_write("Checked in!", line2.c_str());
    } else if (status == "ALREADY_CHECKED_IN") {
      line2 = "since " + time;
      lcd_write("Already in!", line2.c_str());
    } else if (status == "UNKNOWN_CARD") {
      lcd_write("Unknown card!");
    } else if (status == "NOT_ASSIGNED") {
      lcd_write("Unassigned card!");
    } else {
      lcd_write("Scan error:", status.c_str());
    }
    delay(3000);
    lcd_write("Tap your card");
  }

  // TODO:
}

void reconnect_mqtt() {
  lcd_write("Connecting MQTT...", "please wait...");

  while (!client.connected()) {
    Serial.print("Attempting MQTT connection...");
    bool connected;

    if (strlen(MQTT_USERNAME) > 0) {
      connected = client.connect(MQTT_CLIENT_ID, MQTT_USERNAME, MQTT_PASSWORD);
    } else {
      connected = client.connect(MQTT_CLIENT_ID);
    }

    if (connected) {
      Serial.println("Connected");
      lcd_write("MQTT Connected");
      delay(2000);
      client.subscribe(topic_sub);
      client.subscribe(topic_set_command);
      client.subscribe(topic_set_result);
      client.subscribe(topic_scan_result);
      Serial.println("Subscribed to Set + Scan topics!");
      client.publish(topic_pub, "rfid_reader online");
      lcd_write("Tap your card");
      return;
    }

    int rc = client.state();
    Serial.print("failed, rc=");
    Serial.print(rc);
    Serial.println(" retrying in 5 seconds");

    lcd_write(("MQTT fail rc=" + String(rc)).c_str(), "retry in 5s...");
    delay(5000);
  }
}


void setup_mqtt() {
  client.setServer(MQTT_BROKER_ADRRESS, MQTT_PORT);
  client.setCallback(mqtt_callback);
}

void loop_mqtt() {
  if (!client.connected()) {
    reconnect_mqtt();
  }
  client.loop();
}
