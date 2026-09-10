from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.database.database import SessionLocal
from app.database.models import Recommendation, Sensor

router = APIRouter()

@router.get("/recommendations")
def get_recommendations():
    db: Session = SessionLocal()
    recommendations = db.query(Recommendation).order_by(desc(Recommendation.id)).all()
    
    result = []
    for r in recommendations:
        result.append({
            "id": r.id,
            "sensor_id": r.sensor_id,
            "recommendation": r.recommendation,
            "priority": r.priority,
            "created_at": r.created_at
        })
    db.close()
    return result

@router.delete("/recommendations/{id}")
def resolve_recommendation(id: int):
    db: Session = SessionLocal()
    
    rec = db.query(Recommendation).filter(Recommendation.id == id).first()
    if not rec:
        db.close()
        raise HTTPException(status_code=404, detail="Recommendation not found")
        
    sensor_id = rec.sensor_id
    
    db.delete(rec)
    db.commit()
    
    # Check if there are any remaining recommendations for this sensor
    remaining = db.query(Recommendation).filter(Recommendation.sensor_id == sensor_id).count()
    if remaining == 0:
        # Restore sensor status to ACTIVE
        sensor = db.query(Sensor).filter(Sensor.sensor_id == sensor_id).first()
        if sensor:
            sensor.status = "ACTIVE"
            db.commit()
            
    db.close()
    return {"message": "Recommendation resolved successfully"}
