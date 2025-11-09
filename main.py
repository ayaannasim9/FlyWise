import json
import os
from datetime import date, timedelta
from typing import Any, Dict, List, Literal, Optional

from dateutil import parser as dtparser
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from google import genai
from google.genai import types
from pydantic import BaseModel, Field

app = FastAPI(title="FlyWise AI Service", version="0.1.0")

from gemini import router as hotels_router
app.include_router(hotels_router)

from fastapi.middleware.cors import CORSMiddleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # you can later restrict this
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    raise RuntimeError("GEMINI_API_KEY not found in environment")

gemini_client = genai.Client(api_key=GEMINI_API_KEY)
GEMINI_MODEL = "gemini-flash-latest"

def _dig(obj, path: Optional[str]):
    """Walk obj using dot path like 'results.items'. Returns None if not found."""
    if not path:
        return obj
    cur = obj
    for part in path.split("."):
        if isinstance(cur, dict) and part in cur:
            cur = cur[part]
        else:
            return None
    return cur

def _guess_key(candidates, available_keys):
    for c in candidates:
        if c in available_keys:
            return c
    lower = {k.lower(): k for k in available_keys}
    for c in candidates:
        if c.lower() in lower:
            return lower[c.lower()]
    return None

def _to_iso_date(value: str) -> Optional[str]:
    try:
        d = dtparser.parse(str(value)).date()
        return d.isoformat()
    except Exception:
        return None

