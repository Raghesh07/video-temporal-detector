import { useState } from 'react'
import UploadZone from './components/UploadZone'
import SummaryCards from './components/SummaryCards'
import FrameTimeline from './components/FrameTimeline'
import VideoPlayer from './components/VideoPlayer'
import FrameTable from './components/FrameTable'

export default function App() {
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState(null)
    const [scrollToFrame, setScrollToFrame] = useState(null)

    const handleResult = (data) => {
        setResult(data)
        setScrollToFrame(null)
    }

    const videoUrl = result
        ? `${result._backendUrl || ''}${result.annotated_video_url}`
        : null

    return (
        <div className="app">
            <header className="header">
                <h1>Video Temporal Error Detector</h1>
                <p>Detect frame drops & merges with optical flow analysis — free & open-source</p>
            </header>

            <UploadZone
                onResult={handleResult}
                onLoading={setLoading}
                loading={loading}
            />

            {result && (
                <>
                    <SummaryCards summary={result.summary} />

                    <FrameTimeline
                        frames={result.frames}
                        onFrameClick={(frameNumber) => setScrollToFrame(frameNumber)}
                    />

                    <VideoPlayer videoUrl={videoUrl} />

                    <FrameTable
                        frames={result.frames}
                        scrollToFrame={scrollToFrame}
                    />

                    <div style={{ textAlign: 'center', marginTop: 24 }}>
                        <button
                            onClick={() => { setResult(null); setScrollToFrame(null) }}
                            style={{
                                padding: '10px 28px',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--border)',
                                background: 'transparent',
                                color: 'var(--text-secondary)',
                                cursor: 'pointer',
                                fontFamily: 'Inter, sans-serif',
                                fontSize: '0.875rem',
                                transition: 'all 0.2s',
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)' }}
                            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-secondary)' }}
                        >
                            ↩ Analyze Another Video
                        </button>
                    </div>
                </>
            )}

            <footer style={{ textAlign: 'center', marginTop: 60, color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                Backend on <a href="https://render.com" target="_blank" rel="noreferrer" style={{ color: 'var(--accent)', textDecoration: 'none' }}>Render.com</a>
                &nbsp;·&nbsp;
                Frontend on <a href="https://vercel.com" target="_blank" rel="noreferrer" style={{ color: 'var(--accent)', textDecoration: 'none' }}>Vercel</a>
            </footer>
        </div>
    )
}
