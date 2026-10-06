# Campus Plate

Campus Plate is an AI-assisted meal planning dashboard for college cafeterias. It forecasts portions for upcoming meal services, records each forecast, and makes expected surplus visible so staff can plan with less waste.

## Problem and solution

Campus kitchens often prepare food from rough estimates and previous habits. That can mean empty trays at busy services and avoidable leftovers at quieter ones. Campus Plate combines expected turnout with recent cafeteria observations and historical meal records to produce a demand estimate and a practical preparation recommendation.

## Architecture and stack

- **Frontend:** React, Vite, JavaScript/JSX, CSS, Recharts, Lucide icons
- **Backend:** Python, FastAPI, Pydantic REST schemas
- **Database:** SQLite (`backend/campus_food.db`, created on startup)
- **ML:** pandas and scikit-learn `Pipeline` with `StandardScaler`, `OneHotEncoder`, and Ridge regression

The browser calls the FastAPI service at `http://localhost:8000/api`. The API validates input, asks the local prediction service for demand, persists the resulting forecast in SQLite, and returns the saved record. There are no paid APIs or API keys.

## AI/ML approach

`backend/app/data/cafeteria_history.csv` contains 30 realistic sample meal records. Each row records date, meal type, expected students, previous average consumption, previous waste, and observed actual consumption. The model is trained on startup using expected students, recent consumption, previous waste, weekday, month, and meal type to estimate actual portions consumed. Numerical inputs are scaled; meal type is one-hot encoded; Ridge regression fits the training examples. Predictions are bounded to 0–expected students. The service recommends a 5% buffer above predicted demand, rounds preparation up to a whole portion, and compares projected surplus with the user's previous waste to estimate reduction.

The model endpoint returns the algorithm, feature names, sample size, and in-sample training R². This is a teaching/demo model trained on a small synthetic dataset; that R² is not a measure of real-world or held-out accuracy.

## Database structure

SQLite table `predictions` stores one row per forecast: date, meal type, expected students, prior average consumption, prior food waste, predicted demand, recommended portions, estimated waste, estimated waste reduction, optional actual consumption, and creation time. Startup creates the table and inserts twelve demo records only when the table is empty. Sample observed training rows remain in the CSV, separate from forecast history.

## Setup

Requirements: Python 3.10+ and Node.js 18+. From the project root, open two terminals.

### Backend

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload
```

API documentation is available at `http://localhost:8000/docs`.

### Frontend

```powershell
cd frontend
npm install
npm run dev
```

Open the Vite URL shown in the terminal (normally `http://localhost:5173`). To build a production bundle, run `npm run build` from `frontend/`.

## API endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/` | API name and docs location |
| `POST` | `/api/predictions` | Validate, forecast, and save a meal prediction |
| `GET` | `/api/predictions?limit=100` | List newest predictions (limit 1–500) |
| `GET` | `/api/dashboard` | Aggregate totals and waste estimates |
| `GET` | `/api/history` | Date-aggregated chart series |
| `GET` | `/api/model` | Model method, feature list, sample count, and training fit |

Example request:

```json
{
  "date": "2026-10-07",
  "meal_type": "Lunch",
  "expected_students": 420,
  "previous_avg_consumption": 390,
  "previous_food_waste": 28
}
```

## Example workflow

1. Start the backend and frontend.
2. Review the preloaded dashboard and history.
3. Choose the service date and meal, then enter student turnout and previous service figures.
4. Generate the forecast. The result card shows predicted demand, the buffered preparation recommendation, estimated surplus, and estimated waste reduction.
5. The new prediction appears in the table and charts; dashboard totals refresh from SQLite.

## Limitations

- The included dataset is small and synthetic. Replace it with measured campus service records before operational use.
- The reported training R² is in-sample, so it can overstate performance on unseen meals.
- Historical demo records are seeded for the dashboard; they are examples, not live campus data.
- Estimates assume previous waste is a useful comparison and use a fixed 5% buffer. They do not model recipes, portion sizes, weather, holidays, dietary demand, or uncertainty intervals.
- Actual consumption can be stored in the database, but this MVP has no staff entry flow for completing a meal record.

## Future improvements

- Collect actual served and leftover amounts after every meal and retrain from campus data.
- Add confidence ranges and evaluate with time-based train/test splits.
- Include calendar events, weather, menu/recipe, and dietary preferences when available.
- Let staff record actual consumption and compare forecast error over time.
- Add authentication and roles if deployed beyond a local demo.
