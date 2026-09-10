from fastapi import APIRouter, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.database.database import SessionLocal
from app.database.models import Sensor, Reading, InvestigationResult
from app.database.schemas import ReadingCreate
from app.investigation.investigation_engine import run_investigation
from app.recommendation.recommendation_engine import generate_recommendation

router = APIRouter()

@router.post("/readings")
def receive_reading(reading: ReadingCreate):
    db: Session = SessionLocal()
    
    # 1. Fetch the sensor metadata
    sensor = db.query(Sensor).filter(
        Sensor.sensor_id == reading.sensor_id
    ).first()

    if not sensor:
        db.close()
        raise HTTPException(
            status_code=404,
            detail=f"Sensor '{reading.sensor_id}' not found. Please register the sensor first."
        )

    # 2. Save the reading
    new_reading = Reading(
        sensor_fk=sensor.id,
        value=reading.value,
        raw_value=reading.raw_value
    )
    db.add(new_reading)
    db.commit()
    db.refresh(new_reading)

    # 3. Run sensor integrity investigation
    investigation = run_investigation(db, new_reading, sensor.sensor_id)
    
    # 4. Generate recommendations if reading is anomalous
    recommendation = None
    if investigation.final_decision != "TRUSTED":
        recommendation = generate_recommendation(db, new_reading, investigation, sensor.sensor_id)

    # Extract values before closing the session to prevent DetachedInstanceError
    reading_id = new_reading.id
    inv_id = investigation.id
    inv_decision = investigation.final_decision
    inv_score = investigation.evidence_score
    inv_identity = investigation.identity_check
    inv_physical = investigation.physical_check
    inv_history = investigation.history_check
    inv_behaviour = investigation.behaviour_check
    inv_cross = investigation.cross_validation
    has_rec = recommendation is not None

    db.close()

    return {
        "message": "Reading Stored",
        "reading_id": reading_id,
        "investigation": {
            "id": inv_id,
            "final_decision": inv_decision,
            "evidence_score": inv_score,
            "identity_check": inv_identity,
            "physical_check": inv_physical,
            "history_check": inv_history,
            "behaviour_check": inv_behaviour,
            "cross_validation": inv_cross
        },
        "recommendation_triggered": has_rec
    }

@router.get("/readings")
def get_readings():
    db: Session = SessionLocal()
    readings = db.query(Reading).order_by(desc(Reading.id)).all()
    
    result = []
    for r in readings:
        sensor = db.query(Sensor).filter(Sensor.id == r.sensor_fk).first()
        result.append({
            "id": r.id,
            "sensor_fk": r.sensor_fk,
            "sensor_id": sensor.sensor_id if sensor else "Unknown",
            "value": r.value,
            "raw_value": r.raw_value,
            "timestamp": r.timestamp
        })
    db.close()
    return result

@router.get("/investigations")
def get_investigations():
    db: Session = SessionLocal()
    
    # Perform outerjoin query to fetch investigations even for spoofed/unlinked readings
    results = db.query(InvestigationResult, Reading, Sensor).outerjoin(
        Reading, InvestigationResult.reading_id == Reading.id
    ).outerjoin(
        Sensor, Reading.sensor_fk == Sensor.id
    ).order_by(desc(InvestigationResult.id)).all()
    
    output = []
    for inv, reading, sensor in results:
        output.append({
            "id": inv.id,
            "reading_id": inv.reading_id,
            "sensor_id": sensor.sensor_id if sensor else (f"SPOOFED (Reading #{inv.reading_id})" if reading else "UNKNOWN"),
            "sensor_type": sensor.sensor_type if sensor else "Unknown",
            "location": sensor.location if sensor else "Unknown",
            "value": reading.value if reading else None,
            "raw_value": reading.raw_value if reading else None,
            "timestamp": reading.timestamp if reading else None,
            "identity_check": inv.identity_check,
            "physical_check": inv.physical_check,
            "history_check": inv.history_check,
            "behaviour_check": inv.behaviour_check,
            "cross_validation": inv.cross_validation,
            "final_decision": inv.final_decision,
            "evidence_score": inv.evidence_score
        })
        
    db.close()
    return output