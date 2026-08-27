"""
AQI Predictor REST API Service (Recalibrated Dual-Engine Architecture)
----------------------------------------------------------------------
Exposes:
  - Exact Piecewise Linear Breakpoint Sub-Index calculation (CPCB NAQI & US EPA)
  - Live Station Telemetry Ingestion with Ground-Truth comparison
  - Supervised Random Forest ML Prediction
"""

import os
import sys

# Ensure root directory is on Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from api import app

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("src.api:app", host="0.0.0.0", port=8000, reload=True)
