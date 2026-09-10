from sqlalchemy.orm import Session
from app.database.models import Sensor

def check_identity(db: Session, sensor_id: str) -> str:
    """
    Verifies if the sensor is registered in the system and is operational.
    ACTIVE and DEGRADED sensors pass (they are known devices).
    Only unregistered or explicitly INACTIVE sensors fail.
    Returns "PASS" or "FAIL".
    """
    sensor = db.query(Sensor).filter(Sensor.sensor_id == sensor_id).first()
    if not sensor:
        return "FAIL"
    if sensor.status in ("ACTIVE", "DEGRADED"):
        return "PASS"
    return "FAIL"

