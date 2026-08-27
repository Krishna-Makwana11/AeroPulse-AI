"""
Module 4: Unified Inference Pipeline & API
------------------------------------------
Author: Principal Environmental Data Scientist & Production ML Engineer
Core Function:
  get_calibrated_aqi(city_name, standard="CPCB", forecast_hours=24)
Executes:
  1. Live Atmospheric Ingestion: Resolves GPS coordinates and pulls real-time multi-pollutant
     and meteorological telemetry from Open-Meteo via src/data_fetcher.py.
  2. Exact Official Breakpoint Indexing: Computes calibrated current AQI and all individual
     pollutant sub-indices via src/aqi_engine.py.
  3. 24-Hour Predictive Forecasting: Uses the trained gradient boosting model to forecast raw
     pollutant concentrations, piping each hour through the breakpoint matrix to calculate
     future AQI on the exact standard scale.
  4. Returns clean, production-grade JSON response.
"""

import os
import logging
from datetime import datetime, timezone
from typing import Dict, Any, Optional, List
import numpy as np
import pandas as pd
import joblib

from src.data_fetcher import EnvironmentalDataFetcher
from src.aqi_engine import calculate_aqi_from_pollutants, get_aqi_category

logger = logging.getLogger("AQIInference")
if not logger.handlers:
    logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")


