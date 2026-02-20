export default function SummaryCards({ summary }) {
    const cards = [
        { icon: '🎞️', value: summary.total_frames, label: 'Total Frames', cls: 'sc-blue' },
        { icon: '✅', value: summary.normal, label: 'Normal', cls: 'sc-green' },
        { icon: '⏩', value: summary.frame_drops, label: 'Frame Drops', cls: 'sc-red' },
        { icon: '🔀', value: summary.frame_merges, label: 'Frame Merges', cls: 'sc-orange' },
        { icon: '📽️', value: `${summary.fps?.toFixed(1)} fps`, label: 'Frame Rate', cls: 'sc-purple' },
        { icon: '⏱️', value: `${summary.duration_sec}s`, label: 'Duration', cls: 'sc-blue' },
        { icon: '📊', value: `${summary.median_interval_ms} ms`, label: 'Median Interval', cls: 'sc-purple' },
        { icon: '🚨', value: `${summary.drop_threshold_ms} ms`, label: 'Drop Threshold', cls: 'sc-red' },
    ]

    const normal = summary.normal || 0
    const total = summary.total_frames || 1
    const healthPct = Math.round((normal / total) * 100)

    return (
        <>
            <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                <p className="section-title">📋 Analysis Summary</p>
                <span style={{
                    padding: '4px 14px',
                    borderRadius: '99px',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    background: healthPct >= 90 ? 'rgba(16,185,129,0.15)' : healthPct >= 70 ? 'rgba(245,158,11,0.15)' : 'rgba(239,68,68,0.12)',
                    color: healthPct >= 90 ? 'var(--green)' : healthPct >= 70 ? 'var(--orange)' : 'var(--red)',
                }}>
                    {healthPct}% Healthy
                </span>
            </div>
            <div className="summary-grid">
                {cards.map((c) => (
                    <div className="summary-card" key={c.label}>
                        <div className="sc-icon">{c.icon}</div>
                        <div className={`sc-value ${c.cls}`}>{c.value}</div>
                        <div className="sc-label">{c.label}</div>
                    </div>
                ))}
            </div>
        </>
    )
}
