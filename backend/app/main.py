from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.app.core.config import settings
from backend.app.core.database import init_db
from backend.app.api.v1 import auth, patients, documents, timeline, questions, comparison, reconciliation, changes, conflicts, audit, admin

app = FastAPI(
    title="CareLens AI - Secure Clinical History Intelligence",
    description="Evidence-backed clinical history intelligence system that securely retrieves, compares, verifies, and updates patient records.",
    version="1.0.0"
)

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register v1 Routers
api_v1_prefix = "/api/v1"
app.include_router(auth.router, prefix=api_v1_prefix)
app.include_router(patients.router, prefix=api_v1_prefix)
app.include_router(documents.router, prefix=api_v1_prefix)
app.include_router(timeline.router, prefix=api_v1_prefix)
app.include_router(questions.router, prefix=api_v1_prefix)
app.include_router(comparison.router, prefix=api_v1_prefix)
app.include_router(reconciliation.router, prefix=api_v1_prefix)
app.include_router(changes.router, prefix=api_v1_prefix)
app.include_router(conflicts.router, prefix=api_v1_prefix)
app.include_router(audit.router, prefix=api_v1_prefix)
app.include_router(admin.router, prefix=api_v1_prefix)

@app.on_event("startup")
def startup_event():
    init_db()
    from backend.app.core.database import SessionLocal, User
    db = SessionLocal()
    try:
        if db.query(User).count() == 0:
            print("[*] Empty database detected. Auto-seeding initial demo data...")
            from scripts.seed_demo_data import seed_database
            seed_database()
            print("[OK] Demo database successfully auto-seeded on startup.")
    except Exception as e:
        print(f"[!] Auto-seed exception on startup: {e}")
    finally:
        db.close()

@app.get("/")
def root():
    return {
        "system": "CareLens AI",
        "tagline": "Secure Clinical History Intelligence",
        "workflow": "Compare -> Verify -> Update",
        "security_principle": "Authorize -> Retrieve -> Generate -> Cite",
        "status": "healthy",
        "version": "1.0.0"
    }

@app.get("/health")
def health():
    return {"status": "ok"}