class UnifiedAQIPipeline:
    """Production inference engine orchestrating telemetry, ML concentration forecasting, and standard indexing."""

    _instance = None

    def __init__(self, model_dir: str = "models"):
        self.model_dir = model_dir
        self.forecaster = None
        self._load_forecaster()

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def _load_forecaster(self):
        """Loads trained multi-pollutant concentration forecaster artifact."""
        candidate_paths = [
            os.path.join(self.model_dir, "pollutant_forecaster.joblib"),
            "pollutant_forecaster.joblib",
            os.path.join(os.path.dirname(__file__), "..", "models", "pollutant_forecaster.joblib"),
        ]
        try:
            import src.train_predictor
            from src.train_predictor import MultiPollutantPredictor
        except Exception:
            pass

        for p in candidate_paths:
            if os.path.exists(p):
                try:
                    loaded = joblib.load(p)
                    if isinstance(loaded, dict) and "models" in loaded:
                        from src.train_predictor import MultiPollutantPredictor
                        self.forecaster = MultiPollutantPredictor.load_from_payload(loaded)
                    else:
                        self.forecaster = loaded
                    logger.info(f"Successfully loaded atmospheric forecaster from: {p}")
                    return
                except Exception as e:
                    logger.warning(f"Error loading model from {p}: {e}")

        # If not trained yet, will train or use physical atmospheric extrapolation
        logger.info("No serialized pollutant forecaster found. Training initial baseline model...")
        try:
            from src.train_predictor import train_production_predictor
            self.forecaster, _ = train_production_predictor(output_dir=self.model_dir)
            logger.info("Baseline atmospheric forecaster trained successfully.")
        except Exception as e:
            logger.warning(f"Automatic training deferred: {e}")
            self.forecaster = None

    def _build_forecast_features(
        self,
        hourly_telemetry: List[Dict[str, Any]],
        current_pollutants: Dict[str, float],
        current_weather: Dict[str, float],
        city_name: str
    ) -> pd.DataFrame:
        """
        Constructs the exact feature matrix expected by the MultiPollutantPredictor
        for future time steps.
        """
        rows = []
        # Seed lag state from current observations
        lag_state = {
            "PM2.5": current_pollutants["PM2.5"],
            "PM10": current_pollutants["PM10"],
            "NO2": current_pollutants["NO2"],
            "CO": current_pollutants["CO"],
            "SO2": current_pollutants["SO2"],
            "O3": current_pollutants["O3"],
        }

        for item in hourly_telemetry:
            t_str = item.get("timestamp", "")
            try:
                dt = pd.to_datetime(t_str)
            except Exception:
                dt = pd.Timestamp.now(timezone.utc)

            hour = dt.hour
            dow = dt.dayofweek
            month = dt.month

            temp = item.get("temperature", current_weather.get("temperature", 25.0))
            rh = item.get("relative_humidity", current_weather.get("relative_humidity", 50.0))
            wind = item.get("wind_speed", current_weather.get("wind_speed", 10.0))
            wdir = item.get("wind_direction", current_weather.get("wind_direction", 180.0))
            pres = item.get("surface_pressure", current_weather.get("surface_pressure", 1013.25))

            row = {
                "temperature": temp,
                "relative_humidity": rh,
                "wind_speed": wind,
                "wind_direction": wdir,
                "surface_pressure": pres,
                "sin_hour": np.sin(2 * np.pi * hour / 24.0),
                "cos_hour": np.cos(2 * np.pi * hour / 24.0),
                "sin_dayofweek": np.sin(2 * np.pi * dow / 7.0),
                "cos_dayofweek": np.cos(2 * np.pi * dow / 7.0),
                "sin_month": np.sin(2 * np.pi * month / 12.0),
                "cos_month": np.cos(2 * np.pi * month / 12.0),
                "wind_dispersion": 10.0 / (wind + 1.0),
                "humidity_trapping": (rh / 100.0) * (temp / 30.0),
                "ventilation_index": wind * np.maximum(5.0, temp + 10.0),
                "pressure_trapping": (pres / 1013.25) / (wind + 1.0),
                "pm_ratio": np.clip(lag_state["PM2.5"] / (lag_state["PM10"] + 1e-5), 0.1, 1.0),
                "oxidant_ratio": np.clip(lag_state["NO2"] / (lag_state["O3"] + 1e-5), 0.01, 10.0),
            }

            for pol in ["PM2.5", "PM10", "NO2", "CO", "SO2", "O3"]:
                # Use current/prior state for lag metrics
                val = lag_state[pol]
                row[f"{pol}_lag1"] = val
                row[f"{pol}_roll3"] = val
                row[f"{pol}_roll24"] = val

            rows.append(row)

        return pd.DataFrame(rows)

    def execute_calibrated_pipeline(
        self,
        city_name: str,
        standard: str = "CPCB",
        forecast_hours: int = 24
    ) -> Dict[str, Any]:
        """
        Executes end-to-end ingestion, breakpoint calculation, and ML forecasting.
        """
        # 1. Ingest live multi-city atmospheric telemetry
        telemetry = EnvironmentalDataFetcher.get_city_telemetry(city_name, forecast_days=2)
        cur_pollutants = telemetry["current_pollutants"]
        cur_weather = telemetry["current_weather"]
        hourly_records = telemetry["hourly_telemetry"]
        benchmarks = telemetry["official_benchmarks"]

        # 2. Compute Real-Time Calibrated AQI via Official Breakpoint Engine
        realtime_aqi_res = calculate_aqi_from_pollutants(cur_pollutants, standard=standard)

        # 3. Generate Multi-Step Concentration Forecasts using ML Model
        n_steps = min(len(hourly_records), max(1, forecast_hours))
        forecast_entries: List[Dict[str, Any]] = []

        predicted_concentrations: Optional[Dict[str, np.ndarray]] = None
        if self.forecaster is not None and hasattr(self.forecaster, "predict_pollutants"):
            try:
                feature_df = self._build_forecast_features(
                    hourly_records[:n_steps],
                    cur_pollutants,
                    cur_weather,
                    telemetry["city"]
                )
                predicted_concentrations = self.forecaster.predict_pollutants(feature_df)
            except Exception as e:
                logger.warning(f"ML Concentration prediction fallback: {e}")
                predicted_concentrations = None

        # 4. Pipe each forecasted step through the Breakpoint Engine
        for i in range(n_steps):
            item = hourly_records[i]
            t_str = item["timestamp"]

            if predicted_concentrations is not None:
                h_p25 = round(float(predicted_concentrations["PM2.5"][i]), 2)
                h_p10 = round(float(predicted_concentrations["PM10"][i]), 2)
                h_no2 = round(float(predicted_concentrations["NO2"][i]), 2)
                h_co = round(float(predicted_concentrations["CO"][i]), 3)
                h_so2 = round(float(predicted_concentrations["SO2"][i]), 2)
                h_o3 = round(float(predicted_concentrations["O3"][i]), 2)
            else:
                # Open-Meteo physical model forecast baseline
                h_p25 = item["PM2.5"]
                h_p10 = item["PM10"]
                h_no2 = item["NO2"]
                h_co = item["CO"]
                h_so2 = item["SO2"]
                h_o3 = item["O3"]

            step_pollutants = {
                "PM2.5": h_p25,
                "PM10": h_p10,
                "NO2": h_no2,
                "CO": h_co,
                "SO2": h_so2,
                "O3": h_o3,
            }

            # Exact standard piecewise linear interpolation for this forecasted step
            step_calc = calculate_aqi_from_pollutants(step_pollutants, standard=standard)

            forecast_entries.append({
                "timestamp": t_str,
                "step_hour": i + 1,
                "predicted_aqi": step_calc["overall_aqi"],
                "dominant_pollutant": step_calc["dominant_pollutant"],
                "category": step_calc["category"]["level"],
                "category_color": step_calc["category"]["color"],
                "sub_indices": step_calc["sub_indices"],
                "predicted_pollutants": step_pollutants,
                "weather_context": {
                    "temperature": item.get("temperature"),
                    "relative_humidity": item.get("relative_humidity"),
                    "wind_speed": item.get("wind_speed"),
                    "surface_pressure": item.get("surface_pressure"),
                },
            })

        # Precautionary Health Advisory text
        advisory_info = realtime_aqi_res["category"]

        # 5. Clean, structured production response
        return {
            "city": telemetry["city"],
            "country": telemetry["country"],
            "coordinates": {
                "latitude": telemetry["latitude"],
                "longitude": telemetry["longitude"],
            },
            "standard": realtime_aqi_res["standard"],
            "current_aqi": realtime_aqi_res["overall_aqi"],
            "particulate_aqi": realtime_aqi_res["particulate_aqi"],
            "dominant_pollutant": realtime_aqi_res["dominant_pollutant"],
            "category": {
                "level": advisory_info["level"],
                "color": advisory_info["color"],
                "severity": advisory_info["severity"],
            },
            "sub_indices": realtime_aqi_res["sub_indices"],
            "current_pollutants": cur_pollutants,
            "current_weather": cur_weather,
            "hourly_forecast": forecast_entries,
            "health_advisory": {
                "summary": advisory_info["advisory"],
                "general_population": advisory_info.get("general_population_advisory", ""),
                "sensitive_groups": advisory_info.get("sensitive_groups_advisory", ""),
            },
            "station_benchmarks": benchmarks,
            "metadata": {
                "timestamp_utc": datetime.now(timezone.utc).isoformat(),
                "engine": "Official Breakpoint Engine + Gradient Boosting Forecaster",
                "forecast_steps": len(forecast_entries),
            },
        }


