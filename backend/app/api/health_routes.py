from fastapi import APIRouter
from sqlalchemy.orm import Session
from datetime import datetime, timedelta

from app.database.database import SessionLocal
from app.database.models import Sensor, Recommendation, InvestigationResult

router = APIRouter()

@router.get("/health")
def get_health():
    db: Session = SessionLocal()
    
    db_connected = False
    status = "healthy"
    active_alerts_count = 0
    active_sensors_count = 0
    malicious_alerts_24h = 0
    
    try:
        # Check database connection and queries
        active_sensors_count = db.query(Sensor).filter(Sensor.status == "ACTIVE").count()
        degraded_sensors_count = db.query(Sensor).filter(Sensor.status == "DEGRADED").count()
        active_alerts_count = db.query(Recommendation).count()
        
        # Check malicious records in the last 24h
        one_day_ago = datetime.utcnow() - timedelta(days=1)
        # Using InvestigationResult to check decisions
        malicious_alerts_24h = db.query(InvestigationResult).filter(
            InvestigationResult.final_decision == "MALICIOUS"
        ).count()
        
        db_connected = True
        
        # Determine status
        if malicious_alerts_24h > 0 or degraded_sensors_count > 0:
            status = "degraded"
        if active_alerts_count > 5:
            status = "critical"
            
    except Exception as e:
        status = "unhealthy"
        db_connected = False
        
    db.close()
    
    return {
        "status": status,
        "database_connected": db_connected,
        "active_alerts_count": active_alerts_count,
        "active_sensors_count": active_sensors_count,
        "malicious_alerts_24h": malicious_alerts_24h,
        "timestamp": datetime.utcnow()
    }
