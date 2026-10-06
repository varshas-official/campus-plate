import math

from app.database import connect
from app.ml.predictor import predict_demand


def create_prediction(payload: dict) -> dict:
    demand = predict_demand(payload)
    # Prepare a small 5% service buffer; round all kitchen quantities to whole portions.
    requirement = math.ceil(demand * 1.05)
    waste = max(0, requirement - round(demand))
    baseline_waste = max(0, payload["previous_food_waste"])
    reduction = max(0, baseline_waste - waste)
    with connect() as db:
        cursor = db.execute("""
            INSERT INTO predictions
            (date, meal_type, expected_students, previous_avg_consumption,
             previous_food_waste, predicted_demand, predicted_requirement,
             estimated_waste, estimated_waste_reduction)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (payload["date"].isoformat(), payload["meal_type"], payload["expected_students"],
              payload["previous_avg_consumption"], baseline_waste, round(demand, 1), requirement,
              waste, reduction))
        row = db.execute("SELECT * FROM predictions WHERE id = ?", (cursor.lastrowid,)).fetchone()
    return dict(row)