def normalize_price_grid(
    blob: Dict[str, Any],
    root_path: Optional[str] = None,
    date_field: Optional[str] = None,
    price_field: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """
    Normalize many possible JSON shapes into:
      [ {"date":"YYYY-MM-DD","price":float}, ... ]
    """
    arr = _dig(blob, root_path) if root_path else blob

    # If dict, try common wrappers or first list value
    if isinstance(arr, dict):
        for k in ("data", "results", "items", "flights", "prices"):
            if k in arr and isinstance(arr[k], list):
                arr = arr[k]
                break
        if isinstance(arr, dict):
            for v in arr.values():
                if isinstance(v, list):
                    arr = v
                    break

    if not isinstance(arr, list):
        raise ValueError("Could not locate an array of entries in provided JSON.")

    out: List[Dict[str, Any]] = []
    for rec in arr:
        if not isinstance(rec, dict):
            continue
        keys = set(rec.keys())
        dkey = date_field or _guess_key(
            ["date", "day", "depart", "departureDate", "startDate", "dTimeUTC", "outboundDate"],
            keys
        )
        pkey = price_field or _guess_key(
            ["price", "amount", "fare", "value", "total", "minPrice"],
            keys
        )

        # Try to resolve date
        dval = None
        if dkey:
            dval = _to_iso_date(rec.get(dkey))
        else:
            # heuristic: find any str value that parses as a date
            for k, v in rec.items():
                if isinstance(v, str):
                    cand = _to_iso_date(v)
                    if cand:
                        dval = cand
                        break
        if not dval:
            continue

        # Try to resolve price (supports nested objects)
        price_val = rec.get(pkey) if pkey else None
        if isinstance(price_val, dict):
            price_val = price_val.get("amount") or price_val.get("value") or price_val.get("total")
        if price_val is None:
            # search nested
            for v in rec.values():
                if isinstance(v, (int, float)):
                    price_val = v; break
                if isinstance(v, dict):
                    for vv in v.values():
                        if isinstance(vv, (int, float)):
                            price_val = vv; break
                    if price_val is not None:
                        break
        if price_val is None:
            continue

        try:
            out.append({"date": dval, "price": float(price_val)})
        except Exception:
            continue

    if not out:
        raise ValueError("No valid (date, price) pairs found after normalization.")
    out.sort(key=lambda r: r["date"])
    return out


class RecommendRequest(BaseModel):
    origin: str = Field(..., example="MAN")
    destination: str = Field(..., example="MXP")
    month: str = Field(..., example="2025-12")  # YYYY-MM
    stay_len: int = Field(..., example=15)

    data: Optional[Dict[str, Any]] = None
    root_path: Optional[str] = None
    date_field: Optional[str] = None
    price_field: Optional[str] = None

    itineraries: Optional[List[Dict[str, Any]]] = None


class DateWindow(BaseModel):
    start: str
    end: str
    price: float

class PackagePlan(BaseModel):
    tier: str
    total_budget: float
    flight_price: float
    hotel_price: float
    activities: List[str]

class RecommendResponse(BaseModel):
    decision: Literal["book","wait"]
    confidence: float
    best_windows: List[DateWindow]
    rationale: str
    baseline_features: dict
    packages: List[PackagePlan] = Field(default_factory=list)

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

def call_gemini_recommendation(payload: Dict[str, Any]) -> Dict[str, Any]:
    prompt = f"""
You are FlyWise's travel pricing strategist. Analyze the structured data below and decide
whether the traveler should BOOK now or WAIT for a better deal. Consider price percentiles,
trend direction, the top candidate travel windows, and recent Booking.com hotel trends.
Respond with JSON only.

DATA:
{json.dumps(payload, indent=2)}

Return JSON exactly like:
{{
  "decision": "book" | "wait",
  "confidence": 0.0-1.0,
  "rationale": "one paragraph that references prices, trends, and windows",
  "packages": [
    {{
      "tier": "budget" | "comfort" | "luxury",
      "total_budget": 0,
      "flight_price": 0,
      "hotel_price": 0,
      "activities": ["...","..."]
    }}
  ]
}}

Decision must be lowercase. Confidence must be between 0 and 1.
"""

    contents = [
        types.Content(
            role="user",
            parts=[types.Part.from_text(text=prompt)],
        )
    ]

    try:
        response = gemini_client.models.generate_content(
            model=GEMINI_MODEL,
            contents=contents,
        )
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Gemini error: {exc}") from exc

    text = getattr(response, "text", None)
    if not text:
        try:
            text = response.candidates[0].content.parts[0].text
        except Exception as exc:  # pragma: no cover - defensive
            raise HTTPException(
                status_code=502, detail="Gemini returned an empty response"
            ) from exc

    cleaned = text.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.strip("`")
        parts = cleaned.split("\n", 1)
        if len(parts) > 1:
            cleaned = parts[1]
        cleaned = cleaned.strip("`").strip()

    try:
        parsed = json.loads(cleaned)
    except json.JSONDecodeError as exc:
        raise HTTPException(
            status_code=502, detail=f"Gemini returned invalid JSON: {cleaned}"
        ) from exc

    decision = str(parsed.get("decision", "book")).strip().lower()
    if decision not in {"book", "wait"}:
        decision = "book"

    confidence = parsed.get("confidence")
    try:
        confidence = float(confidence)
    except (TypeError, ValueError):
        confidence = 0.5
    confidence = max(0.0, min(1.0, confidence))

    rationale = parsed.get("rationale") or "No rationale provided."
    raw_packages = parsed.get("packages") or []

    packages: List[Dict[str, Any]] = []
    for pkg in raw_packages:
        if not isinstance(pkg, dict):
            continue
        try:
            packages.append(
                {
                    "tier": str(pkg.get("tier", "custom")).lower(),
                    "total_budget": float(pkg.get("total_budget", 0)),
                    "flight_price": float(pkg.get("flight_price", 0)),
                    "hotel_price": float(pkg.get("hotel_price", 0)),
                    "activities": [
                        str(act) for act in pkg.get("activities", []) if act
                    ][:4],
                }
            )
        except (TypeError, ValueError):
            continue

    if not packages:
        packages = generate_default_packages(payload.get("stats", {}))

    return {
        "decision": decision,
        "confidence": confidence,
        "rationale": rationale,
        "packages": packages,
    }

def generate_default_packages(stats: Dict[str, Any]) -> List[Dict[str, Any]]:
    pmin = float(stats.get("pmin") or 500)
    p50 = float(stats.get("p50") or (pmin * 1.2))
    tiers = [
        ("budget", pmin * 0.95),
        ("comfort", (pmin + p50) / 2),
        ("luxury", p50 * 1.35),
    ]
    defaults = {
        "budget": ["Street food crawl", "City walking tour"],
        "comfort": ["Guided museum visit", "Sunset dinner cruise"],
        "luxury": ["Private driver tour", "Fine dining tasting menu"],
    }
    plans = []
    for tier, total in tiers:
        flight_price = round(total * 0.55, 2)
        hotel_price = round(total * 0.35, 2)
        plans.append(
            {
                "tier": tier,
                "total_budget": round(total, 2),
                "flight_price": flight_price,
                "hotel_price": hotel_price,
                "activities": defaults.get(tier, defaults["comfort"]),
            }
        )
    return plans

def build_payload_from_itineraries(itineraries: List[Dict[str, Any]], stay_len: int) -> Dict[str, Any]:
    prices = [
        float(itin.get("price"))
        for itin in itineraries
        if isinstance(itin.get("price"), (int, float))
    ]
    if not prices:
        raise ValueError("No prices found in itineraries")
    prices_sorted = sorted(prices)
    pmin = min(prices_sorted)
    p25 = prices_sorted[max(0, len(prices_sorted)//4 - 1)]
    p50 = prices_sorted[len(prices_sorted)//2]

    def clean_date(value: Optional[str]) -> Optional[str]:
        if not value:
            return None
        try:
            return value[:10]
        except Exception:
            return None

    windows: List[Dict[str, Any]] = []
    for itin in sorted(itineraries, key=lambda x: x.get("price", float("inf")))[:3]:
        legs = itin.get("legs") or []
        start = clean_date(legs[0]["departure"]) if legs else None
        end = clean_date(legs[-1]["arrival"]) if len(legs) > 1 else None
        if not end and start:
            try:
                sdate = dtparser.parse(start).date()
                end_date = sdate + timedelta(days=stay_len)
                end = end_date.isoformat()
            except Exception:
                end = start
        windows.append(
            {
                "start": start or itin.get("depart") or "",
                "end": end or start or "",
                "price": float(itin.get("price", p50)),
            }
        )

    return {
        "stats": {"pmin": pmin, "p25": p25, "p50": p50, "trend3d": 0.0},
        "best_windows": windows,
    }

@app.post("/recommend", response_model=RecommendResponse)
def recommend(req: RecommendRequest):
    baseline_payload: Optional[Dict[str, Any]] = None
    source = "mock"

    if req.itineraries:
        try:
            baseline_payload = build_payload_from_itineraries(
                req.itineraries, req.stay_len
            )
            source = "live-itineraries"
        except ValueError:
            baseline_payload = None

    if baseline_payload is None:
        data = load_mock_prices()
        key = f"{req.origin}->{req.destination}:{req.month}"
        if key not in data:
            raise HTTPException(
                status_code=404, detail="No mock data for this route/month"
            )
        grid = data[key]
        prices = [p["price"] for p in grid]
        pmin = min(prices)
        p50 = sorted(prices)[len(prices) // 2]
        p25 = sorted(prices)[max(0, len(prices) // 4 - 1)]
        trend3d = 0.0
        if len(prices) >= 6:
            trend3d = (
                (sum(prices[-3:]) / 3 - sum(prices[-6:-3]) / 3)
                / max(1.0, sum(prices[-6:-3]) / 3)
            )

        y, m = [int(x) for x in req.month.split("-")]
        start = date(y, m, 1)
        windows = []
        for i in range(0, len(grid) - req.stay_len):
            sdate = start + timedelta(days=i)
            edate = sdate + timedelta(days=req.stay_len)
            price = grid[i]["price"]
            score = baseline_score(
                price,
                pmin,
                p25,
                p50,
                volatility=trend3d,
                weekday_bias=weekday_bias_for(sdate),
            )
            windows.append((score, sdate.isoformat(), edate.isoformat(), price))
        windows.sort(key=lambda x: x[0])
        top = windows[:3]

        baseline_payload = {
            "stats": {"pmin": pmin, "p25": p25, "p50": p50, "trend3d": trend3d},
            "best_windows": [
                {"start": s, "end": e, "price": p} for _, s, e, p in top
            ],
        }
        source = "mock"

    gemini_payload = {
        "route": f"{req.origin}->{req.destination}",
        "month": req.month,
        "stay_len": req.stay_len,
        "best_windows": baseline_payload["best_windows"],
        "stats": baseline_payload["stats"],
        "source": source,
    }
    ai = call_gemini_recommendation(gemini_payload)
    return RecommendResponse(
        decision=ai["decision"],
        confidence=ai["confidence"],
        best_windows=[DateWindow(**w) for w in baseline_payload["best_windows"]],
        rationale=ai["rationale"],
        baseline_features=baseline_payload["stats"],
        packages=[PackagePlan(**pkg) for pkg in ai.get("packages", [])],
    )
