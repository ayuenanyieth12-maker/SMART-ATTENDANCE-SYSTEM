#include <SPI.h>
#include <MFRC522.h>

#define SS_PIN   5    // SDA on RC522
#define RST_PIN  22   // RST on RC522
// SCK  → 18
// MISO → 19
// MOSI → 23

MFRC522 rfid(SS_PIN, RST_PIN);

void setup() {
  Serial.begin(115200);
  SPI.begin(18, 19, 23, 5); // SCK, MISO, MOSI, SS
  rfid.PCD_Init();

  Serial.println("=== RFID Attendance Ready ===");
  Serial.println("Tap a card...");
}

void loop() {
  if (!rfid.PICC_IsNewCardPresent()) return;
  if (!rfid.PICC_ReadCardSerial()) return;

  String uid = "";
  for (byte i = 0; i < rfid.uid.size; i++) {
    if (rfid.uid.uidByte[i] < 0x10) uid += "0";
    uid += String(rfid.uid.uidByte[i], HEX);
    if (i < rfid.uid.size - 1) uid += ":";
  }
  uid.toUpperCase();

  Serial.println("-----------------------------");
  Serial.print("UID: ");
  Serial.println(uid);

if (uid == "AA:BB:CC:DD") {
    Serial.println("Student : Alice Nakamura");
    Serial.println("Status  : PRESENT");
  } else if (uid == "AB:CD:12:34") {
    Serial.println("Student : Brian Omondi");
    Serial.println("Status  : PRESENT");
  } else {
    Serial.println("Student : Unknown card");
    Serial.println("Status  : DENIED");
  }

  Serial.println("-----------------------------");

    rfid.PICC_HaltA();
  rfid.PCD_StopCrypto1();
  delay(1500);
}


