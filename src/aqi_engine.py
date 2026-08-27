"""
Module 2: Exact US-EPA & CPCB Standard Breakpoint Engine
---------------------------------------------------------
Author: Lead Systems Debugger & Environmental ML Engineer
Specifications:
  - Exact Piecewise Linear Interpolation Formula:
      I = ((I_Hi - I_Lo) / (BP_Hi - BP_Lo)) * (C - BP_Lo) + I_Lo
  - Overall AQI:
      AQI = max(I_PM2.5, I_PM10, I_NO2, I_SO2, I_CO, I_O3)
  - Primary Pollutant:
      Pollutant driving the maximum sub-index.
  - Official US-EPA Tiers & Colors:
      0 - 50:   Good (Green, #22c55e)
      51 - 100:  Moderate (Yellow, #eab308)
      101 - 150: Unhealthy for Sensitive Groups (Orange, #f97316)
      151 - 200: Unhealthy (Red, #ef4444)
      201 - 300: Very Unhealthy (Purple, #a855f7)
      301 - 500+: Hazardous (Maroon, #881337)
"""

from typing import Dict, Any, List, Tuple, Optional
import numpy as np

# ============================================================================
# OFFICIAL US-EPA BREAKPOINT TABLE (40 CFR Part 58, Appendix G)
# Standard units:
#   PM2.5: µg/m³ (24-hr avg, truncated to 0.1 µg/m³)
#   PM10:  µg/m³ (24-hr avg, truncated to 1 µg/m³)
#   NO2:   ppb   (1-hr avg, truncated to 1 ppb)
#   SO2:   ppb   (1-hr avg, truncated to 1 ppb)
#   CO:    ppm   (8-hr avg, truncated to 0.1 ppm)
#   O3:    ppb   (8-hr avg / 1-hr avg, truncated to 1 ppb)
# Bracket format: (BP_Lo, BP_Hi, I_Lo, I_Hi)
# ============================================================================
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

# ============================================================================
# CPCB NAQI (India Central Pollution Control Board Official Standard)
# Units: PM in µg/m³, NO2 in µg/m³, SO2 in µg/m³, CO in mg/m³, O3 in µg/m³
# ============================================================================
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


def calculate_sub_index(c_p: float, breakpoints: List[Tuple[float, float, int, int]]) -> float:
    """
    Computes official piecewise linear sub-index interpolation:
      I = ((I_Hi - I_Lo) / (BP_Hi - BP_Lo)) * (C - BP_Lo) + I_Lo
    """
    if c_p is None or np.isnan(c_p) or c_p <= 0.0:
        return 0.0

    c_val = float(c_p)

    # 1. Active bracket search
    for bp_lo, bp_hi, i_lo, i_hi in breakpoints:
        if bp_lo <= c_val <= bp_hi:
            sub = ((i_hi - i_lo) / (bp_hi - bp_lo)) * (c_val - bp_lo) + i_lo
            return round(float(sub), 1)

    # 2. Lower boundary check
    first_lo, first_hi, first_i_lo, first_i_hi = breakpoints[0]
    if c_val < first_lo:
        sub = ((first_i_hi - first_i_lo) / (first_hi - first_lo)) * c_val
        return max(0.0, round(float(sub), 1))

    # 3. Upper boundary extrapolation
    last_lo, last_hi, last_i_lo, last_i_hi = breakpoints[-1]
    if c_val > last_hi:
        extrapolated = ((last_i_hi - last_i_lo) / (last_hi - last_lo)) * (c_val - last_lo) + last_i_lo
        return min(999.0, round(float(extrapolated), 1))

    return 0.0


