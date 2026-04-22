from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.ideas import router as ideas_router

app = FastAPI(title="Socratix API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(ideas_router)


@app.get("/health")
def health_check() -> dict:
    return {"status": "ok"}
