import os
import sys
from datetime import datetime
import streamlit as st
import numpy as np
import pandas as pd

# Add root folder to sys.path to import inference pipeline cleanly
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from inference import pipeline, POPULAR_CITIES

st.set_page_config(page_title="AQI & Live Weather AI Dashboard", layout="wide")

# --- Header Section ---
st.markdown("<p style='color: #532e18f6; font-size:45px; font-weight:bold; margin-bottom: 0px;'>Air Quality Index (AQI) & Climate Monitor</p>", unsafe_allow_html=True)
st.markdown("<p style='color: #333333; font-size:18px; font-weight:500; margin-top: -5px;'>Calibrated Architecture: Official Agency Breakpoint Sub-Indexing (CPCB / EPA) + Supervised ML Random Forest.</p>", unsafe_allow_html=True)
st.markdown(f"<small style='color: #666666;'>Dashboard Sync Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')} (Local Time)</small>", unsafe_allow_html=True)
st.markdown("---")

# --- Sidebar: Location, Standard, & Sensor Controls ---
st.sidebar.markdown("### 🌍 Select Location & Standard")

# Standard Selection
standard_choice = st.sidebar.radio(
    "Air Quality Calculation Standard:",
    options=["US EPA (0-500)", "Indian CPCB NAQI (0-500)"],
    index=0
)
standard_code = "INDIA" if "Indian" in standard_choice else "US"

city_names = list(POPULAR_CITIES.keys())
default_city_index = city_names.index("New Delhi") if "New Delhi" in city_names else 0

selected_city = st.sidebar.selectbox(
    "Choose City for Live Telemetry:",
    options=city_names,
    index=default_city_index
)

# Fetch live city telemetry
city_coords = POPULAR_CITIES[selected_city]
with st.spinner(f"Syncing live telemetry for {selected_city}..."):
    try:
        live_telemetry = pipeline.fetch_live_telemetry(city_coords["lat"], city_coords["lon"])
        live_pollutants = live_telemetry["pollutants"]
        live_weather = live_telemetry["weather"]
        live_benchmarks = live_telemetry["benchmarks"]
    except Exception as e:
        st.sidebar.error(f"Error fetching live API telemetry: {e}")
        live_pollutants = {"PM2.5": 45.0, "PM10": 70.0, "NO2": 25.0, "CO": 1.0, "SO2": 10.0, "O3": 30.0}
        live_weather = {"temperature": 25.0, "apparent_temperature": 26.0, "humidity": 55, "wind_speed": 10.0}
        live_benchmarks = {"official_open_meteo_us_aqi": None, "official_open_meteo_european_aqi": None}

st.sidebar.markdown("---")
st.sidebar.markdown("### 🎚️ Ambient Sensor Controls")
st.sidebar.caption("Sliders are pre-filled with live sensor feeds. Adjust to simulate 'What-If' air quality scenarios.")

pm25 = st.sidebar.slider("PM2.5 (µg/m³)", 0.0, 500.0, float(live_pollutants.get("PM2.5", 45.0)), step=0.5)
pm10 = st.sidebar.slider("PM10 (µg/m³)", 0.0, 600.0, float(live_pollutants.get("PM10", 70.0)), step=1.0)
no2 = st.sidebar.slider("NO2 (µg/m³)", 0.0, 250.0, float(live_pollutants.get("NO2", 25.0)), step=0.5)
co = st.sidebar.slider("CO (mg/m³)", 0.0, 30.0, float(live_pollutants.get("CO", 1.0)), step=0.1)
so2 = st.sidebar.slider("SO2 (µg/m³)", 0.0, 200.0, float(live_pollutants.get("SO2", 10.0)), step=0.5)
o3 = st.sidebar.slider("O3 (µg/m³)", 0.0, 400.0, float(live_pollutants.get("O3", 30.0)), step=0.5)

# --- Execute Recalibrated Dual-Engine Inference ---
input_payload = {
    "PM2.5": pm25,
    "PM10": pm10,
    "NO2": no2,
    "CO": co,
    "SO2": so2,
    "O3": o3,
}

prediction_result = pipeline.predict(input_payload, standard=standard_code)
official_aqi = prediction_result["official_standard_aqi"]
calibrated_aqi = prediction_result["calibrated_aqi"]
ml_aqi = prediction_result["ml_predicted_aqi"]
category_info = prediction_result["category"]
dominant_pollutant = prediction_result["dominant_pollutant"]
sub_indices = prediction_result["sub_indices"]

status_text = category_info["level"]
status_color = category_info["color"]
official_station_aqi = live_benchmarks.get("official_open_meteo_us_aqi")

# --- Top Metric Cards: Side-by-Side Dual-Engine Comparison ---
card_col1, card_col2, card_col3 = st.columns([1.5, 1.8, 2.2])

