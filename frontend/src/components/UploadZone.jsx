import { useState, useCallback, useRef } from 'react'

const BACKEND = import.meta.env.VITE_BACKEND_URL || ''

// Ping health endpoint until backend is awake (Render free tier cold start)
async function warmupBackend(onStatus) {
    const MAX_WAIT_MS = 60000
    const INTERVAL_MS = 3000
    const start = Date.now()
    while (Date.now() - start < MAX_WAIT_MS) {
        try {
            const res = await fetch(`${BACKEND}/health`, { signal: AbortSignal.timeout(5000) })
            if (res.ok) return true
        } catch (_) { /* still sleeping */ }
        const elapsed = Math.round((Date.now() - start) / 1000)
        onStatus(`⏳ Backend waking up… ${elapsed}s (Render cold start, up to 60s)`)
        await new Promise(r => setTimeout(r, INTERVAL_MS))
    }
    return false
}

export default function UploadZone({ onResult, onLoading, loading }) {
    const [drag, setDrag] = useState(false)
    const [file, setFile] = useState(null)
    const [error, setError] = useState('')
    const [warmingUp, setWarmingUp] = useState(false)
    const [warmupMsg, setWarmupMsg] = useState('')
    const inputRef = useRef(null)

    const handleFile = (f) => {
        if (!f) return
        if (!f.name.match(/\.(mp4|mov|avi|mkv|webm)$/i)) {
            setError('Unsupported file type. Use MP4, MOV, AVI, MKV, or WebM.')
            return
        }
        setError('')
        setFile(f)
    }

    const onDrop = useCallback((e) => {
        e.preventDefault()
        setDrag(false)
        handleFile(e.dataTransfer.files[0])
    }, [])

    const onDragOver = (e) => { e.preventDefault(); setDrag(true) }
    const onDragLeave = () => setDrag(false)
    const openPicker = () => inputRef.current?.click()

    const analyze = async () => {
        if (!file) return
        setError('')
        setWarmupMsg('')

        // Step 1: Quick health check — if backend is sleeping, warm it up first
        try {
            await fetch(`${BACKEND}/health`, { signal: AbortSignal.timeout(4000) })
        } catch (_) {
            // Backend is sleeping — start warmup loop
            setWarmingUp(true)
            setWarmupMsg('⏳ Backend waking up… (Render cold start, up to 60s)')
            const awake = await warmupBackend(setWarmupMsg)
            setWarmingUp(false)
            if (!awake) {
                setError('Backend did not wake up in time. Please try again in a moment.')
                return
            }
            setWarmupMsg('')
        }

        // Step 2: Send the video for analysis
        onLoading(true)
        try {
            const fd = new FormData()
            fd.append('file', file)
            const res = await fetch(`${BACKEND}/analyze`, { method: 'POST', body: fd })
            if (!res.ok) {
                const msg = await res.json().catch(() => ({}))
                throw new Error(msg.detail || `Server error ${res.status}`)
            }
            const data = await res.json()
            data._backendUrl = BACKEND
            onResult(data)
        } catch (err) {
            setError(err.message || 'Analysis failed. Please try again.')
        } finally {
            onLoading(false)
        }
    }

    const busy = loading || warmingUp

    return (
        <div style={{ marginBottom: 28 }}>
            <input
                ref={inputRef}
                type="file"
                style={{ display: 'none' }}
                accept=".mp4,.mov,.avi,.mkv,.webm,video/mp4,video/quicktime,video/x-msvideo,video/x-matroska,video/webm"
                onChange={(e) => handleFile(e.target.files[0])}
            />

            <div
                className={`upload-zone${drag ? ' drag-over' : ''}`}
                onClick={!busy ? openPicker : undefined}
                onDrop={onDrop}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && !busy && openPicker()}
                aria-label="Click or drop a video file to upload"
                style={{ cursor: busy ? 'default' : 'pointer' }}
            >
                <span className="upload-icon">🎬</span>
                {file ? (
                    <>
                        <h2 style={{ color: 'var(--accent)' }}>{file.name}</h2>
                        <p>{(file.size / 1024 / 1024).toFixed(2)} MB — ready to analyze</p>
                    </>
                ) : (
                    <>
                        <h2>Drop your video here</h2>
                        <p>or click to browse files</p>
                        <p className="file-types">MP4 · MOV · AVI · MKV · WebM</p>
                    </>
                )}
            </div>

            {error && (
                <div className="error-box">
                    <span>⚠️</span> {error}
                </div>
            )}

            {file && (
                busy ? (
                    <div className="progress-wrap">
                        <p className="progress-label">
                            {warmingUp ? warmupMsg : '🔍 Analyzing frames with optical flow…'}
                        </p>
                        <div className="progress-bar"><div className="progress-fill" /></div>
                    </div>
                ) : (
                    <button
                        className="btn-analyze"
                        onClick={(e) => { e.stopPropagation(); analyze() }}
                    >
                        ⚡ Analyze Video
                    </button>
                )
            )}
        </div>
    )
}
