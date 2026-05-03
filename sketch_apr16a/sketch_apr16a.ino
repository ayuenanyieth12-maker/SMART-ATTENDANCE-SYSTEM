#include <SPI.h>
#include <MFRC522v2.h>
#include <MFRC522DriverSPI.h>
#include <MFRC522DriverPinSimple.h>
#include <WiFi.h>
#include <Firebase_ESP_Client.h>

// Helpers
#include <addons/TokenHelper.h>
#include <addons/RTDBHelper.h>

#include "secrets.h"

#define SS_PIN   5
#define RST_PIN  22

// RFID Setup
MFRC522DriverPinSimple ss_pin(SS_PIN);
MFRC522DriverSPI driver(ss_pin);
MFRC522 rfid(driver);

// Firebase objects
FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig config;

unsigned long lastScanTime = 0;
const unsigned long cooldown = 3000;
String lastUID = "";

void setup() {
  Serial.begin(115200);
  SPI.begin(18, 19, 23, SS_PIN);   // SCK, MISO, MOSI, SS

  // WiFi
 Serial.println("Connecting to WiFi: " + String(WIFI_SSID));

unsigned long wifiStart = millis();
bool connected = false;

WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

while (millis() - wifiStart < 20000) {   // 20 seconds timeout
  if (WiFi.status() == WL_CONNECTED) {
    connected = true;
    break;
  }
  delay(500);
  Serial.print(".");
}

if (connected) {
  Serial.println("\n✅ WiFi Connected!");
  Serial.print("IP Address: ");
  Serial.println(WiFi.localIP());
} else {
  Serial.println("\n❌ WiFi Connection FAILED!");
  Serial.println("Check SSID, Password, and signal strength.");
}

  // Firebase Config
  config.api_key = FIREBASE_API_KEY;
  config.database_url = "https://" + String(FIREBASE_PROJECT_ID) + "-default-rtdb.firebaseio.com";

  // Authentication
  auth.user.email = USER_EMAIL;
  auth.user.password = USER_PASSWORD;

  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);

  rfid.PCD_Init();
  Serial.println("=== RFID Attendance System Ready ===");
}

void loop() {
  if (!rfid.PICC_IsNewCardPresent() || !rfid.PICC_ReadCardSerial()) {
    return;
  }

  // Get UID
  String uid = "";
  for (byte i = 0; i < rfid.uid.size; i++) {
    if (rfid.uid.uidByte[i] < 0x10) uid += "0";
    uid += String(rfid.uid.uidByte[i], HEX);
    if (i < rfid.uid.size - 1) uid += ":";
  }
  uid.toUpperCase();

  // Cooldown to prevent duplicate scans
  if (uid == lastUID && millis() - lastScanTime < cooldown) {
    rfid.PICC_HaltA();
    rfid.PCD_StopCrypto1();
    return;
  }

  lastUID = uid;
  lastScanTime = millis();

  Serial.print("Scanned UID: ");
  Serial.println(uid);

  if (Firebase.ready()) {
    FirebaseJson json;
    json.set("uid", uid);
    json.set("timestamp", getISO8601Time());   // Real timestamp
    json.set("type", "IN");
    json.set("class_id", "BSE314");
    json.set("device", "ESP32-RFID-01");

    String path = "/scans/" + String(millis());   // Unique path

    if (Firebase.RTDB.setJSON(&fbdo, path.c_str(), &json)) {
      Serial.println("✅ Scan recorded successfully!");
    } else {
      Serial.println("❌ Firebase Error: " + fbdo.errorReason());
    }
  } else {
    Serial.println("Firebase not ready");
  }

  rfid.PICC_HaltA();
  rfid.PCD_StopCrypto1();
}

// Helper: Get current time as ISO string
String getISO8601Time() {
  time_t now;
  time(&now);
  char buf[25];
  strftime(buf, sizeof(buf), "%Y-%m-%dT%H:%M:%SZ", gmtime(&now));
  return String(buf);
}