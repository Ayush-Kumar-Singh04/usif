from sqlalchemy.orm import Session
from app.database.models import Sensor, Reading, InvestigationResult
from app.investigation.identity_checker import check_identity
from app.investigation.physical_checker import check_physical
from app.investigation.history_checker import check_history
from app.investigation.behaviour_checker import check_behaviour
from app.investigation.cross_validator import check_cross_validation

def run_investigation(db: Session, reading: Reading, sensor_id_str: str) -> InvestigationResult:
    """
    Orchestrates the running of all 5 sensor checks, computes the final decision
    and evidence score, saves it to the database, and returns the InvestigationResult.
    """
    # 1. Identity Check
    identity_res = check_identity(db, sensor_id_str)
    
    # Fetch sensor metadata for subsequent checks
    sensor = db.query(Sensor).filter(Sensor.sensor_id == sensor_id_str).first()
    
    if not sensor:
        # If no sensor exists, other checks fail or are not applicable
        physical_res = "FAIL"
        history_res = "N/A"
        behaviour_res = "N/A"
        cross_res = "N/A"
        evidence_score = 1.0
        final_decision = "MALICIOUS"
    else:
        # 2. Physical Check
        physical_res = check_physical(sensor.sensor_type, reading.value)
        
        # 3. History Check
        history_res = check_history(
            db, 
            sensor.id, 
            reading.value, 
            reading.timestamp, 
            sensor.sensor_type,
            reading.id
        )
        
        # 4. Behaviour Check
        behaviour_res = check_behaviour(db, sensor.id, reading.value, sensor.sensor_type)
        
        # 5. Cross Validation
        cross_res = check_cross_validation(
            db, 
            sensor.id, 
            sensor.location, 
            sensor.sensor_type, 
            reading.value
        )
        
        # Calculate Evidence Score & Final Decision
        evidence_score = 0.0
        
        if identity_res == "FAIL":
            evidence_score += 1.0
        else:
            # Accumulate scores for each anomaly
            if physical_res == "FAIL":
                evidence_score += 0.45
            
            if history_res == "FAIL":
                evidence_score += 0.35
            elif history_res == "SUSPICIOUS":
                evidence_score += 0.15
                
            if behaviour_res == "FAIL":
                evidence_score += 0.35
            elif behaviour_res == "SUSPICIOUS":
                evidence_score += 0.15
                
            if cross_res == "SUSPICIOUS":
                evidence_score += 0.30
                
        evidence_score = min(evidence_score, 1.0)
        
        if evidence_score >= 0.60:
            final_decision = "MALICIOUS"
        elif evidence_score >= 0.20:
            final_decision = "SUSPICIOUS"
        else:
            final_decision = "TRUSTED"

    # Create and save InvestigationResult
    result = InvestigationResult(
        reading_id=reading.id,
        identity_check=identity_res,
        physical_check=physical_res,
        history_check=history_res,
        behaviour_check=behaviour_res,
        cross_validation=cross_res,
        final_decision=final_decision,
        evidence_score=evidence_score
    )
    
    db.add(result)
    db.commit()
    db.refresh(result)
    
    return result
