from sqlalchemy import func
from sqlalchemy.orm import Session
from app.database.models import Sensor, Reading
from datetime import datetime, timezone, timedelta

def check_cross_validation(
    db: Session, 
    current_sensor_id: int, 
    location: str | None, 
    sensor_type: str | None, 
    value: float | None
) -> str:
    """
    Compares the current sensor's value with other active sensors of the same type in the same location.
    Returns "PASS", "SUSPICIOUS", or "N/A".
    """
    if not location or not sensor_type or value is None:
        return "N/A"

    # Fetch other active sensors in the same location of the same type
    other_sensors = db.query(Sensor).filter(
        Sensor.id != current_sensor_id,
        func.lower(Sensor.location) == location.lower(),
        func.lower(Sensor.sensor_type) == sensor_type.lower(),
        Sensor.status == "ACTIVE"
    ).all()
    
    if not other_sensors:
        return "N/A"
        
    other_sensor_ids = [s.id for s in other_sensors]
    
    # Fetch readings for these sensors from the last 5 minutes
    five_minutes_ago = datetime.now(timezone.utc) - timedelta(minutes=5)
    
    recent_readings = []
    for s_id in other_sensor_ids:
        r = db.query(Reading).filter(
            Reading.sensor_fk == s_id,
            Reading.timestamp >= five_minutes_ago
        ).order_by(Reading.id.desc()).first()
        if r and r.value is not None:
            recent_readings.append(r.value)
            
    if not recent_readings:
        return "N/A"
        
    # Calculate average of neighboring sensors
    avg_neighbor_val = sum(recent_readings) / len(recent_readings)
    deviation = abs(value - avg_neighbor_val)
    
    st_lower = sensor_type.lower()
    max_deviation = 15.0
    if "temp" in st_lower:
        max_deviation = 8.0
    elif "humid" in st_lower:
        max_deviation = 15.0
    elif "press" in st_lower:
        max_deviation = 30.0
    elif "vib" in st_lower:
        max_deviation = 100.0
        
    if deviation > max_deviation:
        return "SUSPICIOUS"
        
    return "PASS"
