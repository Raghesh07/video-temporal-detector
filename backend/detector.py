import cv2
import numpy as np
from dataclasses import dataclass, asdict
from typing import List, Tuple

@dataclass
class FrameResult:
    frame_number: int
    timestamp_sec: float
    interval_sec: float
    motion_magnitude: float
    classification: str  # "Normal", "Frame Drop", "Frame Merge"
    confidence: float

def detect_temporal_errors(video_path: str, output_path: str) -> Tuple[List[dict], dict]:
    """
    Hybrid detection algorithm:
    1. Timestamp Analysis  → detects Frame Drops via irregular time intervals
    2. Optical Flow (Farneback) → detects Frame Merges via motion magnitude spikes
    3. Adaptive Statistical Thresholding → no hardcoded magic numbers
    """

    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        raise ValueError(f"Cannot open video: {video_path}")

    fps = cap.get(cv2.CAP_PROP_FPS)
    if fps <= 0:
        fps = 25.0

    # ---- Pass 1: Read all frames ----
    raw_frames = []
    frame_idx = 0
    while True:
        ret, frame = cap.read()
        if not ret:
            break
        timestamp = cap.get(cv2.CAP_PROP_POS_MSEC) / 1000.0
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        raw_frames.append((frame_idx, timestamp, frame.copy(), gray))
        frame_idx += 1
    cap.release()

    if len(raw_frames) < 2:
        raise ValueError("Video too short — need at least 2 frames")

    # ---- Pass 2: Compute intervals and optical flow ----
    intervals = []
    motions = []

    for i in range(1, len(raw_frames)):
        prev = raw_frames[i - 1]
        curr = raw_frames[i]
        interval = curr[1] - prev[1]
        intervals.append(interval)
        flow = cv2.calcOpticalFlowFarneback(
            prev[3], curr[3], None,
            pyr_scale=0.5, levels=3, winsize=15,
            iterations=3, poly_n=5, poly_sigma=1.2, flags=0
        )
        mag = np.mean(np.sqrt(flow[..., 0] ** 2 + flow[..., 1] ** 2))
        motions.append(float(mag))

    # ---- Pass 3: Adaptive thresholds ----
    median_interval = float(np.median(intervals))
    median_motion = float(np.median(motions))
    std_motion = float(np.std(motions)) if np.std(motions) > 0 else 0.1

    drop_threshold = median_interval * 1.8
    merge_threshold = median_motion + 2.5 * std_motion

    # ---- Pass 4: Classify each frame ----
    results: List[FrameResult] = []
    results.append(FrameResult(0, raw_frames[0][1], 0.0, 0.0, "Normal", 1.0))

    for i in range(1, len(raw_frames)):
        frame_idx, timestamp, _, _ = raw_frames[i]
        interval = intervals[i - 1]
        motion = motions[i - 1]
        classification = "Normal"
        confidence = 0.95

        if interval > drop_threshold:
            classification = "Frame Drop"
            ratio = (interval / median_interval - 1.8)
            confidence = float(min(0.99, 0.70 + ratio * 0.15))
        elif motion > merge_threshold:
            classification = "Frame Merge"
            ratio = (motion - median_motion) / (std_motion * 5)
            confidence = float(min(0.99, 0.70 + ratio * 0.15))

        results.append(FrameResult(frame_idx, timestamp, interval, motion, classification, confidence))

    # ---- Pass 5: Generate annotated output video ----
    h, w = raw_frames[0][2].shape[:2]
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    writer = cv2.VideoWriter(output_path, fourcc, fps, (w, h))

    color_map = {
        "Normal":      (0, 210, 90),
        "Frame Drop":  (0, 60, 220),
        "Frame Merge": (0, 140, 255)
    }

    for i, (fidx, ts, frame, _) in enumerate(raw_frames):
        r = results[i]
        color = color_map[r.classification]
        annotated = frame.copy()
        if r.classification != "Normal":
            cv2.rectangle(annotated, (0, 0), (w - 1, h - 1), color, 10)
        label = f"#{fidx}  {r.classification}  ({r.confidence:.0%})"
        (tw, th), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.65, 2)
        cv2.rectangle(annotated, (0, 0), (tw + 16, 36), (0, 0, 0), -1)
        cv2.putText(annotated, label, (8, 26), cv2.FONT_HERSHEY_SIMPLEX, 0.65, color, 2)
        writer.write(annotated)
    writer.release()

    total = len(results)
    summary = {
        "total_frames": total,
        "normal": sum(1 for r in results if r.classification == "Normal"),
        "frame_drops": sum(1 for r in results if r.classification == "Frame Drop"),
        "frame_merges": sum(1 for r in results if r.classification == "Frame Merge"),
        "fps": fps,
        "duration_sec": round(raw_frames[-1][1], 3),
        "median_interval_ms": round(median_interval * 1000, 2),
        "drop_threshold_ms": round(drop_threshold * 1000, 2),
        "merge_motion_threshold": round(merge_threshold, 4),
    }

    return [asdict(r) for r in results], summary
