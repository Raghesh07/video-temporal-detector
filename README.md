# 🎬 Video Temporal Error Detector

Detect **frame drops** and **frame merges** in any video using a hybrid algorithm:
optical flow (Farneback) + adaptive statistical thresholding. No signup, no Docker, 100% free.

| Layer | Stack | Hosting |
|-------|-------|---------|
| Backend | FastAPI + OpenCV | Render.com (free) |
| Frontend | React + Vite | Vercel (free) |

---

## Project Structure

```
video-temporal-detector/
├── backend/
│   ├── main.py          FastAPI server
│   ├── detector.py      Detection algorithm
│   ├── requirements.txt Python dependencies
│   └── render.yaml      Render.com IaC config
├── frontend/
│   ├── public/index.html
│   ├── src/
│   │   ├── App.jsx / App.css
│   │   └── components/
│   │       ├── UploadZone.jsx
│   │       ├── SummaryCards.jsx
│   │       ├── FrameTimeline.jsx
│   │       ├── VideoPlayer.jsx
│   │       └── FrameTable.jsx
│   ├── package.json
│   ├── vite.config.js
│   └── vercel.json
├── .env.example
└── README.md
```

---

## Local Development

### 1. Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

API will be live at `http://localhost:8000`

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

App will be live at `http://localhost:5173`

The Vite dev proxy forwards `/analyze` and `/video` requests to `localhost:8000` automatically.

---

## Deploying for Free

### Backend → Render.com

1. Push this repo to GitHub.
2. Go to [render.com](https://render.com) → **New → Web Service**.
3. Connect your GitHub repo.
4. Set **Root Directory** to `backend`.
5. Render will auto-detect `render.yaml` — click **Deploy**.
6. Copy your Render service URL (e.g. `https://video-temporal-detector-api.onrender.com`).

> **Note:** Render free tier spins down after 15 min of inactivity. First request after sleep takes ~30 s.

### Frontend → Vercel

1. Go to [vercel.com](https://vercel.com) → **New Project** → import your repo.
2. Set **Root Directory** to `frontend`.
3. Add an **Environment Variable**:
   - Key: `VITE_BACKEND_URL`
   - Value: your Render service URL (no trailing slash)
4. Click **Deploy**.

---

## Detection Algorithm

| Step | Method | Detects |
|------|--------|---------|
| 1 | Timestamp interval analysis | Frame Drops (irregular intervals > 1.8× median) |
| 2 | Farneback optical flow | Frame Merges (motion magnitude > median + 2.5σ) |
| 3 | Adaptive thresholding | No hardcoded magic numbers |

Output: annotated MP4 with colored overlays + per-frame JSON.

---

## Supported Formats

MP4 · MOV · AVI · MKV · WebM
