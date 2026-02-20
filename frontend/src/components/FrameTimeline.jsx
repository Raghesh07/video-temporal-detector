import { useState } from 'react'

export default function FrameTimeline({ frames, onFrameClick }) {
    const [hoveredIdx, setHoveredIdx] = useState(null)

    const clsKey = (cls) => {
        if (cls === 'Frame Drop') return 'drop'
        if (cls === 'Frame Merge') return 'merge'
        return 'normal'
    }

    // Downsample for large videos so segments don't get microscopic
    const MAX_SEGS = 600
    const step = frames.length > MAX_SEGS ? Math.ceil(frames.length / MAX_SEGS) : 1
    const displayed = frames.filter((_, i) => i % step === 0)

    return (
        <div className="timeline-wrap">
            <p className="section-title">
                🕒 Frame Timeline
                <span>{frames.length} frames</span>
            </p>

            <div
                className="timeline-bar"
                title="Click any segment to jump to that frame in the table"
            >
                {displayed.map((f, i) => (
                    <div
                        key={f.frame_number}
                        className={`timeline-seg ${clsKey(f.classification)}`}
                        title={`#${f.frame_number} — ${f.classification} (${(f.confidence * 100).toFixed(0)}%) @ ${f.timestamp_sec.toFixed(2)}s`}
                        onMouseEnter={() => setHoveredIdx(i)}
                        onMouseLeave={() => setHoveredIdx(null)}
                        onClick={() => onFrameClick && onFrameClick(f.frame_number)}
                        style={{ opacity: hoveredIdx !== null && hoveredIdx !== i ? 0.6 : 1 }}
                    />
                ))}
            </div>

            <div className="timeline-legend">
                {[['normal', '✅ Normal'], ['drop', '⏩ Frame Drop'], ['merge', '🔀 Frame Merge']].map(([cls, label]) => (
                    <div className="legend-item" key={cls}>
                        <div className={`legend-dot ${cls}`} />
                        {label}
                    </div>
                ))}
                {step > 1 && (
                    <div className="legend-item" style={{ marginLeft: 'auto' }}>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                            Showing every {step}th frame
                        </span>
                    </div>
                )}
            </div>
        </div>
    )
}
