from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.db.database import Base, engine
from app import models
from app.routes import auth, investigations, uploads


Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Security Evidence Contradiction Resolver",
    description="Multi-Agent Security Investigation and Evidence Reconciliation System",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

app.include_router(auth.router)
app.include_router(investigations.router)
app.include_router(uploads.router)


@app.get("/")
def root():
    return {
        "message": "Security Evidence Contradiction Resolver API is running"
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy"
    }