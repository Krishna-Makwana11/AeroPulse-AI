"""
Production Standalone AQI Inference Service
-------------------------------------------
Implements:
  1. Input resolution: City name or Latitude/Longitude coordinates.
  2. Live ambient meteorological and pollutant telemetry ingestion.
  3. ML Model prediction combined with official Breakpoint Engine calculation.
  4. Output generation:
     - Final Calibrated AQI Score (aligned with Google AQI / CPCB / EPA standards)
     - Dominant Pollutant (e.g. PM2.5)
     - Health Category Tag & Official Advisory
     - 24-Hour hourly forecast trend array with hourly sub-indices and categories.
"""

import os
import json
import logging
from typing import Dict, Any, Optional, Union
import numpy as np
import pandas as pd
import joblib

from breakpoint_engine import calculate_aqi_from_pollutants, get_aqi_category
from data_pipeline import EnvironmentalDataPipeline

logger = logging.getLogger("AQIInference")
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")


class AQIInferenceService:
    """Production inference engine for live and forward-looking AQI estimation."""

    def __init__(self, model_path: str = "aqi_model.joblib"):
        self.model_path = model_path
        self.pipeline = None
        self._load_pipeline()

    def _load_pipeline(self):
        """Loads serialized pipeline or searches fallback paths."""
        paths_to_try = [
            self.model_path,
            os.path.join("models", "aqi_model.joblib"),
            os.path.join("models", "full_aqi_pipeline.joblib"),
        ]
        for p in paths_to_try:
            if os.path.exists(p):
                try:
                    self.pipeline = joblib.load(p)
                    logger.info(f"Loaded production AQI pipeline from: {p}")
                    return
                except Exception as e:
                    logger.warning(f"Failed loading {p}: {e}")

        logger.warning("No pre-trained model found on disk. Pipeline will use direct physical breakpoint calculation until trained.")

    def predict_for_location(
        self,
        city: Optional[str] = None,
        lat: Optional[float] = None,
        lon: Optional[float] = None,
        standard: str = "CPCB"
    ) -> Dict[str, Any]:
        """
        Executes end-to-end inference for a given city or coordinate pair:
          - Fetches live Open-Meteo telemetry.
          - Runs ML model inference.
          - Calculates exact CPCB/EPA linear breakpoint sub-indices.
          - Computes 24-hour hourly forecast trend array.
        """
        # 1. Coordinate & City Resolution
        if lat is None or lon is None:
            resolved_lat, resolved_lon, resolved_city = EnvironmentalDataPipeline.resolve_coordinates(city or "New Delhi")
        else:
            resolved_lat, resolved_lon = float(lat), float(lon)
            resolved_city = city or f"Coord({resolved_lat:.2f}, {resolved_lon:.2f})"

        # 2. Live Telemetry Fetch (Current conditions + 24-hr hourly series)
        telemetry = EnvironmentalDataPipeline.fetch_live_telemetry(resolved_lat, resolved_lon)
        current_pollutants = telemetry["pollutants"]
        current_weather = telemetry["weather"]
        hourly_raw = telemetry["hourly_series"]
        station_benchmarks = telemetry["benchmarks"]

        # 3. Compute Official Breakpoint Sub-Indices for Current Conditions
        current_breakpoint_result = calculate_aqi_from_pollutants(current_pollutants, standard=standard)

        # 4. Machine Learning Model Evaluation
        ml_predicted_aqi = None
        if self.pipeline is not None:
            try:
                # Prepare single-row DataFrame matching the model's training feature signature
                now = pd.Timestamp.now()
                hour = now.hour
                month = now.month

                # Atmospheric ratios
                pm25 = current_pollutants["PM2.5"]
                pm10 = current_pollutants["PM10"]
                no2 = current_pollutants["NO2"]
                o3 = current_pollutants["O3"]
                temp = current_weather["temperature"]
                wind = current_weather["wind_speed"]

                pm_ratio = np.clip(pm25 / (pm10 + 1e-5), 0.05, 1.0)
                oxidant_ratio = np.clip(no2 / (o3 + 1e-5), 0.01, 10.0)
                vent_idx = wind * (temp + 10.0)

                # Determine season
                if month in [11, 12, 1, 2]:
                    season = "Winter"
                elif month in [7, 8, 9]:
                    season = "Monsoon"
                elif month in [3, 4, 5]:
                    season = "Summer"
                else:
                    season = "Post-Monsoon"

                feature_dict = {
                    "PM2.5": pm25,
                    "PM10": pm10,
                    "NO2": no2,
                    "CO": current_pollutants["CO"],
                    "SO2": current_pollutants["SO2"],
                    "O3": o3,
                    "Temperature": temp,
                    "Humidity": current_weather["humidity"],
                    "Wind_Speed": wind,
                    "Wind_Direction": current_weather["wind_direction"],
                    "Hour_Sin": np.sin(2 * np.pi * hour / 24.0),
                    "Hour_Cos": np.cos(2 * np.pi * hour / 24.0),
                    "Month_Sin": np.sin(2 * np.pi * month / 12.0),
                    "Month_Cos": np.cos(2 * np.pi * month / 12.0),
                    "PM_Ratio": pm_ratio,
                    "Oxidant_Ratio": oxidant_ratio,
                    "Ventilation_Index": vent_idx,
                    "PM2.5_lag1": pm25,
                    "PM10_lag1": pm10,
                    "PM2.5_roll3": pm25,
                    "PM10_roll3": pm10,
                    "City": resolved_city if resolved_city in ["New Delhi", "Mumbai", "Shimla", "Bengaluru", "Kolkata", "Ahmedabad"] else "New Delhi",
                    "Season": season,
                }

                input_df = pd.DataFrame([feature_dict])
                raw_pred = self.pipeline.predict(input_df)[0]
                ml_predicted_aqi = round(float(raw_pred), 1)
            except Exception as e:
                logger.warning(f"ML Pipeline prediction warning: {e}")

        # 5. Determine Final Calibrated AQI Score
        # If standard is CPCB, the official ground truth breakpoint is primary; ML acts as calibrator
        cpcb_aqi = current_breakpoint_result["overall_aqi"]
        final_aqi = ml_predicted_aqi if (ml_predicted_aqi is not None and abs(ml_predicted_aqi - cpcb_aqi) <= 15) else cpcb_aqi

        # 6. Compute 24-Hour Forecast Trend Array
        forecast_trend = []
        for item in hourly_raw:
            h_pollutants = {
                "PM2.5": item["PM2.5"],
                "PM10": item["PM10"],
                "NO2": item["NO2"],
                "CO": item["CO"],
                "SO2": item["SO2"],
                "O3": item["O3"],
            }
            h_res = calculate_aqi_from_pollutants(h_pollutants, standard=standard)
            forecast_trend.append({
                "time": item["time"],
                "aqi": h_res["overall_aqi"],
                "dominant_pollutant": h_res["dominant_pollutant"],
                "category": h_res["category"]["level"],
                "color": h_res["category"]["color"],
                "temperature": item["temperature"],
                "humidity": item["humidity"],
                "wind_speed": item["wind_speed"],
                "pm2_5": item["PM2.5"],
                "pm10": item["PM10"],
            })

        return {
            "city": resolved_city,
            "coordinates": {"lat": resolved_lat, "lon": resolved_lon},
            "standard_used": current_breakpoint_result["standard"],
            "final_calibrated_aqi": int(round(final_aqi)),
            "ml_predicted_continuous_aqi": ml_predicted_aqi,
            "breakpoint_standard_aqi": cpcb_aqi,
            "dominant_pollutant": current_breakpoint_result["dominant_pollutant"],
            "category": current_breakpoint_result["category"],
            "sub_indices": current_breakpoint_result["sub_indices"],
            "current_pollutants": current_pollutants,
            "current_weather": current_weather,
            "official_station_benchmark": station_benchmarks,
            "hourly_24h_forecast": forecast_trend,
        }


# Global singleton instance for high-performance reuse
_service = None

def get_aqi_prediction(
    city: Optional[str] = None,
    lat: Optional[float] = None,
    lon: Optional[float] = None,
    standard: str = "CPCB"
) -> Dict[str, Any]:
    """Production convenience wrapper."""
    global _service
    if _service is None:
        _service = AQIInferenceService()
    return _service.predict_for_location(city=city, lat=lat, lon=lon, standard=standard)


if __name__ == "__main__":
    for test_city in ["Shimla", "Mumbai", "New Delhi"]:
        print(f"\n--- INFERENCE FOR {test_city.upper()} ---")
        output = get_aqi_prediction(city=test_city)
        print(f"City: {output['city']} | Final Calibrated AQI: {output['final_calibrated_aqi']} ({output['category']['level']})")
        print(f"Dominant: {output['dominant_pollutant']} | Sub-indices: {output['sub_indices']}")
        print(f"Official Station US AQI Benchmark: {output['official_station_benchmark']['official_open_meteo_us_aqi']}")
        print(f"24h Forecast steps generated: {len(output['hourly_24h_forecast'])}")
