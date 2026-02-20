export default function VideoPlayer({ videoUrl }) {
    return (
        <div className="video-wrap">
            <p className="section-title">🎬 Annotated Output Video</p>
            <video
                src={videoUrl}
                controls
                playsInline
                preload="metadata"
            />
            <p style={{ marginTop: 12, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                🟢 Green border = Normal &nbsp;|&nbsp; 🔵 Blue border = Frame Drop &nbsp;|&nbsp; 🟠 Orange border = Frame Merge
            </p>
            <a
                href={videoUrl}
                download
                style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    marginTop: 14,
                    padding: '8px 18px',
                    background: 'rgba(59,130,246,0.12)',
                    border: '1px solid var(--accent)',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--accent)',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    textDecoration: 'none',
                    transition: 'background 0.2s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(59,130,246,0.22)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(59,130,246,0.12)'}
            >
                ⬇️ Download Annotated Video
            </a>
        </div>
    )
}
