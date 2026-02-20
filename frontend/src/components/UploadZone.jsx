import { useState, useCallback, useRef } from 'react'

const BACKEND = import.meta.env.VITE_BACKEND_URL || ''

export default function UploadZone({ onResult, onLoading, loading }) {
    const [drag, setDrag] = useState(false)
    const [file, setFile] = useState(null)
    const [error, setError] = useState('')
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
            setError(err.message || 'Upload failed. Is the backend running?')
        } finally {
            onLoading(false)
        }
    }

    return (
        <div style={{ marginBottom: 28 }}>
            {/* Hidden file input — triggered programmatically */}
            <input
                ref={inputRef}
                type="file"
                style={{ display: 'none' }}
                accept=".mp4,.mov,.avi,.mkv,.webm,video/mp4,video/quicktime,video/x-msvideo,video/x-matroska,video/webm"
                onChange={(e) => handleFile(e.target.files[0])}
            />

            {/* Clickable drop zone — plain div, NOT a label */}
            <div
                className={`upload-zone${drag ? ' drag-over' : ''}`}
                onClick={openPicker}
                onDrop={onDrop}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && openPicker()}
                aria-label="Click or drop a video file to upload"
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

            {/* Error message */}
            {error && (
                <div className="error-box">
                    <span>⚠️</span> {error}
                </div>
            )}

            {/* Analyze button / progress — outside the drop zone div */}
            {file && (
                loading ? (
                    <div className="progress-wrap">
                        <p className="progress-label">🔍 Analyzing frames with optical flow…</p>
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
