#include "config.h"
#include "wifi_manager.h"
#include "sensor_manager.h"
#include "packet_builder.h"
#include "http_sender.h"
#include "lcd_manager.h"
#include "led_manager.h"
#include "buzzer_manager.h"
#include "utils.h"

void setup() {
    Serial.begin(115200);
    Serial.println("USIF Firmware Initialized");
    setupWiFi();
    initSensors();
}

void loop() {
    float val = readSensorValue();
    String json = buildJsonPayload(SENSOR_ID, val);
    sendData(json);
    delay(5000);
}
