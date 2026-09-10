import math
from sqlalchemy.orm import Session
from app.database.models import Reading

def check_behaviour(db: Session, sensor_fk: int, value: float | None, sensor_type: str | None) -> str:
    """
    Checks the sliding window of recent readings for stuck-at faults and noise faults.
    Returns "PASS", "SUSPICIOUS", or "FAIL".
    """
    if value is None or not sensor_type:
        return "PASS"

    # Fetch recent readings (up to 5, sorted by ID desc)
    recent_readings = db.query(Reading).filter(
        Reading.sensor_fk == sensor_fk
    ).order_by(Reading.id.desc()).limit(5).all()
    
    # We need a list of values including the current one.
    values = [r.value for r in recent_readings if r.value is not None]
    if not values or values[0] != value:
        values = [value] + values[:4]
        
    if len(values) < 5:
        return "PASS"
        
    # Check Stuck-At Fault (variance = 0)
    is_stuck = all(abs(val - values[0]) < 1e-6 for val in values)
    if is_stuck:
        return "FAIL"
        
    # Check Extreme Variance / Noise Fault
    mean = sum(values) / len(values)
    variance = sum((val - mean) ** 2 for val in values) / len(values)
    std_dev = math.sqrt(variance)
    
    st_lower = sensor_type.lower()
    max_std = 15.0
    if "temp" in st_lower:
        max_std = 8.0
    elif "humid" in st_lower:
        max_std = 15.0
    elif "press" in st_lower:
        max_std = 30.0
    elif "vib" in st_lower:
        max_std = 100.0
        
    if std_dev > max_std:
        return "SUSPICIOUS"
        
    return "PASS"
