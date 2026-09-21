"""
USIF MQTT -> Backend bridge  (local-host integration, no backend changes)

Flow:
    ESP32  --publish JSON-->  Mosquitto (usif/telemetry)
                                   |
                          this bridge (subscribe)
                                   |
                    HTTP POST to the existing /readings API
                                   |
                     investigation pipeline + dashboard

The ESP32 sends ONE JSON packet with several sensor fields. The backend, by
design, stores ONE Reading per sensor_id. So this bridge fans the packet out
into one /readings call per field, using the sensor map below. It also
auto-registers each sensor on startup (idempotent — a 400 "already exists" is
ignored).

Run (with the backend already running on :8000):
    pip install paho-mqtt requests
    python mqtt_bridge.py
"""

import json
import time
import requests
import paho.mqtt.client as mqtt

# ----------------------------- CONFIG ------------------------------------
API_BASE   = "http://127.0.0.1:8000"     # the FastAPI backend
MQTT_HOST  = "10.158.139.64"              # broker on the LAN IP (same one the ESP32 connects to)
MQTT_PORT  = 1883
MQTT_TOPIC = "usif/telemetry"
LOCATION   = "Lab_1"                      # all these sensors share one location

# Map each JSON field from the ESP32 -> (sensor_id, sensor_type)
# sensor_type must contain a keyword the physical checker understands
# (temp / humid / press / vib). "distance" falls back to the generic bounds.
SENSOR_MAP = {
    "dht_temp":    ("USIF_DHT_TEMP",  "temperature"),
    "humidity":    ("USIF_HUMIDITY",  "humidity"),
    "ds_temp":     ("USIF_DS_TEMP",   "temperature"),
    "distance_cm": ("USIF_DISTANCE",  "distance"),
    "vibration":   ("USIF_VIBRATION", "vibration"),
    "mpu_temp":    ("USIF_MPU_TEMP",  "temperature"),
}
# -------------------------------------------------------------------------


def register_all_sensors():
    """POST /register-sensor for each mapped sensor. Ignores 'already exists'."""
    for field, (sensor_id, sensor_type) in SENSOR_MAP.items():
        try:
            r = requests.post(
                f"{API_BASE}/register-sensor",
                json={"sensor_id": sensor_id,
                      "sensor_type": sensor_type,
                      "location": LOCATION},
                timeout=5,
            )
            if r.status_code == 200:
                print(f"[register] {sensor_id} ({sensor_type}) -> OK")
            elif r.status_code == 400:
                print(f"[register] {sensor_id} -> already registered")
            else:
                print(f"[register] {sensor_id} -> HTTP {r.status_code}: {r.text}")
        except requests.RequestException as e:
            print(f"[register] {sensor_id} -> backend unreachable: {e}")


def post_reading(sensor_id: str, value: float):
    """Forward one value to the existing /readings endpoint and print the verdict."""
    try:
        r = requests.post(
            f"{API_BASE}/readings",
            json={"sensor_id": sensor_id, "value": value, "raw_value": value},
            timeout=5,
        )
        if r.status_code == 200:
            inv = r.json().get("investigation", {})
            print(f"  -> {sensor_id:16s} = {value:<8} "
                  f"[{inv.get('final_decision')}, score={inv.get('evidence_score')}]")
        else:
            print(f"  -> {sensor_id}: HTTP {r.status_code}: {r.text}")
    except requests.RequestException as e:
        print(f"  -> {sensor_id}: backend unreachable: {e}")


def on_connect(client, userdata, flags, rc, *args):
    if rc == 0:
        print(f"[mqtt] connected to {MQTT_HOST}:{MQTT_PORT}, subscribing to '{MQTT_TOPIC}'")
        client.subscribe(MQTT_TOPIC)
    else:
        print(f"[mqtt] connect failed rc={rc}")


def on_message(client, userdata, msg):
    try:
        data = json.loads(msg.payload.decode("utf-8"))
    except (ValueError, UnicodeDecodeError) as e:
        print(f"[mqtt] bad payload ({e}): {msg.payload!r}")
        return

    device = data.get("device", "?")
    print(f"[packet] from {device}: {data}")

    for field, (sensor_id, _type) in SENSOR_MAP.items():
        value = data.get(field)
        if value is None:          # sensor error / not present -> skip
            continue
        post_reading(sensor_id, float(value))


def main():
    print("USIF MQTT bridge starting...")
    register_all_sensors()

    # paho-mqtt 2.x requires a callback API version; 1.x has no such enum.
    try:
        client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION1)
    except AttributeError:
        client = mqtt.Client()
    client.on_connect = on_connect
    client.on_message = on_message

    while True:
        try:
            client.connect(MQTT_HOST, MQTT_PORT, keepalive=60)
            break
        except OSError as e:
            print(f"[mqtt] broker not reachable ({e}); retrying in 3s...")
            time.sleep(3)

    client.loop_forever()


if __name__ == "__main__":
    main()
