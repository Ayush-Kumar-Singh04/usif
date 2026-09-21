from sqlalchemy.orm import Session
from app.database.models import Sensor, Reading, InvestigationResult
from app.investigation.identity_checker import check_identity
from app.investigation.physical_checker import check_physical
from app.investigation.history_checker import check_history
from app.investigation.behaviour_checker import check_behaviour
from app.investigation.cross_validator import check_cross_validation

# How many consecutive outlier readings a sensor must send before an isolated
# SUSPICIOUS reading escalates to MALICIOUS. i.e. one outlier = suspicious,
# a sustained run of outliers = malicious (a persistent attack/fault).
CONSISTENT_OUTLIER_STREAK = 3


def _consecutive_outlier_streak(db: Session, sensor_fk: int, sensor_type: str, lookback: int = 12) -> int:
    """
    Count how many of the most-recent readings for this sensor are consecutive
    physical-bounds outliers, counting back from the newest (which is the reading
    being investigated) and stopping at the first in-range value.

    1  -> an isolated outlier
    >= CONSISTENT_OUTLIER_STREAK -> a consistent run of outliers
    """
    recent = (
        db.query(Reading)
        .filter(Reading.sensor_fk == sensor_fk)
        .order_by(Reading.id.desc())
        .limit(lookback)
        .all()
    )
    streak = 0
    for r in recent:
        if check_physical(sensor_type, r.value) == "FAIL":
            streak += 1
        else:
            break
    return streak


def run_investigation(db: Session, reading: Reading, sensor_id_str: str) -> InvestigationResult:
    """
    Runs the 5 checks, then decides the verdict on an outlier-persistence model:

      - identity fails (unregistered device)          -> MALICIOUS
      - value is an outlier (out of physical bounds):
            * isolated (short streak)                  -> SUSPICIOUS
            * consistent (>= CONSISTENT_OUTLIER_STREAK)-> MALICIOUS
      - value in range but statistically odd
        (spike / noise / disagrees with neighbours)    -> SUSPICIOUS
      - otherwise                                       -> TRUSTED
    """
    # 1. Identity Check
    identity_res = check_identity(db, sensor_id_str)

    # Fetch sensor metadata for subsequent checks
    sensor = db.query(Sensor).filter(Sensor.sensor_id == sensor_id_str).first()

    if not sensor:
        # No such sensor -> nothing else is applicable
        physical_res = "FAIL"
        history_res = "N/A"
        behaviour_res = "N/A"
        cross_res = "N/A"
        evidence_score = 1.0
        final_decision = "MALICIOUS"
    else:
        # 2-5. Run the remaining checks (still shown in the audit trail)
        physical_res = check_physical(sensor.sensor_type, reading.value)
        history_res = check_history(
            db, sensor.id, reading.value, reading.timestamp, sensor.sensor_type, reading.id
        )
        behaviour_res = check_behaviour(db, sensor.id, reading.value, sensor.sensor_type)
        cross_res = check_cross_validation(
            db, sensor.id, sensor.location, sensor.sensor_type, reading.value
        )

        # ---- Verdict: outlier-persistence model ----
        if identity_res == "FAIL":
            final_decision = "MALICIOUS"
            evidence_score = 1.0

        elif physical_res == "FAIL":
            # The value itself is an outlier. Is it isolated or consistent?
            streak = _consecutive_outlier_streak(db, sensor.id, sensor.sensor_type)
            if streak >= CONSISTENT_OUTLIER_STREAK:
                final_decision = "MALICIOUS"
                evidence_score = min(1.0, 0.60 + 0.08 * (streak - CONSISTENT_OUTLIER_STREAK + 1))
            else:
                final_decision = "SUSPICIOUS"
                evidence_score = min(0.59, 0.35 + 0.10 * streak)

        else:
            # Value is within physical bounds -> TRUSTED.
            # Per the outlier model, only out-of-bounds VALUES are flagged. A
            # stable/quiet sensor (e.g. a DHT22 reporting the same reading while
            # the room temperature holds) is normal, so the softer statistical
            # checks (stuck-at, noise, neighbour drift) do not by themselves raise
            # a flag. They still run and are recorded in the audit trail.
            final_decision = "TRUSTED"
            evidence_score = 0.0

    # Persist the result
    result = InvestigationResult(
        reading_id=reading.id,
        identity_check=identity_res,
        physical_check=physical_res,
        history_check=history_res,
        behaviour_check=behaviour_res,
        cross_validation=cross_res,
        final_decision=final_decision,
        evidence_score=round(evidence_score, 2),
    )

    db.add(result)
    db.commit()
    db.refresh(result)

    return result
