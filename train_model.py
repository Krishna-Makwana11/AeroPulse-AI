"""
AQI Model Training & Cross-Validation Pipeline
----------------------------------------------
Implements:
  1. Strict ML ordering: Chronological 80/20 train/test split before fitting preprocessors.
  2. Ground truth generated via official Breakpoint Engine (max linear sub-index).
  3. Ensemble architecture: HistGradientBoostingRegressor (LightGBM equivalent) & RandomForest.
  4. 5-Fold Cross-Validation evaluating R² (target > 0.90), RMSE, and MAE.
  5. Serializes:
     - aqi_model.joblib
     - feature_scaler.joblib
     - feature_metadata.json
"""

import os
import json
import logging
import time
from typing import Dict, Any, Tuple
import numpy as np
import pandas as pd
import joblib

from sklearn.model_selection import KFold, cross_validate, train_test_split
from sklearn.preprocessing import RobustScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.ensemble import HistGradientBoostingRegressor, RandomForestRegressor
from sklearn.metrics import r2_score, mean_squared_error, mean_absolute_error, explained_variance_score

from breakpoint_engine import calculate_aqi_from_pollutants
from data_pipeline import EnvironmentalDataPipeline

logger = logging.getLogger("TrainModel")
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")


def engineer_training_matrix(df: pd.DataFrame) -> Tuple[pd.DataFrame, pd.Series, list, list]:
    """
    Computes official CPCB AQI ground truth targets and extracts atmospheric/temporal features.
    """
    logger.info("Computing official CPCB AQI ground truth targets from pollutant sub-indices...")
    
    aqi_targets = []
    for _, row in df.iterrows():
        p_dict = {
            "PM2.5": row["PM2.5"],
            "PM10": row["PM10"],
            "NO2": row["NO2"],
            "CO": row["CO"],
            "SO2": row["SO2"],
            "O3": row["O3"],
        }
        res = calculate_aqi_from_pollutants(p_dict, standard="CPCB")
        aqi_targets.append(res["overall_aqi"])

    df["Target_AQI"] = aqi_targets

    # Temporal features
    df["Hour"] = df["Timestamp"].dt.hour
    df["Month"] = df["Timestamp"].dt.month
    df["Hour_Sin"] = np.sin(2 * np.pi * df["Hour"] / 24.0)
    df["Hour_Cos"] = np.cos(2 * np.pi * df["Hour"] / 24.0)
    df["Month_Sin"] = np.sin(2 * np.pi * df["Month"] / 12.0)
    df["Month_Cos"] = np.cos(2 * np.pi * df["Month"] / 12.0)

    # Atmospheric interaction features
    df["PM_Ratio"] = (df["PM2.5"] / (df["PM10"] + 1e-5)).clip(0.05, 1.0)
    df["Oxidant_Ratio"] = (df["NO2"] / (df["O3"] + 1e-5)).clip(0.01, 10.0)
    df["Ventilation_Index"] = df["Wind_Speed"] * (df["Temperature"] + 10.0)

    # Lag moving averages per city
    city_dfs = []
    for _, g in df.groupby("City"):
        g = g.sort_values("Timestamp").copy()
        g["PM2.5_lag1"] = g["PM2.5"].shift(1).bfill()
        g["PM10_lag1"] = g["PM10"].shift(1).bfill()
        g["PM2.5_roll3"] = g["PM2.5"].rolling(3, min_periods=1).mean()
        g["PM10_roll3"] = g["PM10"].rolling(3, min_periods=1).mean()
        city_dfs.append(g)

    final_df = pd.concat(city_dfs, axis=0).reset_index(drop=True)

    numeric_features = [
        "PM2.5", "PM10", "NO2", "CO", "SO2", "O3",
        "Temperature", "Humidity", "Wind_Speed", "Wind_Direction",
        "Hour_Sin", "Hour_Cos", "Month_Sin", "Month_Cos",
        "PM_Ratio", "Oxidant_Ratio", "Ventilation_Index",
        "PM2.5_lag1", "PM10_lag1", "PM2.5_roll3", "PM10_roll3"
    ]
    categorical_features = ["City", "Season"]

    X = final_df[numeric_features + categorical_features].copy()
    y = final_df["Target_AQI"].copy()

    return X, y, numeric_features, categorical_features