def calculate_aqi_from_pollutants(
    pollutants: Dict[str, float],
    standard: str = "US"
) -> Dict[str, Any]:
    """
    Calculates exact sub-indices for all 6 pollutants and derives overall AQI:
      AQI = max(I_PM2.5, I_PM10, I_NO2, I_SO2, I_CO, I_O3)
    Designates the highest sub-index pollutant as Primary Pollutant.
    """
    is_cpcb = standard.upper() in ["CPCB", "INDIA", "NAQI", "INDIAN"]
    table = CPCB_BREAKPOINTS if is_cpcb else EPA_BREAKPOINTS
    standard_name = "CPCB NAQI (India)" if is_cpcb else "US-EPA Standard"

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

    canonical_inputs: Dict[str, float] = {}
    for raw_k, raw_v in pollutants.items():
        if raw_v is None:
            continue
        cleaned_k = raw_k.strip().upper().replace(" ", "").replace("-", "")
        canon = key_aliases.get(cleaned_k)
        if canon:
            canonical_inputs[canon] = float(raw_v)

    # Process all 6 pollutants
    for pol_name in ["PM2.5", "PM10", "NO2", "SO2", "CO", "O3"]:
        if pol_name not in canonical_inputs:
            continue

        c = canonical_inputs[pol_name]

        # Unit Conversions for US-EPA:
        # Open-Meteo & telemetry stream pollutants in metric µg/m³.
        # US-EPA standards use:
        #   PM2.5 & PM10: µg/m³
        #   NO2: ppb (1 ppb ≈ 1.88 µg/m³)
        #   SO2: ppb (1 ppb ≈ 2.62 µg/m³)
        #   CO:  ppm (1 ppm ≈ 1.145 mg/m³ = 1145 µg/m³)
        #   O3:  ppb (1 ppb ≈ 2.00 µg/m³)
        if not is_cpcb:
            if pol_name == "NO2":
                c = c / 1.88
            elif pol_name == "SO2":
                c = c / 2.62
            elif pol_name == "CO":
                # If CO > 40, input is in µg/m³ -> convert to mg/m³ then ppm
                if c > 40.0:
                    c = c / 1000.0
                c = c / 1.145
            elif pol_name == "O3":
                # Crucial fix: convert O3 µg/m³ to ppb (e.g. 166 µg/m³ -> 83 ppb -> AQI 143, NOT 264)
                c = c / 2.00
        else:
            # Indian CPCB requires CO in mg/m³
            if pol_name == "CO" and c > 40.0:
                c = c / 1000.0

        sub = calculate_sub_index(c, table[pol_name])
        sub_indices[pol_name] = sub

        if sub > max_sub_index:
            max_sub_index = sub
            dominant_pollutant = pol_name

    overall_aqi = int(round(max_sub_index))
    particulate_aqi = int(round(max(sub_indices.get("PM2.5", 0.0), sub_indices.get("PM10", 0.0))))

    category = get_aqi_category(overall_aqi, is_cpcb=is_cpcb, dominant_pollutant=dominant_pollutant)

    return {
        "standard": standard_name,
        "overall_aqi": overall_aqi,
        "current_aqi": overall_aqi,
        "particulate_aqi": particulate_aqi,
        "dominant_pollutant": dominant_pollutant,
        "sub_indices": sub_indices,
        "category": category,
    }


