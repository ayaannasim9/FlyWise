# app.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from flights import router as flights_router
from hotels import router as hotels_router

app = FastAPI(title="FlyWise Backend", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "*",  # tighten later to your Pages/GitHub domains
        "http://localhost:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(flights_router)
app.include_router(hotels_router)

@app.get("/")
def root():
    return {"ok": True, "service": "flywise", "routes": ["/recommend (POST)", "/hotels (GET)"]}
