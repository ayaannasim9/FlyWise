import os
import json
from fastapi import FastAPI, HTTPException, Query
from typing import Optional
from dotenv import load_dotenv
from google import genai
from google.genai import types

# Load .env file with GEMINI_API_KEY
load_dotenv()

app = FastAPI(title="Hotel Recommendation API")

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    raise RuntimeError("GEMINI_API_KEY not found in environment")

client = genai.Client(api_key=GEMINI_API_KEY)
MODEL = "gemini-flash-latest"


def build_prompt(destination, arrival, departure, budget, travelers, purpose):
    return f"""
You are a travel planner. Suggest hotels in {destination} for a stay from {arrival} to {departure}.
Traveler details:
- Budget per night: {budget}
- Number of travelers: {travelers}
- Purpose: {purpose}

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
      "cons": ["..."]
    }}
  ],
  "notes": ["..."]
}}

Provide realistic hotel suggestions for the destination, matching the budget and purpose.
"""


@app.get("/hotels")
def get_hotels(
    destination: str = Query(..., description="City or area to stay in"),
    arrival_date: str = Query(..., description="YYYY-MM-DD"),
    departure_date: str = Query(..., description="YYYY-MM-DD"),
    budget_per_night: Optional[float] = Query(None, description="Budget per night"),
    travelers: Optional[int] = Query(1, description="Number of travelers"),
    purpose: Optional[str] = Query("leisure", description="leisure, business, etc."),
):
    """GET /hotels?destination=Paris&arrival_date=2025-04-01&departure_date=2025-04-05&budget_per_night=150"""
    prompt = build_prompt(destination, arrival_date, departure_date, budget_per_night, travelers, purpose)

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
        json_data = json.loads(raw_text)
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail=f"Gemini returned invalid JSON: {raw_text}")

    return json_data


@app.get("/")
def root():
    return {
        "message": "Hotel Recommendation API",
        "usage": "/hotels?destination=Rome&arrival_date=2025-06-10&departure_date=2025-06-15&budget_per_night=120",
    }