def get_aqi_category(
    aqi: float,
    is_cpcb: bool = False,
    dominant_pollutant: str = "PM2.5"
) -> Dict[str, Any]:
    """
    Returns official health category, color codes, severity tags,
    and precautionary health advisories based on official US-EPA benchmarks:
      0 - 50:    Good (Green, #22c55e)
      51 - 100:  Moderate (Yellow, #eab308)
      101 - 150: Unhealthy for Sensitive Groups (Orange, #f97316)
      151 - 200: Unhealthy (Red, #ef4444)
      201 - 300: Very Unhealthy (Purple, #a855f7)
      301 - 500+: Hazardous (Maroon, #881337)
    """
    score = float(aqi)

    if is_cpcb:
        if score <= 50:
            return {
                "level": "Good",
                "range": "0 - 50",
                "color": "#22c55e",
                "severity": "minimal",
                "advisory": "Minimal health impact. Air quality is clean and satisfactory.",
                "outdoor_safety": 98,
            }
        elif score <= 100:
            return {
                "level": "Satisfactory",
                "range": "51 - 100",
                "color": "#84cc16",
                "severity": "minor",
                "advisory": f"Minor breathing discomfort may occur to sensitive people due to {dominant_pollutant}.",
                "outdoor_safety": 85,
            }
        elif score <= 200:
            return {
                "level": "Moderate",
                "range": "101 - 200",
                "color": "#eab308",
                "severity": "moderate",
                "advisory": f"Breathing discomfort to people with lung disease (asthma) and heart conditions.",
                "outdoor_safety": 60,
            }
        elif score <= 300:
            return {
                "level": "Poor",
                "range": "201 - 300",
                "color": "#f97316",
                "severity": "unhealthy",
                "advisory": f"Breathing discomfort to most people on prolonged exposure driven by {dominant_pollutant}.",
                "outdoor_safety": 35,
            }
        elif score <= 400:
            return {
                "level": "Very Poor",
                "range": "301 - 400",
                "color": "#ef4444",
                "severity": "very_unhealthy",
                "advisory": "Respiratory illness on prolonged exposure. Pronounced effect on people with lung/heart conditions.",
                "outdoor_safety": 15,
            }
        else:
            return {
                "level": "Severe",
                "range": "401 - 500+",
                "color": "#881337",
                "severity": "hazardous",
                "advisory": "Emergency conditions. Serious risk for the entire population.",
                "outdoor_safety": 5,
            }

    # Official US-EPA Standard (0 - 500)
    if score <= 50:
        return {
            "level": "Good",
            "range": "0 - 50",
            "color": "#22c55e",
            "tailwind_color": "text-green-500",
            "severity": "good",
            "badge": "Air Quality is Satisfactory",
            "advisory": "Air pollution poses little or no risk. Enjoy outdoor activities.",
            "outdoor_safety": 100,
            "mask_needed": False,
            "purifier_needed": False,
        }
    elif score <= 100:
        return {
            "level": "Moderate",
            "range": "51 - 100",
            "color": "#eab308",
            "tailwind_color": "text-yellow-500",
            "severity": "moderate",
            "badge": "Acceptable Air Quality",
            "advisory": "Air quality is acceptable; unusually sensitive individuals may experience minor symptoms.",
            "outdoor_safety": 85,
            "mask_needed": False,
            "purifier_needed": False,
        }
    elif score <= 150:
        return {
            "level": "Unhealthy for Sensitive Groups",
            "range": "101 - 150",
            "color": "#f97316",
            "tailwind_color": "text-orange-500",
            "severity": "sensitive",
            "badge": f"Sensitive Groups at Risk ({dominant_pollutant})",
            "advisory": f"Members of sensitive groups may experience health effects from elevated {dominant_pollutant}.",
            "outdoor_safety": 65,
            "mask_needed": False,
            "purifier_needed": True,
        }
    elif score <= 200:
        return {
            "level": "Unhealthy",
            "range": "151 - 200",
            "color": "#ef4444",
            "tailwind_color": "text-red-500",
            "severity": "unhealthy",
            "badge": "General Public Adverse Effects",
            "advisory": "Everyone may begin to experience health effects; members of sensitive groups may experience more serious effects.",
            "outdoor_safety": 35,
            "mask_needed": True,
            "purifier_needed": True,
        }
    elif score <= 300:
        return {
            "level": "Very Unhealthy",
            "range": "201 - 300",
            "color": "#a855f7",
            "tailwind_color": "text-purple-500",
            "severity": "very_unhealthy",
            "badge": "Health Alert: Serious Risk",
            "advisory": "Health alert: The risk of health effects is increased for everyone. Avoid outdoor exertion.",
            "outdoor_safety": 15,
            "mask_needed": True,
            "purifier_needed": True,
        }
    else:
        return {
            "level": "Hazardous",
            "range": "301 - 500+",
            "color": "#881337",
            "tailwind_color": "text-rose-900",
            "severity": "hazardous",
            "badge": "Emergency Health Warning",
            "advisory": "Health warning of emergency conditions. The entire population is likely to be affected.",
            "outdoor_safety": 5,
            "mask_needed": True,
            "purifier_needed": True,
        }


if __name__ == "__main__":
    # Test with user's specific benchmark values
    test_inputs = {
        "PM2.5": 65.0,
        "PM10": 113.0,
        "NO2": 28.0,
        "CO": 1.2,
        "SO2": 12.0,
        "O3": 166.0,
    }
    res = calculate_aqi_from_pollutants(test_inputs, standard="US")
    print("Delhi Benchmark Test Results:")
    print(f"Overall AQI: {res['overall_aqi']}")
    print(f"Dominant Pollutant: {res['dominant_pollutant']}")
    print(f"Sub-indices: {res['sub_indices']}")
    print(f"Category: {res['category']['level']} ({res['category']['color']})")
