from datetime import date
from typing import Literal

from pydantic import BaseModel, Field

MealType = Literal["Breakfast", "Lunch", "Dinner"]


class PredictionInput(BaseModel):
    date: date
    meal_type: MealType
    expected_students: int = Field(ge=1, le=5000)
    previous_avg_consumption: float = Field(ge=0, le=5000)
    previous_food_waste: float = Field(ge=0, le=5000)


class Prediction(PredictionInput):
    id: int
    predicted_demand: float
    predicted_requirement: float
    estimated_waste: float
    estimated_waste_reduction: float
    actual_consumption: float | None = None
    created_at: str


class DashboardStats(BaseModel):
    total_meals_predicted: int
    average_predicted_demand: float
    estimated_food_waste: float
    estimated_waste_reduction: float
    historical_waste: float

