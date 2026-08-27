"""
Official Air Quality Index (AQI) Breakpoint Calculation Engine
--------------------------------------------------------------
Implements the exact official piecewise linear breakpoint interpolation formula used by:
  - United States Environmental Protection Agency (US EPA 40 CFR Part 58)
  - Central Pollution Control Board (CPCB India NAQI)

Mathematical Formulation:
  I = ((I_high - I_low) / (C_high - C_low)) * (C - C_low) + I_low
  Overall AQI = max(I_PM2.5, I_PM10, I_NO2, I_SO2, I_CO, I_O3)
"""

from typing import Dict, Any, List, Tuple, Optional
import numpy as np

# US-EPA Breakpoints (PM2.5: µg/m³, PM10: µg/m³, NO2: ppb, SO2: ppb, CO: ppm, O3: ppb)
EPA_BREAKPOINTS: Dict[str, List[Tuple[float, float, int, int]]] = {
    "PM2.5": [
        (0.0, 12.0, 0, 50),
        (12.1, 35.4, 51, 100),
        (35.5, 55.4, 101, 150),
        (55.5, 150.4, 151, 200),
        (150.5, 250.4, 201, 300),
        (250.5, 350.4, 301, 400),
        (350.5, 500.4, 401, 500),
    ],
    "PM10": [
        (0.0, 54.0, 0, 50),
        (55.0, 154.0, 51, 100),
        (155.0, 254.0, 101, 150),
        (255.0, 354.0, 151, 200),
        (355.0, 424.0, 201, 300),
        (425.0, 504.0, 301, 400),
        (505.0, 604.0, 401, 500),
    ],
    "NO2": [
        (0.0, 53.0, 0, 50),
        (54.0, 100.0, 51, 100),
        (101.0, 360.0, 101, 150),
        (361.0, 649.0, 151, 200),
        (650.0, 1249.0, 201, 300),
        (1250.0, 1649.0, 301, 400),
        (1650.0, 2049.0, 401, 500),
    ],
    "SO2": [
        (0.0, 35.0, 0, 50),
        (36.0, 75.0, 51, 100),
        (76.0, 185.0, 101, 150),
        (186.0, 304.0, 151, 200),
        (305.0, 604.0, 201, 300),
        (605.0, 804.0, 301, 400),
        (805.0, 1004.0, 401, 500),
    ],
    "CO": [
        (0.0, 4.4, 0, 50),
        (4.5, 9.4, 51, 100),
        (9.5, 12.4, 101, 150),
        (12.5, 15.4, 151, 200),
        (15.5, 30.4, 201, 300),
        (30.5, 40.4, 301, 400),
        (40.5, 50.4, 401, 500),
    ],
    "O3": [
        (0.0, 54.0, 0, 50),
        (55.0, 70.0, 51, 100),
        (71.0, 85.0, 101, 150),
        (86.0, 105.0, 151, 200),
        (106.0, 200.0, 201, 300),
        (201.0, 404.0, 301, 400),
        (405.0, 504.0, 401, 500),
    ],
}

# CPCB NAQI Breakpoints
CPCB_BREAKPOINTS: Dict[str, List[Tuple[float, float, int, int]]] = {
    "PM2.5": [
        (0.0, 30.0, 0, 50),
        (30.1, 60.0, 51, 100),
        (60.1, 90.0, 101, 200),
        (90.1, 120.0, 201, 300),
        (120.1, 250.0, 301, 400),
        (250.1, 500.0, 401, 500),
    ],
    "PM10": [
        (0.0, 50.0, 0, 50),
        (50.1, 100.0, 51, 100),
        (100.1, 250.0, 101, 200),
        (250.1, 350.0, 201, 300),
        (350.1, 430.0, 301, 400),
        (430.1, 600.0, 401, 500),
    ],
    "NO2": [
        (0.0, 40.0, 0, 50),
        (40.1, 80.0, 51, 100),
        (80.1, 180.0, 101, 200),
        (180.1, 280.0, 201, 300),
        (280.1, 400.0, 301, 400),
        (400.1, 800.0, 401, 500),
    ],
    "SO2": [
        (0.0, 40.0, 0, 50),
        (40.1, 80.0, 51, 100),
        (80.1, 380.0, 101, 200),
        (380.1, 800.0, 201, 300),
        (800.1, 1600.0, 301, 400),
        (1600.1, 2000.0, 401, 500),
    ],
    "CO": [
        (0.0, 1.0, 0, 50),
        (1.01, 2.0, 51, 100),
        (2.01, 10.0, 101, 200),
        (10.01, 17.0, 201, 300),
        (17.01, 34.0, 301, 400),
        (34.01, 50.0, 401, 500),
    ],
    "O3": [
        (0.0, 50.0, 0, 50),
        (50.1, 100.0, 51, 100),
        (100.1, 168.0, 101, 200),
        (168.1, 208.0, 201, 300),
        (208.1, 748.0, 301, 400),
        (748.1, 1000.0, 401, 500),
    ],
}