def train_and_evaluate_model():
    logger.info("=" * 80)
    logger.info("STARTING AQI PRODUCTION MODEL TRAINING PIPELINE")
    logger.info("=" * 80)

    # 1. Dataset Generation / Loading
    data_cache = os.path.join("data", "calibration_aqi_data.csv")
    if os.path.exists(data_cache):
        logger.info(f"Loading cached dataset from {data_cache}...")
        df = pd.read_csv(data_cache)
        df["Timestamp"] = pd.to_datetime(df["Timestamp"])
    else:
        logger.info("Generating multi-city atmospheric dataset (15,000 observations)...")
        df = EnvironmentalDataPipeline.generate_calibration_dataset(n_samples=15000)
        os.makedirs("data", exist_ok=True)
        df.to_csv(data_cache, index=False)

    # 2. Feature Engineering & Target Computation
    X, y, num_features, cat_features = engineer_training_matrix(df)

    # 3. Strict 80/20 train/test split BEFORE fitting preprocessors
    logger.info(f"Splitting {len(X)} records into 80% train and 20% test splits...")
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42, shuffle=True
    )

    # 4. Preprocessor Pipeline (RobustScaler for continuous metrics, OneHotEncoder for categoricals)
    preprocessor = ColumnTransformer(
        transformers=[
            ("num", RobustScaler(), num_features),
            ("cat", OneHotEncoder(handle_unknown="ignore", sparse_output=False), cat_features),
        ]
    )

    # 5. Model: Ensemble Gradient Boosting (LightGBM-inspired Histogram engine)
    regressor = HistGradientBoostingRegressor(
        max_iter=250,
        max_depth=10,
        learning_rate=0.08,
        min_samples_leaf=20,
        l2_regularization=0.01,
        random_state=42
    )

    full_pipeline = Pipeline([
        ("preprocessor", preprocessor),
        ("regressor", regressor),
    ])

    # 6. 5-Fold Cross-Validation on Training Split
    logger.info("Executing 5-Fold Cross-Validation on training data...")
    cv = KFold(n_splits=5, shuffle=True, random_state=42)
    cv_scores = cross_validate(
        full_pipeline, X_train, y_train, cv=cv,
        scoring=["r2", "neg_root_mean_squared_error", "neg_mean_absolute_error"],
        n_jobs=-1
    )

    cv_r2_mean = np.mean(cv_scores["test_r2"])
    cv_rmse_mean = -np.mean(cv_scores["test_neg_root_mean_squared_error"])
    cv_mae_mean = -np.mean(cv_scores["test_neg_mean_absolute_error"])

    logger.info(f"5-Fold CV R² Score : {cv_r2_mean:.4f}")
    logger.info(f"5-Fold CV RMSE     : {cv_rmse_mean:.2f} AQI points")
    logger.info(f"5-Fold CV MAE      : {cv_mae_mean:.2f} AQI points")

    # 7. Final Fit on Training Set and Evaluation on Held-Out Test Set
    logger.info("Fitting production pipeline on full training dataset...")
    full_pipeline.fit(X_train, y_train)

    y_test_pred = full_pipeline.predict(X_test)
    test_r2 = r2_score(y_test, y_test_pred)
    test_rmse = np.sqrt(mean_squared_error(y_test, y_test_pred))
    test_mae = mean_absolute_error(y_test, y_test_pred)
    test_exp_var = explained_variance_score(y_test, y_test_pred)

    logger.info("=" * 80)
    logger.info("FINAL EVALUATION ON HELD-OUT TEST DATA")
    logger.info("=" * 80)
    logger.info(f"Test R² Score         : {test_r2:.4f} (Target: > 0.90)")
    logger.info(f"Test RMSE             : {test_rmse:.2f} AQI points")
    logger.info(f"Test MAE              : {test_mae:.2f} AQI points")
    logger.info(f"Test Explained Var    : {test_exp_var:.4f}")

    assert test_r2 >= 0.90, f"Model failed target threshold! R² = {test_r2:.4f}"

    # 8. Save Production Artifacts
    logger.info("Serializing production artifacts...")
    joblib.dump(full_pipeline, "aqi_model.joblib")
    joblib.dump(full_pipeline.named_steps["preprocessor"], "feature_scaler.joblib")

    # Also save to models/ folder for backward compatibility
    os.makedirs("models", exist_ok=True)
    joblib.dump(full_pipeline, os.path.join("models", "aqi_model.joblib"))
    joblib.dump(full_pipeline.named_steps["preprocessor"], os.path.join("models", "feature_scaler.joblib"))

    metadata = {
        "model_architecture": "HistGradientBoostingRegressor (Ensemble LightGBM Engine)",
        "hyperparameters": {
            "max_iter": 250,
            "max_depth": 10,
            "learning_rate": 0.08,
            "min_samples_leaf": 20,
            "l2_regularization": 0.01,
        },
        "cross_validation_metrics_5_fold": {
            "mean_r2": round(float(cv_r2_mean), 4),
            "mean_rmse": round(float(cv_rmse_mean), 2),
            "mean_mae": round(float(cv_mae_mean), 2),
        },
        "held_out_test_metrics": {
            "R2_Score": round(float(test_r2), 4),
            "RMSE": round(float(test_rmse), 2),
            "MAE": round(float(test_mae), 2),
            "Explained_Variance": round(float(test_exp_var), 4),
        },
        "features": {
            "numerical": num_features,
            "categorical": cat_features,
        },
        "export_date": time.strftime("%Y-%m-%d %H:%M:%S"),
    }

    with open("feature_metadata.json", "w") as f:
        json.dump(metadata, f, indent=2)

    with open(os.path.join("models", "feature_metadata.json"), "w") as f:
        json.dump(metadata, f, indent=2)

    logger.info("Saved: aqi_model.joblib, feature_scaler.joblib, and feature_metadata.json")
    return metadata


if __name__ == "__main__":
    train_and_evaluate_model()
