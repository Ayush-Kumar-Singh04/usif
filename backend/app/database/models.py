from sqlalchemy import ForeignKey, Text, DateTime
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship
from datetime import datetime, timezone

class Base(DeclarativeBase):
    pass

class Sensor(Base):
    __tablename__ = "sensors"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    sensor_id: Mapped[str] = mapped_column(unique=True, index=True)
    sensor_type: Mapped[str] = mapped_column()
    location: Mapped[str] = mapped_column()
    status: Mapped[str] = mapped_column(default="ACTIVE")
    installation_date: Mapped[datetime] = mapped_column(
        DateTime,
        default=lambda: datetime.now(timezone.utc)
    )

    readings: Mapped[list["Reading"]] = relationship(back_populates="sensor")

class Reading(Base):
    __tablename__ = "readings"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    sensor_fk: Mapped[int] = mapped_column(ForeignKey("sensors.id"))
    value: Mapped[float] = mapped_column()
    raw_value: Mapped[float] = mapped_column()
    timestamp: Mapped[datetime] = mapped_column(
        DateTime,
        default=lambda: datetime.now(timezone.utc)
    )

    sensor: Mapped["Sensor"] = relationship(back_populates="readings")

class InvestigationResult(Base):
    __tablename__ = "investigation_results"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    reading_id: Mapped[int] = mapped_column()
    identity_check: Mapped[str] = mapped_column()
    physical_check: Mapped[str] = mapped_column()
    history_check: Mapped[str] = mapped_column()
    behaviour_check: Mapped[str] = mapped_column()
    cross_validation: Mapped[str] = mapped_column()
    final_decision: Mapped[str] = mapped_column()
    evidence_score: Mapped[float] = mapped_column()

class Recommendation(Base):
    __tablename__ = "recommendations"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    sensor_id: Mapped[str] = mapped_column()
    recommendation: Mapped[str] = mapped_column(Text)
    priority: Mapped[str] = mapped_column()
    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=lambda: datetime.now(timezone.utc)
    )