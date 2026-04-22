from app.main import app

@app.get("/")
def root():
    return {"message": "Backend is running"}