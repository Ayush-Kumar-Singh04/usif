"""
USIF demo publisher — fakes a live ESP32 for demos/testing.

Publishes a realistic, slowly-changing telemetry packet to the same MQTT topic
the ESP32 uses (usif/telemetry) every second. The existing bridge picks it up,
so the whole pipeline + dashboard update live with fresh timestamps — no board
required.

Every ~15th packet it sends an out-of-range temperature so you can SHOW the
5-stage detection flagging a SUSPICIOUS / MALICIOUS reading on the dashboard.

Run (with Mosquitto + backend + bridge already running):
    pip install paho-mqtt
    python demo_publisher.py
Stop with Ctrl+C.
"""

import json
import math
import time
import random
import paho.mqtt.client as mqtt

MQTT_HOST  = "127.0.0.1"
MQTT_PORT  = 1883
MQTT_TOPIC = "usif/telemetry"

def make_client():
    # paho 2.x needs a callback API version; 1.x has no such enum.
    try:
        return mqtt.Client(mqtt.CallbackAPIVersion.VERSION1)
    except AttributeError:
        return mqtt.Client()

def main():
    client = make_client()
    client.connect(MQTT_HOST, MQTT_PORT, keepalive=60)
    client.loop_start()
    print(f"[demo] publishing to {MQTT_TOPIC} every 1s (Ctrl+C to stop)")

    t = 0
    try:
        while True:
            t += 1
            # gentle, realistic drift
            dht_temp = 24.0 + 1.5 * math.sin(t / 10.0) + random.uniform(-0.2, 0.2)
            humidity = 45.0 + 5.0 * math.sin(t / 15.0) + random.uniform(-0.5, 0.5)
            ds_temp  = 23.5 + 1.2 * math.sin(t / 12.0) + random.uniform(-0.2, 0.2)
            distance = 80.0 + 30.0 * math.sin(t / 8.0) + random.uniform(-2, 2)
            vibration = 1.0 + random.uniform(-0.05, 0.05)
            mpu_temp = 25.0 + random.uniform(-0.3, 0.3)

            # every ~15th packet: inject an anomaly to demo the detection engine
            if t % 15 == 0:
                dht_temp = 150.0   # far outside -40..85 -> physical check FAIL
                print("[demo] >>> injecting anomalous dht_temp=150 (should flag)")

            payload = {
                "device": "DEMO_ESP32",
                "dht_temp": round(dht_temp, 2),
                "humidity": round(humidity, 2),
                "ds_temp": round(ds_temp, 2),
                "distance_cm": round(distance, 2),
                "vibration": round(vibration, 3),
                "mpu_temp": round(mpu_temp, 2),
                "rssi": -55,
            }
            client.publish(MQTT_TOPIC, json.dumps(payload))
            print(f"[demo] t={t} sent dht={payload['dht_temp']} hum={payload['humidity']} dist={payload['distance_cm']}")
            time.sleep(1)
    except KeyboardInterrupt:
        print("\n[demo] stopped")
    finally:
        client.loop_stop()
        client.disconnect()

if __name__ == "__main__":
    main()
