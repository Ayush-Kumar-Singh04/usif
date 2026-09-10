from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.reading_routes import router
from app.api.sensor_routes import router as sensor_router
from app.api.recommendation_routes import router as recommendation_router
from app.api.health_routes import router as health_router

app = FastAPI(
    title="USIF Backend",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)
app.include_router(sensor_router)
app.include_router(recommendation_router)
app.include_router(health_router)

@app.get("/")
def home():
    return {
        "status": "running",
        "project": "USIF"
    }