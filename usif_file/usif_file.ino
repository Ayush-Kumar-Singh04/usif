#include <Arduino.h>
#include <Wire.h>
#include <U8g2lib.h>
#include <DHT.h>
#include <OneWire.h>
#include <DallasTemperature.h>
#include <WiFi.h>
#include <PubSubClient.h>

// =====================================================
// DHT22
// =====================================================

#define DHT_PIN 16
#define DHT_TYPE DHT22

DHT dht(DHT_PIN, DHT_TYPE);


// =====================================================
// DS18B20
// =====================================================

#define DS18B20_PIN 19

OneWire oneWire(DS18B20_PIN);
DallasTemperature ds18b20(&oneWire);


// =====================================================
// Ultrasonic
// =====================================================

#define TRIG_PIN 32
#define ECHO_PIN 35


// =====================================================
// MPU6050
// =====================================================

#define MPU_ADDR 0x68

#define PWR_MGMT_1 0x6B
#define ACCEL_XOUT_H 0x3B
#define TEMP_OUT_H 0x41
#define GYRO_XOUT_H 0x43


// =====================================================
// OLED - Waveshare 1.32" SSD1327 128x96 SPI
// =====================================================

#define OLED_CLK 18
#define OLED_MOSI 23
#define OLED_CS 5
#define OLED_DC 2
#define OLED_RST 4

U8G2_SSD1327_VISIONOX_128X96_F_4W_SW_SPI oled(
  U8G2_R0,
  OLED_CLK,
  OLED_MOSI,
  OLED_CS,
  OLED_DC,
  OLED_RST
);


// =====================================================
// NETWORK / MQTT CONFIG   (fill in the 3 values marked <--)
// =====================================================

const char* WIFI_SSID     = "SohamA55";       // <-- your Wi-Fi name
const char* WIFI_PASSWORD = "pahp2929";   // <-- your Wi-Fi password
const char* MQTT_BROKER   = "10.158.139.64";         // <-- LAN IP of the PC running Mosquitto
const uint16_t MQTT_PORT  = 1883;
const char* MQTT_TOPIC    = "usif/telemetry";
const char* DEVICE_ID     = "ESP32_USIF_01";

WiFiClient espClient;
PubSubClient mqtt(espClient);

void connectWiFi()
{
  if (WiFi.status() == WL_CONNECTED) return;
  Serial.print("[WiFi] connecting to ");
  Serial.println(WIFI_SSID);
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  unsigned long t0 = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - t0 < 10000)
  {
    delay(300);
    Serial.print(".");
  }
  Serial.println();
  if (WiFi.status() == WL_CONNECTED)
  {
    Serial.print("[WiFi] connected, IP ");
    Serial.println(WiFi.localIP());
  }
  else
  {
    Serial.println("[WiFi] not connected (will retry in loop)");
  }
}

void ensureMqtt()
{
  if (mqtt.connected()) return;
  if (WiFi.status() != WL_CONNECTED) connectWiFi();
  if (WiFi.status() != WL_CONNECTED) return;

  int tries = 0;
  while (!mqtt.connected() && tries < 3)
  {
    String cid = String(DEVICE_ID) + "-" + String((uint32_t)ESP.getEfuseMac(), HEX);
    Serial.print("[MQTT] connecting... ");
    if (mqtt.connect(cid.c_str()))
    {
      Serial.println("connected");
    }
    else
    {
      Serial.print("failed rc=");
      Serial.println(mqtt.state());
      delay(500);
      tries++;
    }
  }
}

// Append  "key":value,   (or  "key":null,  when the reading is invalid)
static void addNum(String &s, const char* key, float v, bool valid)
{
  s += "\"";
  s += key;
  s += "\":";
  s += valid ? String(v, 2) : String("null");
  s += ",";
}

void publishTelemetry(float dhtTemp, float humidity, float dsTemp,
                      float distance, float vib, float mpuTemp)
{
  String p = "{";
  p += "\"device\":\"";
  p += DEVICE_ID;
  p += "\",";
  addNum(p, "dht_temp",    dhtTemp,  !isnan(dhtTemp));
  addNum(p, "humidity",    humidity, !isnan(humidity));
  addNum(p, "ds_temp",     dsTemp,   dsTemp != DEVICE_DISCONNECTED_C);
  addNum(p, "distance_cm", distance, distance >= 0);
  addNum(p, "vibration",   vib,      true);
  addNum(p, "mpu_temp",    mpuTemp,  true);
  p += "\"rssi\":";          // last field: no trailing comma
  p += String(WiFi.RSSI());
  p += "}";

  if (mqtt.publish(MQTT_TOPIC, p.c_str()))
  {
    Serial.print("[MQTT] published: ");
    Serial.println(p);
  }
  else
  {
    Serial.println("[MQTT] publish failed (payload too big? broker down?)");
  }
}


