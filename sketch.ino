#include <SPI.h>
#include <MFRC522.h>

#define SS_PIN   5    // SDA on RC522
#define RST_PIN  22   // RST on RC522
// SCK  → 18
// MISO → 19
// MOSI → 23

MFRC522 rfid(SS_PIN, RST_PIN);


