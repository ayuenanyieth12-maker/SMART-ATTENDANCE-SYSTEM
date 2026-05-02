#include <FB_Const.h>
#include <FB_Error.h>
#include <FB_Network.h>
#include <FB_Utils.h>
#include <Firebase.h>

#include <FirebaseFS.h>


#include <SPI.h>
#include <MFRC522v2.h>
#include <MFRC522DriverSPI.h>
#include <MFRC522DriverPinSimple.h>
#include <WiFi.h>
#include <Firebase_ESP_Client.h>

// Provide the token generation process info.
#include <addons/TokenHelper.h>
// Provide the RTDB payload printing info and other helper functions.
#include <addons/RTDBHelper.h>

#include "secrets.h"

#define SS_PIN   5
#define RST_PIN  22

// ===== RFID Setup =====
MFRC522DriverPinSimple ss_pin(SS_PIN);
MFRC522DriverSPI driver(ss_pin);
MFRC522 rfid(driver);

// ===== Firebase Setup =====
FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig config;

unsigned long lastScanTime = 0;
const int cooldown = 3000;
String lastUID = "";

// Database URL from secrets
String databaseURL = "https://" + String(FIREBASE_PROJECT_ID) + "-default-rtdb.firebaseio.com";

void setup() {
  Serial.begin(115200);
  SPI.begin(18, 19, 23, SS_PIN);

  // ===== Connect WiFi =====
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi connected!");

  // ===== Firebase Config =====
  config.api_key = FIREBASE_API_KEY;
  config.database_url = databaseURL;
  
  auth.user.email = USER_EMAIL;
  auth.user.password = USER_PASSWORD;

  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);

  rfid.PCD_Init();
  Serial.println("=== RFID Attendance System Ready (RTDB Mode) ===");
}

void loop() {
  if (!rfid.PICC_IsNewCardPresent()) return;
  if (!rfid.PICC_ReadCardSerial()) return;

  // Build UID
  String uid = "";
  for (byte i = 0; i < rfid.uid.size; i++) {
    if (rfid.uid.uidByte[i] < 0x10) uid += "0";
    uid += String(rfid.uid.uidByte[i], HEX);
    if (i < rfid.uid.size - 1) uid += ":";
  }
  uid.toUpperCase();

  if (uid == lastUID && millis() - lastScanTime < cooldown) return;
  lastUID = uid;
  lastScanTime = millis();

  Serial.print("Scanned UID: ");
  Serial.println(uid);

  if (Firebase.ready()) {
    // Record the scan in RTDB
    FirebaseJson json;
    json.add("uid", uid);
    json.add("timestamp", "2024-05-02 14:00:00"); // Placeholder for time
    json.add("type", "IN");
    json.add("class_id", "BSE314");

    String path = "/scans/" + String(millis()); // Simple unique ID
    
    if (Firebase.RTDB.setJSON(&fbdo, path.c_str(), &json)) {
      Serial.println("Scan recorded in RTDB!");
    } else {
      Serial.println("Error recording scan: " + fbdo.errorReason());
    }
  }

  rfid.PICC_HaltA();
  rfid.PCD_StopCrypto1();
}