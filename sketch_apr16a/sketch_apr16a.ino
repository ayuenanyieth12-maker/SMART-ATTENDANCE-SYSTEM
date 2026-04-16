#include <SPI.h>
#include <MFRC522v2.h>
#include <MFRC522DriverSPI.h>
#include <MFRC522DriverPinSimple.h>

#define SS_PIN   5     // SDA / SS pin
#define RST_PIN  22    // Not used in this version, but keep for reference

// Create objects
MFRC522DriverPinSimple ss_pin(SS_PIN);
MFRC522DriverSPI driver(ss_pin);
MFRC522 rfid(driver);   // ← This is the correct name (not MFRC522v2)

void setup() {
  Serial.begin(115200);
  SPI.begin(18, 19, 23, SS_PIN);   // SCK, MISO, MOSI, SS

  rfid.PCD_Init();

  Serial.println("=== RFID Attendance System Ready ===");
  Serial.println("Place your card near the reader...");
}

void loop() {
  if (!rfid.PICC_IsNewCardPresent()) return;
  if (!rfid.PICC_ReadCardSerial()) return;

  // Build UID string
  String uid = "";
  for (byte i = 0; i < rfid.uid.size; i++) {
    if (rfid.uid.uidByte[i] < 0x10) uid += "0";
    uid += String(rfid.uid.uidByte[i], HEX);
    if (i < rfid.uid.size - 1) uid += ":";
  }
  uid.toUpperCase();

  Serial.println("-----------------------------");
  Serial.print("UID Detected: ");
  Serial.println(uid);

  if (uid == "77:E3:35:25") {
    Serial.println("Student : EPAJU PIUS JUNIOR");
    Serial.println("Status  : PRESENT");
  } 
  else if (uid == "35:7E:DD:E0") {
    Serial.println("Student : AYUEN AGUEK");
    Serial.println("Status  : PRESENT");
  } 
  else {
    Serial.println("Student : Unknown card");
    Serial.println("Status  : DENIED");
  }

  Serial.println("-----------------------------");

  rfid.PICC_HaltA();
  rfid.PCD_StopCrypto1();
  delay(1500);   // Prevent reading the same card multiple times
}