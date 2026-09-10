# Unified Sensor Integrity Framework (USIF)

The Unified Sensor Integrity Framework (USIF) is an end-to-end telemetry verification and anomaly detection platform for IoT and cyber-physical systems. It continuously monitors, cross-validates, and scores incoming sensor readings to safeguard infrastructure against sensor spoofing, physical tampering, drift, stuck-at faults, and transmission errors.

---

## Why USIF?

Modern industrial and smart building systems make critical automated decisions based on raw sensor streams. However, individual sensors can fail silently, drift over time, suffer from wiring faults, or even be maliciously manipulated.

USIF addresses this vulnerability by placing a multi-tier verification layer between the raw edge hardware and the downstream control systems. Every telemetry packet undergoes a five-stage automated security check before it is deemed trusted.

---

## System Architecture

USIF connects physical edge nodes to a centralized analytics engine and an operations dashboard:

```
+------------------------+      HTTP POST      +-------------------------------+      REST API      +---------------------------------+
|   ESP32 Edge Node      | ------------------> |    FastAPI Python Backend     | -----------------> |       React Web Dashboard       |
|  Sensors, LCD, RGB     |   Telemetry JSON    |  5-Stage Anomaly Engine       |   Telemetry &      |  Real-time analytics, alerts,   |
|  Status & Audio Tone   |                     |  Database & Alert Manager     |   Audit Trails     |  threat logs & simulator        |
+------------------------+                     +-------------------------------+                    +---------------------------------+
```

- **Edge Firmware (`firmware/`)**: Runs on ESP32 microcontrollers. Reads physical sensors, packages JSON telemetry packets, sends them over Wi-Fi, and provides immediate physical feedback using status LEDs, LCD displays, and alert tones.
- **Backend & Investigation Engine (`backend/`)**: Built on FastAPI and SQLAlchemy. Ingests telemetry, executes the five-stage anomaly detection pipeline, records audit trails, and generates actionable maintenance alerts.
- **Operator Dashboard (`frontend/`)**: Built with React and Vite. Provides live sensor status, interactive telemetry charts, detailed inspection views for flagged readings, and an anomaly injection tool for testing.

---

## The 5-Stage Anomaly Detection Pipeline

Every incoming reading is evaluated through five independent validation stages:

1. **Identity Authorization**: Verifies that the sensor exists in the system registry and is currently marked active.
2. **Physical Bounds**: Validates that readings fall within realistic physical limits for that specific sensor type (e.g., -40 deg C to 85 deg C for temperature).
3. **Historical Continuity**: Checks the rate of change between consecutive readings to catch impossible jumps or abrupt spikes.
4. **Behavioral Variance**: Evaluates a sliding window of recent readings to detect stuck-at faults (zero variance) or excessive noise.
5. **Spatial Cross-Validation**: Compares the reading against active neighboring sensors of the same type in the same zone or room to catch localized drift or tampering.

A weighted threat score (0.0 to 1.0) and final verdict (`TRUSTED`, `SUSPICIOUS`, `MALICIOUS`) are computed. If a sensor fails key checks, it is automatically flagged, downgraded to a degraded state, and surfaced on the recommendations board.

---

## Repository Structure

```
USIF/
├── backend/                  # FastAPI service, database models, and anomaly engine
│   ├── app/
│   │   ├── api/              # REST route controllers (health, sensors, readings, alerts)
│   │   ├── database/         # Database connection, ORM models, schemas, and migrations
│   │   ├── investigation/    # 5-stage validation checks and scoring engine
│   │   └── recommendation/   # Automated alert and mitigation generator
│   ├── requirements.txt      # Python dependencies
│   └── .env.example          # Sample environment variables
├── frontend/                 # React single-page application (SPA)
│   ├── src/
│   │   ├── components/       # UI building blocks and sidebar navigation
│   │   ├── pages/            # Dashboard, Sensors, Analytics, Investigation, Alerts, Simulator
│   │   └── services/         # Axios API client
│   ├── package.json          # Node dependencies
│   └── vite.config.js        # Vite build configuration
├── firmware/                 # ESP32 edge device code
│   └── USIF_Firmware/        # Arduino C++ sketch and modular drivers
├── hardware/                 # Schematics, wiring diagrams, and component datasheets
│   └── circuit_diagram.pdf   # Complete ESP32 and peripheral wiring schematic
├── testing/                  # Test logs and sensor drift datasets
└── docs/                     # SRS documentation, research papers, and technical guides
```

---

## Getting Started

### Prerequisites

- **Python 3.10+**
- **Node.js 18+** and **npm**
- **PostgreSQL** (optional; SQLite is supported out of the box for quick local testing)
- **Arduino IDE** (only required for flashing physical ESP32 boards)

---

### 1. Setting Up the Backend

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create and activate a Python virtual environment:
   ```bash
   # On macOS / Linux:
   python3 -m venv venv
   source venv/bin/activate

   # On Windows (PowerShell):
   python -m venv venv
   .\venv\Scripts\Activate.ps1
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Configure environment variables:
   ```bash
   cp .env.example .env
   ```
   *(By default, if PostgreSQL is not configured, USIF will automatically fall back to local SQLite at `sqlite:///./usif.db`)*

5. Initialize database tables:
   ```bash
   python -m app.database.init_db
   ```

6. Start the API server:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```
   The interactive Swagger documentation will be available at [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs).

---

### 2. Setting Up the Frontend Dashboard

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:5173](http://localhost:5173) in your browser.

---

### 3. Flashing the Firmware (Optional - Hardware Setup)

1. Open `firmware/USIF_Firmware/USIF_Firmware.ino` in the Arduino IDE.
2. Update Wi-Fi credentials and server endpoint in `config.h`:
   ```cpp
   #define WIFI_SSID "Your_Network_Name"
   #define WIFI_PASSWORD "Your_Password"
   #define SERVER_URL "http://192.168.1.100:8000/readings"
   #define SENSOR_ID "ESP32_TEMP_01"
   ```
3. Connect your ESP32 board and upload the sketch.
4. Follow the pinout reference in `hardware/README.md` to connect the sensor, I2C LCD, RGB status LED, and buzzer.

---

## Testing Anomaly Ingestion

You can test the entire pipeline without hardware using the built-in simulator in the frontend under **Simulator / Settings**, or directly using `curl`:

```bash
# Register a test sensor
curl -X POST http://127.0.0.1:8000/register-sensor \
  -H "Content-Type: application/json" \
  -d '{"sensor_id": "TEST_TEMP_01", "sensor_type": "temperature", "location": "Room_101"}'

# Submit a normal reading
curl -X POST http://127.0.0.1:8000/readings \
  -H "Content-Type: application/json" \
  -d '{"sensor_id": "TEST_TEMP_01", "value": 24.5, "raw_value": 24.5}'

# Submit an anomalous out-of-bounds reading
curl -X POST http://127.0.0.1:8000/readings \
  -H "Content-Type: application/json" \
  -d '{"sensor_id": "TEST_TEMP_01", "value": 150.0, "raw_value": 150.0}'
```

View the detailed diagnostic breakdown on the dashboard under **Investigation Logs**.

---

## License

This project is licensed under the terms described in the [LICENSE](LICENSE) file.
