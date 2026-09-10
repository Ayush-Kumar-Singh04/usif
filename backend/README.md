# USIF Backend Subsystem

The USIF backend is built with FastAPI, SQLAlchemy, and Pydantic. It provides REST APIs for device registration, telemetry ingestion, five-layer integrity analysis, audit trail logging, and system diagnostics.

---

## File Overview

### Root Configuration (`backend/`)

- `requirements.txt`: Python package dependencies including `fastapi`, `uvicorn`, `sqlalchemy`, `pydantic`, `psycopg2-binary`, and `python-dotenv`.
- `.env.example`: Sample database connection strings.
- `pyproject.toml`: Local project and tooling configuration.

---

### Core Application (`backend/app/`)

- `app/main.py`: Main FastAPI entry point. Configures CORS middleware, registers route handlers, and sets up health check endpoints.
- `app/config.py`: Loads environment variables and manages the database connection configuration.
- `app/__init__.py`: Package initialization marker.

---

### Database Layer (`backend/app/database/`)

- `app/database/database.py`: SQLAlchemy database engine configuration with automatic fallback to SQLite (`sqlite:///./usif.db`) when PostgreSQL is not configured.
- `app/database/models.py`: ORM models for:
  - `Sensor`: Metadata (`sensor_id`, `sensor_type`, `location`, `status`, `installation_date`).
  - `Reading`: Telemetry values (`sensor_fk`, `value`, `raw_value`, `timestamp`).
  - `InvestigationResult`: Security diagnostic breakdown (`reading_id`, individual checker results, final verdict, threat score).
  - `Recommendation`: Maintenance alerts and suggested mitigations.
- `app/database/schemas.py`: Pydantic request and response schemas.
- `app/database/init_db.py`: Database table initialization utility.

---

### API Routes (`backend/app/api/`)

- `app/api/health_routes.py`: Returns database connectivity status and overall system health.
- `app/api/sensor_routes.py`: Endpoints for registering new sensors, retrieving sensor lists, and querying fleet statistics.
- `app/api/reading_routes.py`: Endpoints for submitting sensor telemetry, fetching historical readings, and reviewing investigation audit logs.
- `app/api/recommendation_routes.py`: Endpoints for reviewing and resolving active sensor alerts.

---

### Anomaly Engine (`backend/app/investigation/`)

- `app/investigation/identity_checker.py`: Validates that the transmitting sensor is registered and currently active.
- `app/investigation/physical_checker.py`: Validates readings against expected physical ranges (e.g. Temperature: -40 to 85 deg C, Humidity: 0 to 100%).
- `app/investigation/history_checker.py`: Evaluates the rate of change relative to the preceding reading.
- `app/investigation/behaviour_checker.py`: Analyzes a sliding window of readings to detect stuck sensors (zero variance) or excessive noise.
- `app/investigation/cross_validator.py`: Compares readings against active sensors of the same type in the same area.
- `app/investigation/investigation_engine.py`: Orchestrates all five checks, computes threat scores, determines verdicts (`TRUSTED`, `SUSPICIOUS`, `MALICIOUS`), and saves diagnostic results.

---

### Recommendation Engine (`backend/app/recommendation/`)

- `app/recommendation/recommendation_engine.py`: Translates failed check conditions into human-readable maintenance recommendations and sets sensor status to degraded when necessary.
