import sqlite3
from pathlib import Path

DB_PATH = Path(__file__).resolve().parents[1] / "campus_food.db"


def connect():
    connection = sqlite3.connect(DB_PATH)
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA foreign_keys = ON")
    return connection


def initialize_database():
    with connect() as db:
        db.execute("""
            CREATE TABLE IF NOT EXISTS predictions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                date TEXT NOT NULL,
                meal_type TEXT NOT NULL CHECK(meal_type IN ('Breakfast','Lunch','Dinner')),
                expected_students INTEGER NOT NULL,
                previous_avg_consumption REAL NOT NULL,
                previous_food_waste REAL NOT NULL,
                predicted_demand REAL NOT NULL,
                predicted_requirement REAL NOT NULL,
                estimated_waste REAL NOT NULL,
                estimated_waste_reduction REAL NOT NULL,
                actual_consumption REAL,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
        """)
        count = db.execute("SELECT COUNT(*) FROM predictions").fetchone()[0]
        if count == 0:
            db.executemany("""
                INSERT INTO predictions
                (date, meal_type, expected_students, previous_avg_consumption,
                 previous_food_waste, predicted_demand, predicted_requirement,
                 estimated_waste, estimated_waste_reduction, actual_consumption)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, [
                ("2026-09-22", "Lunch", 440, 410, 28, 405, 425, 20, 8, 398),
                ("2026-09-23", "Dinner", 275, 250, 18, 256, 269, 13, 5, 251),
                ("2026-09-24", "Breakfast", 190, 174, 11, 177, 186, 9, 2, 173),
                ("2026-09-25", "Lunch", 460, 420, 32, 426, 447, 21, 11, 419),
                ("2026-09-26", "Dinner", 240, 228, 20, 224, 235, 11, 9, 219),
                ("2026-09-29", "Breakfast", 205, 180, 13, 190, 200, 10, 3, 184),
                ("2026-09-30", "Lunch", 430, 400, 26, 399, 419, 20, 6, 393),
                ("2026-10-01", "Dinner", 290, 260, 19, 270, 284, 14, 5, 266),
                ("2026-10-02", "Lunch", 475, 430, 35, 440, 462, 22, 13, 435),
                ("2026-10-03", "Breakfast", 165, 178, 15, 153, 161, 8, 7, 150),
                ("2026-10-04", "Dinner", 255, 230, 17, 237, 249, 12, 5, 234),
                ("2026-10-05", "Lunch", 410, 390, 24, 380, 399, 19, 5, None),
            ])

