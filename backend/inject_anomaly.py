"""
USIF demo injector — reproduce SUSPICIOUS / MALICIOUS verdicts on demand.

Manually spiking a real sensor during a demo is hard, so this posts crafted
readings to the backend for a DEDICATED demo sensor (DEMO_TEMP_01). Your real
board sensors are untouched.

It mirrors the engine's rule:
  - one outlier value                -> SUSPICIOUS
  - >= 3 consecutive outlier values  -> MALICIOUS

Usage (backend must be running on :8000):
    pip install requests
    python inject_anomaly.py normal        # baseline TRUSTED readings
    python inject_anomaly.py suspicious     # one outlier  -> SUSPICIOUS
    python inject_anomaly.py malicious      # a run of outliers -> escalates to MALICIOUS

Each scenario first sends an in-range reading to reset the outlier streak, so it
is deterministic no matter what was sent before.
"""

import sys
import time
import random
import requests

API_BASE   = "http://127.0.0.1:8000"
SENSOR_ID  = "DEMO_TEMP_01"
SENSOR_TYPE = "temperature"
LOCATION   = "Demo_Zone"

NORMAL_VALUE  = 24.0     # well inside -40..85
OUTLIER_VALUE = 150.0    # far outside physical bounds -> outlier


def ensure_sensor():
    try:
        r = requests.post(
            f"{API_BASE}/register-sensor",
            json={"sensor_id": SENSOR_ID, "sensor_type": SENSOR_TYPE, "location": LOCATION},
            timeout=5,
        )
        if r.status_code == 200:
            print(f"[setup] registered demo sensor {SENSOR_ID}")
        elif r.status_code == 400:
            print(f"[setup] demo sensor {SENSOR_ID} already exists")
        else:
            print(f"[setup] unexpected {r.status_code}: {r.text}")
    except requests.RequestException as e:
        print(f"[setup] backend unreachable at {API_BASE} — is it running? ({e})")
        sys.exit(1)


def send(value: float, label: str = ""):
    r = requests.post(
        f"{API_BASE}/readings",
        json={"sensor_id": SENSOR_ID, "value": value, "raw_value": value},
        timeout=5,
    )
    inv = r.json().get("investigation", {})
    decision = inv.get("final_decision", "?")
    score = inv.get("evidence_score", "?")
    tag = f" {label}" if label else ""
    print(f"  value={value:<7} -> {decision:10s} (threat={score}){tag}")
    return decision


def normal_value():
    # small jitter so identical values don't trip the stuck-at detector
    return round(NORMAL_VALUE + random.uniform(-0.4, 0.4), 2)


def warmup(n: int = 5):
    # fill the behaviour window with clean in-range readings so the sensor
    # starts from a TRUSTED baseline regardless of what was sent before
    print(f"[warmup] {n} in-range readings (expect TRUSTED)")
    for _ in range(n):
        send(normal_value(), "(warmup)")
        time.sleep(0.2)


def scenario_normal():
    warmup(3)


def scenario_suspicious():
    print("[suspicious] baseline, then ONE outlier (expect SUSPICIOUS)")
    warmup(3)
    send(OUTLIER_VALUE, "<-- isolated outlier")


def scenario_malicious():
    print("[malicious] baseline, then a RUN of outliers (expect escalation to MALICIOUS)")
    warmup(3)
    for i in range(1, 5):
        send(OUTLIER_VALUE, f"<-- consecutive outlier #{i}")
        time.sleep(0.3)


SCENARIOS = {
    "normal": scenario_normal,
    "suspicious": scenario_suspicious,
    "malicious": scenario_malicious,
}


def main():
    if len(sys.argv) != 2 or sys.argv[1] not in SCENARIOS:
        print("usage: python inject_anomaly.py [normal|suspicious|malicious]")
        sys.exit(2)
    ensure_sensor()
    SCENARIOS[sys.argv[1]]()
    print("done - check the dashboard's Investigation / Alerts pages.")


if __name__ == "__main__":
    main()
