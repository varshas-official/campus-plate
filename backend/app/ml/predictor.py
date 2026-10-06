from pathlib import Path

import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.linear_model import Ridge
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler

DATA_PATH = Path(__file__).resolve().parents[1] / "data" / "cafeteria_history.csv"
NUMERIC = ["expected_students", "previous_avg_consumption", "previous_food_waste", "weekday", "month"]
CATEGORICAL = ["meal_type"]


def _features(frame: pd.DataFrame) -> pd.DataFrame:
    result = frame.copy()
    dates = pd.to_datetime(result["date"])
    result["weekday"] = dates.dt.weekday
    result["month"] = dates.dt.month
    return result[NUMERIC + CATEGORICAL]


def train_model() -> tuple[Pipeline, float]:
    history = pd.read_csv(DATA_PATH)
    model = Pipeline([
        ("features", ColumnTransformer([
            ("numbers", StandardScaler(), NUMERIC),
            ("meal", OneHotEncoder(handle_unknown="ignore"), CATEGORICAL),
        ])),
        ("regression", Ridge(alpha=2.0)),
    ])
    model.fit(_features(history), history["actual_consumption"])
    score = float(model.score(_features(history), history["actual_consumption"]))
    return model, score


MODEL, TRAINING_R2 = train_model()


def predict_demand(inputs: dict) -> float:
    estimate = MODEL.predict(_features(pd.DataFrame([inputs])))[0]
    return max(0.0, min(float(inputs["expected_students"]), float(estimate)))
