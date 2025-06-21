from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import uvicorn
import os

app = FastAPI(title="OpenSentinel API", version="1.0.0")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Data models
class ScanRequest(BaseModel):
    target: str
    scan_type: str
    options: Optional[dict] = {}

class ScanResult(BaseModel):
    id: str
    status: str
    findings: List[dict]

# Routes
@app.get("/")
async def root():
    return {"message": "OpenSentinel API is running"}

@app.post("/scan", response_model=ScanResult)
async def start_scan(scan_request: ScanRequest):
    # Simulate scan logic
    scan_id = f"scan-{scan_request.target.replace(' ', '-')}"
    return {
        "id": scan_id,
        "status": "running",
        "findings": []
    }

@app.get("/scan/{scan_id}", response_model=ScanResult)
async def get_scan_status(scan_id: str):
    # Simulate status check logic
    return {
        "id": scan_id,
        "status": "completed",
        "findings": [{"finding": "Sample finding"}]
    }

# Error handling for invalid scan_id
@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    return {"detail": exc.detail}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