// =====================================================
// MPU FUNCTIONS
// =====================================================

void writeMPURegister(byte reg, byte value)
{
  Wire.beginTransmission(MPU_ADDR);
  Wire.write(reg);
  Wire.write(value);
  Wire.endTransmission();
}


int16_t readMPU16(byte reg)
{
  Wire.beginTransmission(MPU_ADDR);
  Wire.write(reg);
  Wire.endTransmission(false);

  Wire.requestFrom(MPU_ADDR, (byte)2);

  if (Wire.available() >= 2)
  {
    byte highByte = Wire.read();
    byte lowByte = Wire.read();

    return (int16_t)((highByte << 8) | lowByte);
  }

  return 0;
}


// =====================================================
// SETUP
// =====================================================

void setup()
{
  Serial.begin(115200);

  delay(1000);

  Serial.println();
  Serial.println("================================");
  Serial.println(" UNIVERSAL SENSOR TEST SYSTEM");
  Serial.println("================================");


  // ---------------------------------------------------
  // DHT22
  // ---------------------------------------------------

  dht.begin();

  Serial.println("DHT22 initialized");


  // ---------------------------------------------------
  // DS18B20
  // ---------------------------------------------------

  ds18b20.begin();

  Serial.println("DS18B20 initialized");


  // ---------------------------------------------------
  // Ultrasonic
  // ---------------------------------------------------

  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);

  digitalWrite(TRIG_PIN, LOW);

  Serial.println("Ultrasonic initialized");


  // ---------------------------------------------------
  // I2C / MPU6050
  // ---------------------------------------------------

  Wire.begin(21, 22);

  // Wake up MPU
  writeMPURegister(PWR_MGMT_1, 0x00);

  delay(100);

  Serial.println("MPU6050 initialized");


  // ---------------------------------------------------
  // OLED
  // ---------------------------------------------------

  oled.begin();

  oled.clearBuffer();

  oled.setFont(u8g2_font_6x12_tf);

  oled.drawStr(5, 15, "SENSOR SYSTEM");
  oled.drawStr(5, 32, "Initializing...");
  oled.drawStr(5, 49, "ESP32");

  oled.sendBuffer();

  delay(1500);

  Serial.println("OLED initialized");


  // ---------------------------------------------------
  // WiFi + MQTT
  // ---------------------------------------------------

  connectWiFi();
  mqtt.setServer(MQTT_BROKER, MQTT_PORT);
  mqtt.setBufferSize(512);   // default 256 is too small for our JSON

  Serial.println("Network initialized");

  Serial.println();
  Serial.println("SYSTEM READY");
}


// =====================================================
// LOOP
// =====================================================