def calculate_sub_index(c_val: float, breakpoints: List[Tuple[float, float, int, int]]) -> float:
    if c_val is None or np.isnan(c_val) or c_val <= 0.0:
        return 0.0

    c = float(c_val)
    for bp_lo, bp_hi, i_lo, i_hi in breakpoints:
        if bp_lo <= c <= bp_hi:
            return round(float(((i_hi - i_lo) / (bp_hi - bp_lo)) * (c - bp_lo) + i_lo), 1)

    first_lo, first_hi, first_i_lo, first_i_hi = breakpoints[0]
    if c < first_lo:
        return max(0.0, round(float(((first_i_hi - first_i_lo) / (first_hi - first_lo)) * c), 1))

    last_lo, last_hi, last_i_lo, last_i_hi = breakpoints[-1]
    if c > last_hi:
        return min(999.0, round(float(((last_i_hi - last_i_lo) / (last_hi - last_lo)) * (c - last_lo) + last_i_lo), 1))

    return 0.0


def calculate_aqi_from_pollutants(
    pollutants: Dict[str, float],
    standard: str = "US"
) -> Dict[str, Any]:
    is_cpcb = standard.upper() in ["CPCB", "INDIA", "NAQI"]
    table = CPCB_BREAKPOINTS if is_cpcb else EPA_BREAKPOINTS

    sub_indices: Dict[str, float] = {}
    dominant_pollutant = "PM2.5"
    max_sub_index = 0.0

    key_aliases = {
        "PM25": "PM2.5", "PM2_5": "PM2.5", "PM2.5": "PM2.5",
        "PM10": "PM10", "PM1_0": "PM10",
        "NO2": "NO2", "NITROGEN_DIOXIDE": "NO2",
        "SO2": "SO2", "SULPHUR_DIOXIDE": "SO2",
        "CO": "CO", "CARBON_MONOXIDE": "CO",
        "O3": "O3", "OZONE": "O3",
    }

    clean_inputs: Dict[str, float] = {}
    for k, v in pollutants.items():
        if v is not None:
            canon = key_aliases.get(k.strip().upper().replace(" ", "").replace("_", "").replace("-", ""))
            if canon:
                clean_inputs[canon] = float(v)

    for pol in ["PM2.5", "PM10", "NO2", "SO2", "CO", "O3"]:
        if pol not in clean_inputs:
            continue
        c = clean_inputs[pol]

        if not is_cpcb:
            if pol == "NO2":
                c = c / 1.88
            elif pol == "SO2":
                c = c / 2.62
            elif pol == "CO":
                if c > 40.0:
                    c = c / 1000.0
                c = c / 1.145
            elif pol == "O3":
                c = c / 2.00
        else:
            if pol == "CO" and c > 40.0:
                c = c / 1000.0

        sub = calculate_sub_index(c, table[pol])
        sub_indices[pol] = sub
        if sub > max_sub_index:
            max_sub_index = sub
            dominant_pollutant = pol

    overall_aqi = int(round(max_sub_index))
    particulate_aqi = int(round(max(sub_indices.get("PM2.5", 0.0), sub_indices.get("PM10", 0.0))))
    category = get_aqi_category(overall_aqi, is_cpcb=is_cpcb)

    return {
        "standard": "CPCB NAQI (India)" if is_cpcb else "US-EPA Standard",
        "overall_aqi": overall_aqi,
        "current_aqi": overall_aqi,
        "particulate_aqi": particulate_aqi,
        "dominant_pollutant": dominant_pollutant,
        "sub_indices": sub_indices,
        "category": category,
    }


def get_aqi_category(aqi: float, is_cpcb: bool = False) -> Dict[str, str]:
    score = float(aqi)
    if is_cpcb:
        if score <= 50:
            return {"level": "Good", "range": "0 - 50", "color": "#22c55e", "severity": "minimal"}
        elif score <= 100:
            return {"level": "Satisfactory", "range": "51 - 100", "color": "#84cc16", "severity": "minor"}
        elif score <= 200:
            return {"level": "Moderate", "range": "101 - 200", "color": "#eab308", "severity": "moderate"}
        elif score <= 300:
            return {"level": "Poor", "range": "201 - 300", "color": "#f97316", "severity": "unhealthy"}
        elif score <= 400:
            return {"level": "Very Poor", "range": "301 - 400", "color": "#ef4444", "severity": "very_unhealthy"}
        else:
            return {"level": "Severe", "range": "401 - 500+", "color": "#881337", "severity": "hazardous"}

    # Official US-EPA Tiers & Colors
    if score <= 50:
        return {"level": "Good", "range": "0 - 50", "color": "#22c55e", "severity": "good"}
    elif score <= 100:
        return {"level": "Moderate", "range": "51 - 100", "color": "#eab308", "severity": "moderate"}
    elif score <= 150:
        return {"level": "Unhealthy for Sensitive Groups", "range": "101 - 150", "color": "#f97316", "severity": "sensitive"}
    elif score <= 200:
        return {"level": "Unhealthy", "range": "151 - 200", "color": "#ef4444", "severity": "unhealthy"}
    elif score <= 300:
        return {"level": "Very Unhealthy", "range": "201 - 300", "color": "#a855f7", "severity": "very_unhealthy"}
    else:
        return {"level": "Hazardous", "range": "301 - 500+", "color": "#881337", "severity": "hazardous"}
