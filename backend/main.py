import os
import uuid
from pathlib import Path
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from detector import detect_temporal_errors

app = FastAPI(title="Video Temporal Error Detector API")

# Allow all origins for free-tier cross-origin requests from Vercel
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = Path("/tmp/uploads")
OUTPUT_DIR = Path("/tmp/outputs")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

@app.get("/")
def root():
    return {"status": "Video Temporal Error Detector API is running"}

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/analyze")
async def analyze_video(file: UploadFile = File(...)):
    allowed = (".mp4", ".avi", ".mov", ".mkv", ".webm")
    if not file.filename.lower().endswith(allowed):
        raise HTTPException(400, "Unsupported file type. Use mp4, avi, mov, mkv, or webm.")

    job_id = str(uuid.uuid4())
    input_path = UPLOAD_DIR / f"{job_id}_{file.filename}"
    output_path = OUTPUT_DIR / f"{job_id}_annotated.mp4"

    with open(input_path, "wb") as f:
        content = await file.read()
        f.write(content)

    try:
        frames, summary = detect_temporal_errors(str(input_path), str(output_path))
    except Exception as e:
        raise HTTPException(500, f"Analysis failed: {str(e)}")
    finally:
        if input_path.exists():
            os.remove(input_path)

    return JSONResponse({
        "job_id": job_id,
        "summary": summary,
        "frames": frames,
        "annotated_video_url": f"/video/{job_id}_annotated.mp4"
    })

@app.get("/video/{filename}")
def get_video(filename: str):
    # Sanitize filename to prevent path traversal
    safe_name = Path(filename).name
    path = OUTPUT_DIR / safe_name
    if not path.exists():
        raise HTTPException(404, "Video not found. Note: free tier storage is temporary.")
    return FileResponse(str(path), media_type="video/mp4", filename=safe_name)
