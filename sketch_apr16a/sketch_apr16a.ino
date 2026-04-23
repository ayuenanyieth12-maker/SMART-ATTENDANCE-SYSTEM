#include <SPI.h>
#include <MFRC522v2.h>
#include <MFRC522DriverSPI.h>
#include <MFRC522DriverPinSimple.h>
#include <WiFi.h>
#include <time.h>

#define SS_PIN   5
#define RST_PIN  22

// ===== WIFI Settings =====
const char* ssid = "YourWifiName";
const char* password = "YourWifiPassword";

// ===== NTP Server =====
const char* ntpServer = "pool.ntp.org";

// ===== RFID Setup =====
MFRC522DriverPinSimple ss_pin(SS_PIN);
MFRC522DriverSPI driver(ss_pin);
MFRC522 rfid(driver);

// ===== Student Structure =====
struct Student {
  String uid;
  String name;
  bool isPresent;
  String entryTime;
  String exitTime;
};

Student students[] = {
  {"77:E3:35:25", "EPAJU PIUS JUNIOR", false, "", ""},
  {"35:7E:DD:E0", "AYUEN AGUEK", false, "", ""}
};

const int numStudents = sizeof(students) / sizeof(students[0]);

// ===== Anti double-scan =====
String lastUID = "";
unsigned long lastScanTime = 0;
const int cooldown = 3000;

// ===== Get Current Time =====
String getCurrentTime() {
  struct tm timeinfo;
  if (!getLocalTime(&timeinfo)) {
    return "Time unavailable";
  }

  char buffer[30];
  strftime(buffer, sizeof(buffer), "%Y-%m-%d %H:%M:%S", &timeinfo);
  return String(buffer);
}

void setup() {
  Serial.begin(115200);
  SPI.begin(18, 19, 23, SS_PIN);

  // ===== Connect WiFi =====
  Serial.print("Connecting to WiFi...");
  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("\nWiFi connected!");

  // ===== Set Uganda Time (EAT) =====
  configTzTime("Africa/Kampala", ntpServer);

  Serial.println("Time synced (Uganda time)");

  rfid.PCD_Init();
  delay(4);

  Serial.println("=== RFID Attendance System Ready ===");
  Serial.println("Tap card to mark IN / OUT");
}

void loop() {
  if (!rfid.PICC_IsNewCardPresent()) return;
  if (!rfid.PICC_ReadCardSerial()) return;

  // ===== Build UID =====
  String uid = "";
  for (byte i = 0; i < rfid.uid.size; i++) {
    if (rfid.uid.uidByte[i] < 0x10) uid += "0";
    uid += String(rfid.uid.uidByte[i], HEX);
    if (i < rfid.uid.size - 1) uid += ":";
  }
  uid.toUpperCase();

  // ===== Prevent double scan =====
  if (uid == lastUID && millis() - lastScanTime < cooldown) {
    return;
  }
  lastUID = uid;
  lastScanTime = millis();

  Serial.println("-----------------------------");
  Serial.print("UID: ");
  Serial.println(uid);

  bool found = false;
  String currentTime = getCurrentTime();

  for (int i = 0; i < numStudents; i++) {
    if (students[i].uid == uid) {
      found = true;

      if (!students[i].isPresent) {
        // ===== ENTRY =====
        students[i].isPresent = true;
        students[i].entryTime = currentTime;
        students[i].exitTime = "";

        Serial.print("Student : ");
        Serial.println(students[i].name);
        Serial.print("Status  : PRESENT (IN at ");
        Serial.print(currentTime);
        Serial.println(")");
      } 
      else {
        // ===== EXIT =====
        students[i].isPresent = false;
        students[i].exitTime = currentTime;

        Serial.print("Student : ");
        Serial.println(students[i].name);
        Serial.print("Status  : LEFT (OUT at ");
        Serial.print(currentTime);
        Serial.println(")");
        Serial.print("Duration: ");
        Serial.print(students[i].entryTime);
        Serial.print(" → ");
        Serial.println(currentTime);
      }
      break;
    }
  }

  if (!found) {
    Serial.println("Student : Unknown card");
    Serial.println("Status  : DENIED");
  }

  Serial.println("-----------------------------");

  rfid.PICC_HaltA();
  rfid.PCD_StopCrypto1();
}