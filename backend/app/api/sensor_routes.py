from fastapi import HTTPException
from fastapi import APIRouter
from sqlalchemy.orm import Session

from app.database.database import SessionLocal
from app.database.models import Sensor, Reading, Recommendation, InvestigationResult
from app.database.schemas import SensorCreate

router = APIRouter()

@router.post("/register-sensor")
def register_sensor(sensor: SensorCreate):
    db: Session = SessionLocal()

    new_sensor = Sensor(
        sensor_id=sensor.sensor_id,
        sensor_type=sensor.sensor_type,
        location=sensor.location,
        status="ACTIVE"
    )
    existing_sensor = db.query(Sensor).filter(
        Sensor.sensor_id == sensor.sensor_id
    ).first()

    if existing_sensor:
        db.close()
        raise HTTPException(
            status_code=400,
            detail="Sensor ID already exists"
        )
    db.add(new_sensor)
    db.commit()
    db.refresh(new_sensor)
    db.close()
    
    return {
        "message": "Sensor Registered",
        "id": new_sensor.id
    }

@router.get("/sensors")
def get_sensors():
    db: Session = SessionLocal()
    sensors = db.query(Sensor).all()
    result = []
    for s in sensors:
        result.append({
            "id": s.id,
            "sensor_id": s.sensor_id,
            "sensor_type": s.sensor_type,
            "location": s.location,
            "status": s.status,
            "installation_date": s.installation_date
        })
    db.close()
    return result

@router.get("/stats")
def get_stats():
    db: Session = SessionLocal()
    total_sensors = db.query(Sensor).count()
    active_sensors = db.query(Sensor).filter(Sensor.status == "ACTIVE").count()
    total_readings = db.query(Reading).count()
    
    # New integrity stats
    flagged_readings = db.query(InvestigationResult).filter(
        InvestigationResult.final_decision.in_(["SUSPICIOUS", "MALICIOUS"])
    ).count()
    active_alerts = db.query(Recommendation).count()
    critical_alerts = db.query(Recommendation).filter(Recommendation.priority == "HIGH").count()
    
    if total_sensors == 0:
        system_health = "No Sensors"
    elif critical_alerts > 0:
        system_health = "Critical"
    elif active_alerts > 0 or active_sensors < total_sensors:
        system_health = "Degraded"
    else:
        system_health = "Healthy"
        
    db.close()
    return {
        "total_sensors": total_sensors,
        "active_sensors": active_sensors,
        "total_readings": total_readings,
        "flagged_readings": flagged_readings,
        "active_alerts": active_alerts,
        "system_health": system_health
    }