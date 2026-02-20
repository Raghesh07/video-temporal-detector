import { useState, useEffect, useRef } from 'react'

const PAGE_SIZE = 50

export default function FrameTable({ frames, scrollToFrame }) {
    const [filter, setFilter] = useState('All')
    const [search, setSearch] = useState('')
    const [page, setPage] = useState(0)
    const rowRefs = useRef({})

    const clsKey = (cls) => {
        if (cls === 'Frame Drop') return 'drop'
        if (cls === 'Frame Merge') return 'merge'
        return 'normal'
    }

    const filtered = frames.filter((f) => {
        const matchFilter = filter === 'All' || f.classification === filter
        const matchSearch = search === '' || String(f.frame_number).includes(search)
        return matchFilter && matchSearch
    })

    const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
    const visible = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

    // Jump to page containing scrollToFrame and scroll row into view
    useEffect(() => {
        if (scrollToFrame == null) return
        const idx = filtered.findIndex((f) => f.frame_number === scrollToFrame)
        if (idx === -1) return
        const targetPage = Math.floor(idx / PAGE_SIZE)
        setPage(targetPage)
        setTimeout(() => {
            rowRefs.current[scrollToFrame]?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }, 80)
    }, [scrollToFrame]) // eslint-disable-line

    const handleFilterChange = (f) => { setFilter(f); setPage(0) }
    const handleSearch = (e) => { setSearch(e.target.value); setPage(0) }

    return (
        <div className="table-wrap">
            <div className="table-controls">
                <input
                    className="search-input"
                    type="number"
                    placeholder="🔎  Jump to frame #"
                    value={search}
                    onChange={handleSearch}
                />
                {['All', 'Normal', 'Frame Drop', 'Frame Merge'].map((f) => (
                    <button
                        key={f}
                        className={`filter-btn${filter === f ? ' active' : ''}`}
                        onClick={() => handleFilterChange(f)}
                    >
                        {f === 'All' ? '📋 All' : f === 'Normal' ? '✅ Normal' : f === 'Frame Drop' ? '⏩ Drops' : '🔀 Merges'}
                    </button>
                ))}
            </div>

            <table className="data-table">
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Timestamp</th>
                        <th>Interval</th>
                        <th>Motion Mag.</th>
                        <th>Classification</th>
                        <th>Confidence</th>
                    </tr>
                </thead>
                <tbody>
                    {visible.map((f) => (
                        <tr key={f.frame_number} ref={(el) => (rowRefs.current[f.frame_number] = el)}>
                            <td style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{f.frame_number}</td>
                            <td>{f.timestamp_sec.toFixed(3)}s</td>
                            <td>{f.frame_number === 0 ? '—' : `${(f.interval_sec * 1000).toFixed(1)} ms`}</td>
                            <td>{f.frame_number === 0 ? '—' : f.motion_magnitude.toFixed(3)}</td>
                            <td>
                                <span className={`badge ${clsKey(f.classification)}`}>
                                    {f.classification === 'Normal' ? '✅' : f.classification === 'Frame Drop' ? '⏩' : '🔀'}
                                    {' '}{f.classification}
                                </span>
                            </td>
                            <td>
                                <div className="confidence-bar">
                                    <div className="conf-track">
                                        <div className="conf-fill" style={{ width: `${(f.confidence * 100).toFixed(0)}%` }} />
                                    </div>
                                    <span className="conf-pct">{(f.confidence * 100).toFixed(0)}%</span>
                                </div>
                            </td>
                        </tr>
                    ))}
                    {visible.length === 0 && (
                        <tr>
                            <td colSpan={6} style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>
                                No frames match this filter.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>

            <div className="table-footer">
                <span>
                    {filtered.length} frame{filtered.length !== 1 ? 's' : ''} &nbsp;·&nbsp;
                    Page {page + 1} of {Math.max(totalPages, 1)}
                </span>
                <div className="page-btns">
                    <button className="page-btn" disabled={page === 0} onClick={() => setPage(0)}>«</button>
                    <button className="page-btn" disabled={page === 0} onClick={() => setPage(p => p - 1)}>‹</button>
                    <button className="page-btn" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>›</button>
                    <button className="page-btn" disabled={page >= totalPages - 1} onClick={() => setPage(totalPages - 1)}>»</button>
                </div>
            </div>
        </div>
    )
}
