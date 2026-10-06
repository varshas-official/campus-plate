from fastapi import APIRouter, HTTPException, Query

from app.database import connect
from app.ml.predictor import TRAINING_R2
from app.schemas import DashboardStats, Prediction, PredictionInput
from app.services.prediction_service import create_prediction

router = APIRouter(prefix="/api")


@router.post("/predictions", response_model=Prediction, status_code=201)
def predict(payload: PredictionInput):
    try:
        return create_prediction(payload.model_dump())
    except Exception as exc:
        raise HTTPException(status_code=500, detail="Prediction could not be created") from exc


@router.get("/predictions", response_model=list[Prediction])
def list_predictions(limit: int = Query(default=100, ge=1, le=500)):
    with connect() as db:
        rows = db.execute("SELECT * FROM predictions ORDER BY date DESC, id DESC LIMIT ?", (limit,)).fetchall()
    return [dict(row) for row in rows]


@router.get("/dashboard", response_model=DashboardStats)
def dashboard():
    with connect() as db:
        stats = db.execute("""
            SELECT COUNT(*) AS total,
                   COALESCE(AVG(predicted_demand),0) AS average_demand,
                   COALESCE(SUM(estimated_waste),0) AS waste,
                   COALESCE(SUM(estimated_waste_reduction),0) AS reduction,
                   COALESCE(SUM(previous_food_waste),0) AS historical_waste
            FROM predictions
        """).fetchone()
    return {"total_meals_predicted": stats["total"], "average_predicted_demand": round(stats["average_demand"], 1),
            "estimated_food_waste": round(stats["waste"], 1),
            "estimated_waste_reduction": round(stats["reduction"], 1), "historical_waste": round(stats["historical_waste"], 1)}


@router.get("/history")
def history():
    with connect() as db:
        rows = db.execute("""
            SELECT date, SUM(predicted_demand) AS predicted_demand,
                   SUM(actual_consumption) AS actual_consumption,
                   SUM(estimated_waste) AS estimated_waste
            FROM predictions GROUP BY date ORDER BY date ASC
        """).fetchall()
    return [dict(row) for row in rows]


@router.get("/model")
def model_info():
    return {"algorithm": "Ridge regression", "training_rows": 30, "training_r2": round(TRAINING_R2, 3),
            "features": ["expected students", "previous average consumption", "previous food waste", "meal type", "weekday", "month"]}
