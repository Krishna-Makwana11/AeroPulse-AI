"""
AQI Prediction & Real-Time Indexing System
------------------------------------------
Production package for city-agnostic atmospheric telemetry ingestion,
piecewise linear breakpoint AQI calculation (CPCB & US-EPA), and
multi-step gradient boosting concentration forecasting.
"""

from src.data_fetcher import EnvironmentalDataFetcher
from src.aqi_engine import (
    calculate_aqi_from_pollutants,
    calculate_sub_index,
    get_aqi_category,
    CPCB_BREAKPOINTS,
    EPA_BREAKPOINTS,
)
from src.inference import get_calibrated_aqi

__all__ = [
    "EnvironmentalDataFetcher",
    "calculate_aqi_from_pollutants",
    "calculate_sub_index",
    "get_aqi_category",
    "CPCB_BREAKPOINTS",
    "EPA_BREAKPOINTS",
    "get_calibrated_aqi",
]
