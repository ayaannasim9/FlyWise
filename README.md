# FlyWise

## FlyWise AI Skeleton (FastAPI)

Run the mock AI service locally to unblock the frontend.

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