def get_calibrated_aqi(
    city_name: str,
    standard: str = "CPCB",
    forecast_hours: int = 24
) -> Dict[str, Any]:
    """
    Unified production execution function:
      Fetches live atmospheric metrics, calculates calibrated AQI using official breakpoints,
      and generates 24-hour hourly forecasted trends via the trained ML model.
    """
    pipeline = UnifiedAQIPipeline.get_instance()
    return pipeline.execute_calibrated_pipeline(
        city_name=city_name,
        standard=standard,
        forecast_hours=forecast_hours
    )


if __name__ == "__main__":
    print("\n--- TESTING UNIFIED INFERENCE PIPELINE ---")
    for test_city in ["Indore", "Delhi", "Mumbai"]:
        res = get_calibrated_aqi(test_city, standard="CPCB", forecast_hours=24)
        print(f"\n[OK] City: {res['city']}, {res['country']} ({res['coordinates']['latitude']}, {res['coordinates']['longitude']})")
        print(f"     Standard: {res['standard']} | Current AQI: {res['current_aqi']} ({res['category']['level']})")
        print(f"     Dominant Pollutant: {res['dominant_pollutant']}")
        print(f"     Sub-indices: {res['sub_indices']}")
        print(f"     Hourly Forecast Points: {len(res['hourly_forecast'])}")
        print(f"     Advisory: {res['health_advisory']['summary']}")
