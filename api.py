"""
AQI Predictor REST API Service (Recalibrated Dual-Engine Architecture)
----------------------------------------------------------------------
Exposes:
  - Piecewise Linear Breakpoint Sub-Index calculation (CPCB NAQI & US EPA)
  - Live Station Telemetry Ingestion with Ground-Truth comparison
  - Supervised Random Forest ML Prediction
"""

from typing import Optional, Dict, Any
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from inference import pipeline, POPULAR_CITIES

app = FastAPI(
    title="AQI ML Prediction & Official Benchmark API",
    description="Dual-engine AQI inference: Piecewise Linear Sub-Index Breakpoint calculation (CPCB/EPA) + RandomForest ML with live Open-Meteo telemetry sync.",
    version="2.0.0",
)

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class PollutantInput(BaseModel):
    pm25: float = Field(..., ge=0, le=1000, description="PM2.5 concentration in µg/m³")
    pm10: float = Field(..., ge=0, le=1500, description="PM10 concentration in µg/m³")
    no2: float = Field(..., ge=0, le=1000, description="NO2 concentration in µg/m³")
    co: float = Field(..., ge=0, le=50000, description="CO concentration (auto-detects mg/m³ vs µg/m³)")
    so2: float = Field(..., ge=0, le=2000, description="SO2 concentration in µg/m³")
    o3: float = Field(..., ge=0, le=1000, description="O3 concentration in µg/m³")
    standard: Optional[str] = Field("US", description="Standard: 'US' (EPA) or 'INDIA' (CPCB)")

    class Config:
        json_schema_extra = {
            "example": {
                "pm25": 45.0,
                "pm10": 85.0,
                "no2": 28.0,
                "co": 1.2,
                "so2": 12.0,
                "o3": 35.0,
                "standard": "US",
            }
        }


@app.get("/api/health")
def health_check():
    """Returns model health, features expected, and artifact metadata."""
    return {
        "status": "online",
        "model_type": str(type(pipeline.model).__name__),
        "expected_features": pipeline.feature_names,
        "n_estimators": len(pipeline.model.estimators_) if hasattr(pipeline.model, "estimators_") else None,
        "standards_supported": ["US EPA (0-500)", "Indian CPCB NAQI (0-500)"],
    }


@app.get("/api/cities")
def list_supported_cities():
    """Returns list of pre-configured major cities."""
    return {
        "cities": [
            {"name": name, **meta} for name, meta in POPULAR_CITIES.items()
        ]
    }


@app.post("/api/predict")
def predict_aqi(payload: PollutantInput):
    """
    Computes both official standard sub-index AQI (CPCB / EPA) and raw ML prediction.
    """
    try:
        raw_dict = {
            "PM2.5": payload.pm25,
            "PM10": payload.pm10,
            "NO2": payload.no2,
            "CO": payload.co,
            "SO2": payload.so2,
            "O3": payload.o3,
        }
        result = pipeline.predict(raw_dict, standard=payload.standard or "US")
        return {
            "status": "success",
            "data": result,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")


@app.get("/api/predict/city")
def predict_by_city(
    city: str = Query(..., description="Name of the city (e.g. 'Delhi', 'Mumbai', 'Bengaluru')"),
    standard: str = Query("US", description="Standard: 'US' (EPA) or 'INDIA' (CPCB)")
):
    """
    Pulls live Open-Meteo pollutant and meteorological telemetry for the given city,
    computes piecewise linear sub-indices, runs ML inference, and compares with live official station benchmark.
    """
    try:
        result = pipeline.predict_by_city(city, standard=standard)
        return {
            "status": "success",
            "data": result,
        }
    except ValueError as ve:
        raise HTTPException(status_code=404, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"City inference error: {str(e)}")


@app.get("/api/v2/predict/live")
def predict_v2_live(
    city: Optional[str] = Query("New Delhi", description="City name"),
    standard: Optional[str] = Query("CPCB", description="Standard: 'CPCB' or 'EPA'")
):
    """
    Production Engine endpoint:
    Pulls live Open-Meteo telemetry, computes official breakpoint sub-indices,
    runs the calibrated Gradient Boosting ML pipeline, and generates 24-hour hourly trend arrays.
    """
    try:
        from src.inference import get_calibrated_aqi
        res = get_calibrated_aqi(city_name=city or "New Delhi", standard=standard or "CPCB", forecast_hours=24)
        return {
            "status": "success",
            "data": res
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/calibrated")
def predict_calibrated_aqi(
    city: str = Query("New Delhi", description="City name"),
    standard: str = Query("CPCB", description="Standard: 'CPCB' or 'EPA'"),
    hours: int = Query(24, ge=1, le=72, description="Forecast horizon in hours")
):
    """
    Unified official benchmark endpoint returning calibrated AQI, pollutant sub-indices,
    24h-72h hourly gradient boosting forecasts, and health advisories.
    """
    try:
        from src.inference import get_calibrated_aqi
        data = get_calibrated_aqi(city_name=city, standard=standard, forecast_hours=hours)
        return {
            "status": "success",
            "data": data
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("api:app", host="0.0.0.0", port=8000, reload=True)

