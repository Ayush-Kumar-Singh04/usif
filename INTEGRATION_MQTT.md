# Live ESP32 Data → Dashboard via MQTT (local-host)

This wires the **real ESP32 sensor data** into the existing platform without
changing any backend logic. The bridge simply forwards MQTT messages to the
backend's existing `/readings` API, so the full 5-stage investigation pipeline
and the dashboard work exactly as before — just with real data instead of the
simulator.

```
ESP32  --MQTT publish-->  Mosquitto broker  -->  mqtt_bridge.py  --HTTP POST-->  /readings  -->  DB  -->  dashboard
```

## Pieces

| Piece | What it does | Changed? |
|-------|--------------|----------|
| `usif_file.ino` (firmware) | now also publishes a JSON packet to topic `usif/telemetry` | **additive only** |
| Mosquitto | local MQTT broker on your PC | new (install) |
| `backend/mqtt_bridge.py` | subscribes, fans the packet into per-sensor `/readings` calls, auto-registers sensors | new file |
| backend (`app/…`) | ingestion + investigation + dashboard | **unchanged** |

The ESP32 sends one packet with many fields; the backend stores one Reading per
`sensor_id`, so the bridge splits it into these sensors (edit `SENSOR_MAP` in
`mqtt_bridge.py` to taste):

| JSON field | sensor_id | type |
|---|---|---|
| `dht_temp` | USIF_DHT_TEMP | temperature |
| `humidity` | USIF_HUMIDITY | humidity |
| `ds_temp` | USIF_DS_TEMP | temperature |
| `distance_cm` | USIF_DISTANCE | distance |
| `vibration` | USIF_VIBRATION | vibration |
| `mpu_temp` | USIF_MPU_TEMP | temperature |

> Bonus: `USIF_DHT_TEMP` and `USIF_DS_TEMP` are both `temperature` in `Lab_1`,
> so the **cross-validation** stage actually compares them against each other.

---

## Step 1 — Install & start Mosquitto (broker)

**Windows:** download the installer from https://mosquitto.org/download/ and install.
Then create a config that allows local connections. In an **admin** PowerShell:

```powershell
# in the Mosquitto install dir, e.g. C:\Program Files\mosquitto
"listener 1883 0.0.0.0`nallow_anonymous true" | Out-File -Encoding ascii dev.conf
.\mosquitto.exe -c dev.conf -v
```

`allow_anonymous true` is fine for a temporary local demo only. Leave this
window running — it's your broker.

Find your PC's LAN IP (the ESP32 needs it):

```bash
ipconfig
```
Look for the IPv4 Address on your active adapter, e.g. `192.168.1.50`.

## Step 2 — Point the firmware at your network + broker

In `usif_file.ino`, fill the three values at the top of the NETWORK / MQTT CONFIG block:

```cpp
const char* WIFI_SSID     = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";
const char* MQTT_BROKER   = "192.168.1.50";   // <-- your PC's LAN IP from ipconfig
```

Install the two new Arduino libraries (Tools → Manage Libraries): **PubSubClient**
(Nick O'Leary) and **U8g2** (oliver). Then upload. The ESP32 and PC must be on
the **same Wi-Fi network**.

On the Serial Monitor you should see `[WiFi] connected` then `[MQTT] published: {...}`
every second, and the Mosquitto window (`-v`) will show the messages arriving.

## Step 3 — Start the backend (unchanged)

```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python -m app.database.init_db
uvicorn app.main:app --reload --port 8000
```

## Step 4 — Run the bridge

In another terminal:

```bash
cd backend
pip install paho-mqtt requests
python mqtt_bridge.py
```

It auto-registers the six sensors, then prints each forwarded reading with its
verdict, e.g.:

```
[packet] from ESP32_USIF_01: {'dht_temp': 24.5, ...}
  -> USIF_DHT_TEMP    = 24.5     [TRUSTED, score=0.0]
  -> USIF_HUMIDITY    = 40.1     [TRUSTED, score=0.0]
```

## Step 5 — Watch the dashboard

Start the frontend (`cd frontend && npm run dev`) and open it. Real readings now
appear on the Dashboard / Sensors / Investigation views. You can stop using the
Simulator page — that was the source of the random values.

---

## Quick test without the ESP32

You can prove the whole chain with just Mosquitto + bridge + backend by
publishing a fake packet:

```bash
mosquitto_pub -h 127.0.0.1 -t usif/telemetry -m "{\"device\":\"TEST\",\"dht_temp\":24.5,\"humidity\":41,\"distance_cm\":88}"
```

The bridge should log three forwarded readings and they'll show on the dashboard.

## Notes / gotchas

- **`distance` sensor type** uses the backend's generic ±1000 bound, so real
  distances (2–400 cm) pass fine. `vibration` is the accel-vector magnitude
  (~1.0 at rest), well inside the 0–500 vibration bound.
- The firmware sends `null` for a failed sensor (DHT error, no echo); the bridge
  **skips** null fields, so bad reads never reach the pipeline.
- Everything is localhost. To move off localhost later, run Mosquitto on a
  reachable host, set `MQTT_BROKER` (firmware) and `MQTT_HOST` (bridge)
  accordingly, and add real broker auth instead of `allow_anonymous`.
