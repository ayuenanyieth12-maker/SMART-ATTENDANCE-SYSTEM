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