void loop()
{

  // ===================================================
  // DHT22
  // ===================================================

  float dhtTemp = dht.readTemperature();
  float humidity = dht.readHumidity();


  // ===================================================
  // DS18B20
  // ===================================================

  ds18b20.requestTemperatures();

  float dsTemp = ds18b20.getTempCByIndex(0);


  // ===================================================
  // ULTRASONIC
  // ===================================================

  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);

  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);

  digitalWrite(TRIG_PIN, LOW);

  unsigned long duration = pulseIn(
    ECHO_PIN,
    HIGH,
    50000
  );

  float distance = -1;

  if (duration > 0)
  {
    distance = duration * 0.0343 / 2.0;
  }


  // ===================================================
  // MPU6050
  // ===================================================

  int16_t ax = readMPU16(ACCEL_XOUT_H);
  int16_t ay = readMPU16(ACCEL_XOUT_H + 2);
  int16_t az = readMPU16(ACCEL_XOUT_H + 4);

  int16_t mpuTempRaw = readMPU16(TEMP_OUT_H);

  int16_t gx = readMPU16(GYRO_XOUT_H);
  int16_t gy = readMPU16(GYRO_XOUT_H + 2);
  int16_t gz = readMPU16(GYRO_XOUT_H + 4);


  // Convert accelerometer
  float ax_g = ax / 16384.0;
  float ay_g = ay / 16384.0;
  float az_g = az / 16384.0;


  // Convert gyroscope
  float gx_dps = gx / 131.0;
  float gy_dps = gy / 131.0;
  float gz_dps = gz / 131.0;


  // Convert MPU temperature
  float mpuTemp = (mpuTempRaw / 340.0) + 36.53;


  // ===================================================
  // SERIAL OUTPUT
  // ===================================================

  Serial.println();
  Serial.println("================================");
  Serial.println("         SENSOR READINGS");
  Serial.println("================================");


  // DHT22

  Serial.println("--- DHT22 ---");

  if (isnan(dhtTemp) || isnan(humidity))
  {
    Serial.println("DHT22 ERROR");
  }
  else
  {
    Serial.print("Temperature : ");
    Serial.print(dhtTemp);
    Serial.println(" C");

    Serial.print("Humidity    : ");
    Serial.print(humidity);
    Serial.println(" %");
  }


  // DS18B20

  Serial.println("--- DS18B20 ---");

  if (dsTemp == DEVICE_DISCONNECTED_C)
  {
    Serial.println("DS18B20 ERROR");
  }
  else
  {
    Serial.print("Temperature : ");
    Serial.print(dsTemp);
    Serial.println(" C");
  }


  // Ultrasonic

  Serial.println("--- ULTRASONIC ---");

  if (distance < 0)
  {
    Serial.println("NO ECHO");
  }
  else
  {
    Serial.print("Distance    : ");
    Serial.print(distance);
    Serial.println(" cm");
  }


  // MPU

  Serial.println("--- MPU6050 ---");

  Serial.print("Accel X     : ");
  Serial.print(ax_g);
  Serial.println(" g");

  Serial.print("Accel Y     : ");
  Serial.print(ay_g);
  Serial.println(" g");

  Serial.print("Accel Z     : ");
  Serial.print(az_g);
  Serial.println(" g");

  Serial.print("Gyro X      : ");
  Serial.print(gx_dps);
  Serial.println(" deg/s");

  Serial.print("Gyro Y      : ");
  Serial.print(gy_dps);
  Serial.println(" deg/s");

  Serial.print("Gyro Z      : ");
  Serial.print(gz_dps);
  Serial.println(" deg/s");

  Serial.print("MPU Temp    : ");
  Serial.print(mpuTemp);
  Serial.println(" C");


  // ===================================================
  // OLED
  // ===================================================

  oled.clearBuffer();

  oled.setFont(u8g2_font_6x12_tf);

  oled.drawStr(2, 11, "SENSOR STATUS");

  // DS18B20
  oled.setCursor(2, 26);
  oled.print("DS:");
  
  if (dsTemp == DEVICE_DISCONNECTED_C)
  {
    oled.print("ERR");
  }
  else
  {
    oled.print(dsTemp, 1);
    oled.print("C");
  }


  // DHT22
  oled.setCursor(65, 26);
  oled.print("DHT:");

  if (isnan(dhtTemp))
  {
    oled.print("ERR");
  }
  else
  {
    oled.print(dhtTemp, 1);
    oled.print("C");
  }


  // Humidity
  oled.setCursor(2, 41);
  oled.print("H:");

  if (isnan(humidity))
  {
    oled.print("ERR");
  }
  else
  {
    oled.print(humidity, 0);
    oled.print("%");
  }


  // Ultrasonic
  oled.setCursor(65, 41);
  oled.print("D:");

  if (distance < 0)
  {
    oled.print("ERR");
  }
  else
  {
    oled.print(distance, 1);
    oled.print("cm");
  }


  // MPU acceleration
  oled.setCursor(2, 56);
  oled.print("AX:");
  oled.print(ax_g, 1);

  oled.setCursor(65, 56);
  oled.print("AY:");
  oled.print(ay_g, 1);


  oled.setCursor(2, 71);
  oled.print("AZ:");
  oled.print(az_g, 1);


  // Gyroscope
  oled.setCursor(65, 71);
  oled.print("GZ:");
  oled.print(gz_dps, 0);


  oled.drawFrame(0, 0, 128, 96);

  oled.sendBuffer();


  // ===================================================
  // PUBLISH TELEMETRY OVER MQTT
  // ===================================================

  float vibration = sqrt(ax_g * ax_g + ay_g * ay_g + az_g * az_g);  // ~1.0 at rest

  ensureMqtt();
  mqtt.loop();

  if (mqtt.connected())
  {
    publishTelemetry(dhtTemp, humidity, dsTemp, distance, vibration, mpuTemp);
  }


  delay(1000);
}