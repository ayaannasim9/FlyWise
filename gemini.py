import os
import json
from urllib.parse import quote_plus
from fastapi import FastAPI, HTTPException, Query
from typing import Optional
from dotenv import load_dotenv
from google import genai
from google.genai import types

# Load .env file with GEMINI_API_KEY
load_dotenv()

app = FastAPI(title="Hotel Recommendation API")

from fastapi import APIRouter
router = APIRouter(prefix="", tags=["hotels"])


GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    raise RuntimeError("GEMINI_API_KEY not found in environment")

client = genai.Client(api_key=GEMINI_API_KEY)
MODEL = "gemini-flash-latest"


def build_prompt(destination, arrival, departure, budget, travelers, purpose, property_type, must_have, vibe):
    return f"""
You are a Booking.com travel concierge. Suggest properties in {destination} for a stay from {arrival} to {departure}.
Traveler details:
- Budget per night: {budget}
- Number of travelers: {travelers}
- Purpose: {purpose}
- Preferred property type: {property_type}
- Desired vibe: {vibe}
- Must-have features/amenities: {must_have}

Return ONLY JSON in this exact shape:

{{
  "destination": "...",
  "dates": {{
    "arrival": "...",
    "departure": "..."
  }},
  "hotels": [
    {{
      "name": "...",
      "area": "...",
      "approx_price_per_night": 0,
      "suitability": "...",
      "pros": ["..."],
      "cons": ["..."],
      "booking_link": "https://www.booking.com/..."
    }}
  ],
  "notes": ["..."]
}}

Provide realistic Booking.com properties that match the traveler profile. For each hotel add a `booking_link`
that points to Booking.com (use a plausible search URL for the hotel and destination).
"""


@router.get("/hotels")
def get_hotels(
    destination: str = Query(..., description="City or area to stay in"),
    arrival_date: str = Query(..., description="YYYY-MM-DD"),
    departure_date: str = Query(..., description="YYYY-MM-DD"),
    budget_per_night: Optional[float] = Query(200, description="Budget per night"),
    travelers: Optional[int] = Query(1, description="Number of travelers"),
    purpose: Optional[str] = Query("leisure", description="leisure, business, etc."),
    property_type: Optional[str] = Query("Hotel", description="Hotel, apartment, villa, etc."),
    vibe: Optional[str] = Query("modern", description="Desired vibe or style"),
    must_have: Optional[str] = Query("pool, breakfast included", description="Comma separated amenities"),
):
    """GET /hotels?destination=Paris&arrival_date=2025-04-01&departure_date=2025-04-05&budget_per_night=150"""
    prompt = build_prompt(
        destination,
        arrival_date,
        departure_date,
        budget_per_night,
        travelers,
        purpose,
        property_type,
        must_have,
        vibe,
    )

    contents = [
        types.Content(
            role="user",
            parts=[types.Part.from_text(text=prompt)],
        )
    ]

    try:
        response = client.models.generate_content(
            model=MODEL,
            contents=contents,
            config=types.GenerateContentConfig(
                thinking_config=types.ThinkingConfig(thinking_budget=-1)
            ),
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gemini error: {e}")

    raw_text = getattr(response, "text", None)
    if not raw_text:
        try:
            raw_text = response.candidates[0].content.parts[0].text
        except Exception:
            raise HTTPException(status_code=500, detail="Unable to read Gemini response")

    try:
        # --- Clean Gemini output before parsing ---
        cleaned = raw_text.strip()

        # Remove Markdown code fences if present
        if cleaned.startswith("```"):
            cleaned = cleaned.strip("`")
            # Split by newline and remove language tag (like "json")
            parts = cleaned.split("\n", 1)
            if len(parts) > 1:
                cleaned = parts[1]
            cleaned = cleaned.strip("`").strip()

        # Try to load JSON
        json_data = json.loads(cleaned)
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail=f"Gemini returned invalid JSON: {raw_text}")

    def ensure_booking_link(name: str) -> str:
        base = "https://www.booking.com/searchresults.html"
        checkin_year, checkin_month, checkin_day = arrival_date.split("-")
        checkout_year, checkout_month, checkout_day = departure_date.split("-")
        params = {
            "ss": f"{name} {destination}",
            "checkin_year": checkin_year,
            "checkin_month": checkin_month,
            "checkin_monthday": checkin_day,
            "checkout_year": checkout_year,
            "checkout_month": checkout_month,
            "checkout_monthday": checkout_day,
            "group_adults": travelers,
            "group_children": 0,
            "group_rooms": 1,
        }
        query = "&".join(f"{key}={quote_plus(str(value))}" for key, value in params.items())
        return f"{base}?{query}"

    hotels = json_data.get("hotels", [])
    if isinstance(hotels, list):
        for hotel in hotels:
            if isinstance(hotel, dict):
                hotel["booking_link"] = ensure_booking_link(hotel.get("name", destination))
                price = hotel.get("approx_price_per_night")
                try:
                    price = float(price)
                except (TypeError, ValueError):
                    price = None
                if not price or price <= 0:
                    hotel["approx_price_per_night"] = float(budget_per_night or 200)
                else:
                    hotel["approx_price_per_night"] = price

    return json_data


@router.get("/")
def root():
    return {
        "message": "Hotel Recommendation API",
        "usage": "/hotels?destination=Rome&arrival_date=2025-06-10&departure_date=2025-06-15&budget_per_night=120",
    }
