from sqlalchemy.orm import Session
from app.database.models import Reading
from datetime import datetime

def check_history(
    db: Session, 
    sensor_fk: int, 
    value: float | None, 
    timestamp: datetime | None, 
    sensor_type: str | None, 
    current_reading_id: int | None = None
) -> str:
    """
    Evaluates if the rate of change or raw difference between the current reading
    and the previous reading exceeds normal physical transitions.
    Returns "PASS", "SUSPICIOUS", or "FAIL".
    """
    if value is None or not timestamp or not sensor_type:
        return "PASS"

    # Fetch the most recent reading before this reading ID (or timestamp)
    query = db.query(Reading).filter(Reading.sensor_fk == sensor_fk)
    if current_reading_id is not None:
        query = query.filter(Reading.id < current_reading_id)
    else:
        query = query.filter(Reading.timestamp < timestamp)

    prev_reading = query.order_by(Reading.id.desc()).first()
    
    if not prev_reading or prev_reading.value is None or not prev_reading.timestamp:
        return "PASS"
        
    val_diff = abs(value - prev_reading.value)
    time_diff = (timestamp - prev_reading.timestamp).total_seconds()
    
    st_lower = sensor_type.lower()
    
    # Define thresholds
    max_rate = 5.0    # units per second
    max_jump = 15.0   # absolute difference
    
    if "temp" in st_lower:
        max_rate = 3.0    # 3°C per second
        max_jump = 10.0   # 10°C absolute jump
    elif "humid" in st_lower:
        max_rate = 5.0    # 5% per second
        max_jump = 20.0   # 20% absolute jump
    elif "press" in st_lower:
        max_rate = 15.0   # 15 hPa per second
        max_jump = 40.0   # 40 hPa absolute jump
    elif "vib" in st_lower:
        max_rate = 80.0   # 80 units per second
        max_jump = 150.0  # 150 units absolute jump

    # Check absolute jump first
    if val_diff > max_jump:
        return "FAIL"
        
    # Check rate of change if time difference is significant
    if time_diff > 0.1:
        rate = val_diff / time_diff
        if rate > max_rate:
            return "SUSPICIOUS"
            
    return "PASS"
