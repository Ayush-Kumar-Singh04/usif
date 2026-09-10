from pydantic import BaseModel

class SensorCreate(BaseModel):
    sensor_id: str
    sensor_type: str
    location: str

class ReadingCreate(BaseModel):
    sensor_id: str
    value: float
    raw_value: float