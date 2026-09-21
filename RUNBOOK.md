# USIF — Final Run Order

Start in this order. Terminals 1-4 each run one process and stay open.
Terminal 5 is only for the anomaly demo (run on demand).

> ⚠️ Both the firmware (`MQTT_BROKER`) and the bridge (`MQTT_HOST`) point at
> **10.158.139.64**. If `ipconfig` shows a different Wi-Fi IPv4, update both and
> re-flash the board (see "If the IP changed").

---

## Terminal 1 — MQTT broker
```powershell
cd "C:\Program Files\mosquitto"
.\mosquitto.exe -c "$HOME\usif_mosquitto.conf" -v
```

## Terminal 2 — Backend
```powershell
cd C:\GIthub\usif\backend
venv\Scripts\Activate.ps1
uvicorn app.main:app --reload --port 8000
```
Wait for `Application startup complete`.

## Terminal 3 — Bridge  (ONE only)
```powershell
cd C:\GIthub\usif\backend
venv\Scripts\Activate.ps1
python mqtt_bridge.py
```
Wait for `[mqtt] connected ... subscribing to 'usif/telemetry'`.

## Terminal 4 — Frontend
```powershell
cd C:\GIthub\usif\frontend
npm run dev
```
Open http://localhost:5173.

## Then: power on the ESP32
Its Serial Monitor (115200) should show `[MQTT] published: {...}` every second.
Real sensor data appears on the dashboard as **TRUSTED**.

---

## Terminal 5 — Anomaly demo (on demand)
Only needs the backend (Terminal 2) running. Uses a dedicated `DEMO_TEMP_01`
sensor, so your real board sensors are untouched.
```powershell
cd C:\GIthub\usif\backend
venv\Scripts\Activate.ps1
python inject_anomaly.py suspicious    # one outlier      -> SUSPICIOUS
python inject_anomaly.py malicious     # run of outliers  -> escalates to MALICIOUS
python inject_anomaly.py normal        # baseline         -> TRUSTED
```
Watch the Investigation / Alerts pages.

Verdict logic: outlier value once = SUSPICIOUS; **3+ consecutive** outliers from a
sensor = MALICIOUS; in-range values = TRUSTED. (Tune `CONSISTENT_OUTLIER_STREAK`
in `app/investigation/investigation_engine.py`.)

---

## Do NOT
- Do **not** run `demo_publisher.py` (fake board data).
- Do **not** start a second bridge (doubles readings).

## Verify board data is live (spare terminal)
```powershell
cd "C:\Program Files\mosquitto"
.\mosquitto_sub.exe -h 10.158.139.64 -t usif/telemetry -v
```
Expect `"device":"ESP32_USIF_01"`.

## Clean slate (optional, before a fresh demo)
```powershell
# stop the backend (Ctrl+C in Terminal 2) AND the bridge (Ctrl+C in Terminal 3) first
cd C:\GIthub\usif\backend
del usif.db
venv\Scripts\python.exe -m app.database.init_db
# then restart Terminal 2 (backend) and Terminal 3 (bridge)
```

## If the IP changed (dashboard empty, board says "published")
1. `ipconfig` -> new IPv4 of the Wi-Fi adapter.
2. `usif_file.ino`: set `MQTT_BROKER` to the new IP, re-upload.
3. `backend/mqtt_bridge.py`: set `MQTT_HOST` to the same IP, restart the bridge.

## Kill stray processes
```powershell
Get-CimInstance Win32_Process -Filter "Name='python.exe'" | Where-Object { $_.CommandLine -match 'mqtt_bridge|demo_publisher' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force }
```