with card_col1:
    st.markdown(f"<p style='color: #444444; font-weight: bold; margin-bottom: 0;'>Official Standard AQI ({selected_city})</p>", unsafe_allow_html=True)
    st.markdown(f"<h1 style='font-size: 65px; color: {status_color}; margin-top: -10px; margin-bottom: 0;'>{official_aqi} <span style='font-size: 16px; color: #555555;'>AQI</span></h1>", unsafe_allow_html=True)
    st.markdown(f"<small style='color: #666666;'>Dominant Driver: <b>{dominant_pollutant}</b> (Standard: {standard_choice})</small>", unsafe_allow_html=True)

with card_col2:
    st.markdown("<p style='color: #444444; font-weight: bold; margin-bottom: 5px;'>Classification & Benchmark Sync</p>", unsafe_allow_html=True)
    st.markdown(
        f"""
        <div style='background-color: {status_color}22; border: 2px solid {status_color}; padding: 12px 18px; border-radius: 12px; text-align: center;'>
            <b style='color: {status_color}; font-size: 22px;'>{status_text}</b>
            <br><small style='color: #333333;'>Severity: {category_info['severity'].replace('_', ' ').title()}</small>
        </div>
        """,
        unsafe_allow_html=True
    )
    if official_station_aqi is not None:
        st.markdown(f"<small style='color: #475569;'>📡 Live Station Ground Truth: <b>{official_station_aqi} US AQI</b></small>", unsafe_allow_html=True)

with card_col3:
    temp = live_weather.get("temperature", "N/A")
    feels_like = live_weather.get("apparent_temperature", temp)
    wind = live_weather.get("wind_speed", "N/A")
    humidity = live_weather.get("humidity", "N/A")

    st.markdown(
        f"""
        <div style='background-color: #f8fafc; padding: 14px; border-radius: 12px; border: 1px solid #e2e8f0;'>
            <b style='color: #0f172a;'>🌤️ Live Climate Telemetry ({selected_city})</b><br>
            <span style='font-size: 24px; font-weight: bold; color: #0f172a;'>{temp}°C</span> 
            <span style='font-size: 13px; color: #64748b;'>(Feels like {feels_like}°C)</span><br>
            <small style='color: #334155;'>
                💨 Wind: <b>{wind} km/h</b> &nbsp;|&nbsp; 
                💧 Humidity: <b>{humidity}%</b> &nbsp;|&nbsp;
                🤖 ML Regressor: <b>{ml_aqi} AQI</b>
            </small>
        </div>
        """,
        unsafe_allow_html=True
    )

st.markdown("---")

# --- Interactive Sub-Index Breakdown Table ---
st.markdown("<p style='color: #532e18f6; font-size:26px; font-weight:bold;'>🔬 Official Sub-Index Breakdown per Pollutant</p>", unsafe_allow_html=True)
st.caption("Under official agency standards (CPCB / EPA), each pollutant is mapped to a piecewise sub-index, and the overall AQI is defined as the maximum sub-index.")

sub_cols = st.columns(6)
pollutant_units = {
    "PM2.5": "µg/m³",
    "PM10": "µg/m³",
    "NO2": "µg/m³",
    "CO": "mg/m³",
    "SO2": "µg/m³",
    "O3": "µg/m³",
}

for i, (pol_name, pol_val) in enumerate(input_payload.items()):
    with sub_cols[i]:
        sub_val = sub_indices.get(pol_name, 0)
        is_dom = (pol_name == dominant_pollutant)
        badge = " 🔥 MAX" if is_dom else ""
        st.metric(
            label=f"{pol_name} Sub-Index{badge}",
            value=f"{sub_val}",
            delta=f"Conc: {pol_val} {pollutant_units[pol_name]}",
            delta_color="off"
        )

st.markdown("---")

# --- Architectural Diagnostics & Calibration Expander ---
with st.expander("🔍 Architecture Calibration & Side-by-Side Verification", expanded=True):
    col_a, col_b = st.columns(2)
    with col_a:
        st.markdown("#### 📊 Architecture Comparison")
        comp_df = pd.DataFrame([
            {"Metric": "Official Standard AQI", "Value": str(official_aqi), "Methodology": "Piecewise Linear Breakpoint Formula"},
            {"Metric": "Live Ground Truth (Open-Meteo)", "Value": str(official_station_aqi) if official_station_aqi else "N/A", "Methodology": "Station & Satellite Sensor Feed"},
            {"Metric": "Calibrated Consensus AQI", "Value": str(calibrated_aqi), "Methodology": "Dual-Engine Blended Output"},
            {"Metric": "Raw ML Model Output", "Value": str(ml_aqi), "Methodology": "RandomForestRegressor (100 Trees)"},
        ])
        st.dataframe(comp_df, hide_index=True, use_container_width=True)

    with col_b:
        st.markdown("#### 📐 Mathematical Formulation")
        st.latex(r"I_p = \frac{I_{HI} - I_{LO}}{B_{HI} - B_{LO}} \times (C_p - B_{LO}) + I_{LO}")
        st.latex(r"\text{Official AQI} = \max(I_{PM_{2.5}}, I_{PM_{10}}, I_{NO_2}, I_{SO_2}, I_{CO}, I_{O_3})")
        st.info(f"**Current Dominant Pollutant:** {dominant_pollutant} with Sub-Index of **{sub_indices.get(dominant_pollutant, 0)}**")