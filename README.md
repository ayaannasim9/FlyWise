# FlyWise

## FlyWise AI Skeleton (FastAPI)

Run the mock AI service locally to unblock the frontend.

### Snowflake-Powered Search Analytics

The Express server can log every flight search into Snowflake and expose trending routes in the UI. Provide the following environment variables (e.g. inside `.env`) and restart `node index.js`:

```
SNOWFLAKE_ACCOUNT=xy12345.eu-west-2
SNOWFLAKE_USER=FLYWISE
SNOWFLAKE_PASSWORD=********
SNOWFLAKE_WAREHOUSE=COMPUTE_WH
SNOWFLAKE_DATABASE=FLYWISE
SNOWFLAKE_SCHEMA=PUBLIC
```

Once configured, the API will create a `FLYWISE_SEARCHES` table (if needed), append each `/roundtrip` or `/oneway` query, and serve aggregated data from `GET /analytics/routes`. The frontend’s “Snowflake insights” section on the results page reads that endpoint to highlight the most popular routes in real time.

### ElevenLabs Pronunciation (optional)

Add these env vars to enable localized phrase audio in the results view:

```
ELEVENLABS_API_KEY=your_api_key
# optional custom voice
ELEVENLABS_VOICE_ID=21m00Tcm4TlvDq8ikWAM
# optional parody voices surfaced in the UI
VITE_ELEVENLABS_TRUMP_VOICE=voice_id_here
VITE_ELEVENLABS_MODI_VOICE=voice_id_here
VITE_ELEVENLABS_ELON_VOICE=voice_id_here
```

When configured, `/phrase-guide/:lang` returns regional phrases and `/phrase-guide/audio` streams ElevenLabs TTS so users can hear “Namaste”, “Konnichiwa”, etc., before they land.

### Air Quality Guardian (optional)

Enable OpenWeather’s air-pollution agent by adding:

```
OPENWEATHER_API_KEY=your_key_here
```

The backend’s `/health/aqi` endpoint will then surface AQI forecasts, wellbeing advice, and safer travel windows.

### Run

```
pip install -r requirements.txt
uvicorn main:app --reload --port 7860
```

### Try it

```
curl -X POST http://localhost:7860/recommend -H "Content-Type: application/json" -d '{
  "origin":"MAN","destination":"MXP","month":"2025-12","stay_len":15
}'
```
