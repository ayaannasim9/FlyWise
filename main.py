from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from typing import List, Literal
import json
from datetime import date, timedelta

app = FastAPI(title="FlyWise AI Service", version="0.1.0")

class RecommendRequest(BaseModel):
    origin: str = Field(..., example="MAN")
    destination: str = Field(..., example="MXP")
    month: str = Field(..., example="2025-12")  # YYYY-MM
    stay_len: int = Field(..., example=15)

class DateWindow(BaseModel):
    start: str
    end: str
    price: float

class RecommendResponse(BaseModel):
    decision: Literal["book","wait"]
    confidence: float
    best_windows: List[DateWindow]
    rationale: str
    baseline_features: dict

def load_mock_prices():
    with open("sample_prices.json","r") as f:
        return json.load(f)

def baseline_score(price, pmin, p25, p50, volatility, weekday_bias):
    over_min = (price - pmin) / max(1.0, pmin)
    over_p25 = (price - p25) / max(1.0, p25)
    over_med = (price - p50) / max(1.0, p50)
    score = 0.5*over_min + 0.3*over_p25 + 0.2*over_med
    score += 0.2*volatility + 0.05*weekday_bias
    return score

def weekday_bias_for(d: date):
    wd = d.weekday()
    return {4:0.05,5:0.08,6:0.06}.get(wd, 0.0)

def simple_rule(price, pmin, p25, p50, vol):
    if price <= min(p25, pmin*(1.08)):
        return "book", 0.8
    if price >= p50*(1.10) and vol < 0:
        return "wait", 0.65
    if vol < -0.03:
        return "wait", 0.6
    return "book", 0.55

def mock_gemini_explainer(payload) -> dict:
    decision, conf = simple_rule(
        payload["best_windows"][0]["price"],
        payload["stats"]["pmin"],
        payload["stats"]["p25"],
        payload["stats"]["p50"],
        payload["stats"]["trend3d"],
    )
    trend_phrase = "falling" if payload["stats"]["trend3d"] < 0 else "stable/rising"
    rationale = (
        f"Best window is near the monthly minimum (£{payload['best_windows'][0]['price']:.0f} vs min £{payload['stats']['pmin']:.0f}). "
        f"Prices are {trend_phrase} over the last 3 days; therefore we recommend to "
        + ("book now." if decision=='book' else "wait briefly.")
    )
    return {"decision": decision, "confidence": conf, "rationale": rationale}

@app.post("/recommend", response_model=RecommendResponse)
def recommend(req: RecommendRequest):
    data = load_mock_prices()
    key = f"{req.origin}->{req.destination}:{req.month}"
    if key not in data:
        raise HTTPException(status_code=404, detail="No mock data for this route/month")
    grid = data[key]
    prices = [p["price"] for p in grid]
    pmin = min(prices)
    p50 = sorted(prices)[len(prices)//2]
    p25 = sorted(prices)[max(0, len(prices)//4 - 1)]
    trend3d = 0.0
    if len(prices) >= 6:
        trend3d = (sum(prices[-3:])/3 - sum(prices[-6:-3])/3) / max(1.0, sum(prices[-6:-3])/3)

    y, m = [int(x) for x in req.month.split("-")]
    start = date(y, m, 1)
    windows = []
    for i in range(0, len(grid)-req.stay_len):
        sdate = start + timedelta(days=i)
        edate = sdate + timedelta(days=req.stay_len)
        price = grid[i]["price"]
        score = baseline_score(price, pmin, p25, p50, volatility=trend3d, weekday_bias=weekday_bias_for(sdate))
        windows.append((score, sdate.isoformat(), edate.isoformat(), price))
    windows.sort(key=lambda x: x[0])
    top = windows[:3]

    baseline_payload = {
        "stats": {"pmin": pmin, "p25": p25, "p50": p50, "trend3d": trend3d},
        "best_windows": [{"start": s, "end": e, "price": p} for _, s, e, p in top]
    }
    ai = mock_gemini_explainer(baseline_payload)
    return RecommendResponse(
        decision=ai["decision"],
        confidence=ai["confidence"],
        best_windows=[DateWindow(**w) for w in baseline_payload["best_windows"]],
        rationale=ai["rationale"],
        baseline_features=baseline_payload["stats"],
    )
