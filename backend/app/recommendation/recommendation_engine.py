from sqlalchemy.orm import Session
from app.database.models import Sensor, Reading, InvestigationResult, Recommendation

def generate_recommendation(
    db: Session, 
    reading: Reading, 
    investigation: InvestigationResult, 
    sensor_id_str: str
) -> Recommendation | None:
    """
    Analyzes investigation results and generates actionable recommendations.
    Prevents duplicate alerts: if an active recommendation already exists for
    the same sensor with the same failure signature, no new alert is created.
    """
    if investigation.final_decision == "TRUSTED":
        return None
        
    sensor = db.query(Sensor).filter(Sensor.sensor_id == sensor_id_str).first()
    sensor_type = sensor.sensor_type if sensor else "Unknown"
    location = sensor.location if sensor else "Unknown"
    
    # Build failure reasons with sensor-specific context
    reasons = []
    failure_keys = []
    
    if investigation.identity_check == "FAIL":
        reasons.append(f"unregistered device ID '{sensor_id_str}' attempted to transmit data")
        failure_keys.append("identity")
        
    if investigation.physical_check == "FAIL":
        unit = _get_unit(sensor_type)
        reasons.append(f"reported value {reading.value}{unit} exceeds {sensor_type.lower()} operational limits")
        failure_keys.append("physical")
        
    if investigation.history_check == "FAIL":
        reasons.append(f"value jumped abnormally from previous reading (abrupt transition)")
        failure_keys.append("history_fail")
    elif investigation.history_check == "SUSPICIOUS":
        reasons.append(f"value changed faster than expected between consecutive readings")
        failure_keys.append("history_warn")
        
    if investigation.behaviour_check == "FAIL":
        reasons.append(f"sensor is reporting identical values repeatedly (stuck-at fault)")
        failure_keys.append("behaviour_fail")
    elif investigation.behaviour_check == "SUSPICIOUS":
        reasons.append(f"high variance detected across recent readings (noise fault)")
        failure_keys.append("behaviour_warn")
        
    if investigation.cross_validation == "SUSPICIOUS":
        reasons.append(f"reading deviates from other {sensor_type.lower()} sensors at {location}")
        failure_keys.append("cross")
        
    if not reasons:
        reasons.append("abnormal telemetry pattern detected")
        failure_keys.append("general")

    # Build a failure signature to detect duplicates. Include the decision so a
    # SUSPICIOUS alert doesn't suppress the later MALICIOUS escalation (same checks
    # fail, but it's a distinct, more severe event worth surfacing).
    failure_sig = investigation.final_decision + ":" + "|".join(sorted(failure_keys))
    
    # Check if an active recommendation already exists for this sensor
    # with the same failure signature (embedded in the recommendation text)
    existing = db.query(Recommendation).filter(
        Recommendation.sensor_id == sensor_id_str
    ).all()
    
    for ex in existing:
        # Extract the existing failure signature from stored text
        if hasattr(ex, 'recommendation') and f"[{failure_sig}]" in ex.recommendation:
            # Duplicate — skip creating a new alert
            return None
    
    reason_str = "; ".join(reasons)
    
    priority = "LOW"
    if investigation.final_decision == "MALICIOUS":
        priority = "HIGH"
        rec_text = (
            f"Sensor '{sensor_id_str}' ({sensor_type} at {location}) flagged as MALICIOUS: "
            f"{reason_str}. "
            f"Quarantine the device, verify firmware integrity, and inspect physical connections. "
            f"[{failure_sig}]"
        )
    else:
        anomaly_count = sum(1 for c in [
            investigation.physical_check,
            investigation.history_check,
            investigation.behaviour_check,
            investigation.cross_validation
        ] if c in ["FAIL", "SUSPICIOUS"])
        
        if anomaly_count > 1:
            priority = "MEDIUM"
        
        rec_text = (
            f"Sensor '{sensor_id_str}' ({sensor_type} at {location}) flagged as SUSPICIOUS: "
            f"{reason_str}. "
            f"Schedule calibration check and verify sensor environment. "
            f"[{failure_sig}]"
        )
        
    recommendation = Recommendation(
        sensor_id=sensor_id_str,
        recommendation=rec_text,
        priority=priority
    )
    
    db.add(recommendation)
    db.commit()
    db.refresh(recommendation)
    
    # Update sensor status to DEGRADED if it's currently ACTIVE and priority warrants it
    if sensor and sensor.status == "ACTIVE" and priority in ["HIGH", "MEDIUM"]:
        sensor.status = "DEGRADED"
        db.commit()
        
    return recommendation


def _get_unit(sensor_type: str) -> str:
    """Returns the appropriate unit string for a sensor type."""
    st = sensor_type.lower()
    if "temp" in st:
        return "°C"
    elif "humid" in st:
        return "%"
    elif "press" in st:
        return " hPa"
    elif "vib" in st:
        return " units"
    return ""

