import { useState, useEffect } from 'react'
import './SearchPage.css'

interface SearchResult {
  rank: number
  text: string
  fileName: string
  chunkIndex: number
  totalChunks: number
  score: number
  preview: string
}

interface Document {
  fileName: string
  totalChunks: number
  uploadedAt: string
}

const SearchPage = () => {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchDocuments()
  }, [])

  const fetchDocuments = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('http://localhost:5000/api/documents/list', {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      setDocuments(data.documents || [])
    } catch {
      console.error('Could not fetch documents')
    }
  }

  const search = async () => {
    if (!query.trim()) return
    setLoading(true)
    setError('')
    setSearched(false)

    try {
      const token = localStorage.getItem('token')
      const res = await fetch('http://localhost:5000/api/documents/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ query: query.trim(), topK: 5 })
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Search failed')
      } else {
        setResults(data.results)
        setSearched(true)
      }
    } catch {
      setError('Search failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') search()
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#22c55e'
    if (score >= 60) return '#f59e0b'
    return '#6b7280'
  }

  return (
    <div className="search-page">
      <div className="search-container">

        {/* Header */}
        <div className="search-header">
          <div className="search-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
              stroke="white" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/>
              <path d="M21 21l-4.35-4.35"/>
            </svg>
          </div>
          <h1 className="search-title">Document Search</h1>
          <p className="search-subtitle">
            Search across your uploaded documents using AI semantic search
          </p>
        </div>

        {/* Search box */}
        <div className="search-box">
          <div className="search-input-wrap">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" className="search-input-icon">
              <circle cx="11" cy="11" r="8"/>
              <path d="M21 21l-4.35-4.35"/>
            </svg>
            <input
              className="search-input"
              type="text"
              placeholder="Search your documents..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <button
              className="search-btn"
              onClick={search}
              disabled={loading || !query.trim()}
            >
              {loading ? <span className="search-spinner" /> : 'Search'}
            </button>
          </div>
        </div>

        {/* Uploaded documents list */}
        {documents.length > 0 && (
          <div className="docs-list">
            <div className="docs-list-title">📚 Indexed Documents</div>
            <div className="docs-chips">
              {documents.map((doc, i) => (
                <div key={i} className="doc-chip"
                  onClick={() => setQuery(doc.fileName.replace('.txt', '').replace('.pdf', ''))}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                  </svg>
                  {doc.fileName}
                  <span className="doc-chip-count">{doc.totalChunks} chunks</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="search-error">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            {error}
          </div>
        )}

        {/* No documents uploaded */}
        {documents.length === 0 && !loading && (
          <div className="empty-state">
            <div className="empty-icon">📄</div>
            <div className="empty-title">No documents uploaded yet</div>
            <div className="empty-desc">
              Go to Upload Docs tab to add documents, then search through them here
            </div>
          </div>
        )}

        {/* Search results */}
        {searched && (
          <div className="results-section">
            <div className="results-header">
              {results.length > 0
                ? `Found ${results.length} relevant results for "${query}"`
                : `No results found for "${query}"`}
            </div>

            {results.length === 0 && (
              <div className="no-results">
                <div>🔍</div>
                <div>Try a different search term or upload more documents</div>
              </div>
            )}

            {results.map(result => (
              <div key={result.rank} className="result-card">
                <div className="result-header">
                  <div className="result-rank">#{result.rank}</div>
                  <div className="result-file">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                      <polyline points="14 2 14 8 20 8"/>
                    </svg>
                    {result.fileName}
                    <span className="result-chunk">
                      chunk {result.chunkIndex + 1}/{result.totalChunks}
                    </span>
                  </div>
                  <div className="result-score"
                    style={{ color: getScoreColor(result.score) }}>
                    {result.score}% match
                  </div>
                </div>

                {/* Score bar */}
                <div className="score-bar">
                  <div
                    className="score-fill"
                    style={{
                      width: `${result.score}%`,
                      background: getScoreColor(result.score)
                    }}
                  />
                </div>

                <div className="result-preview">{result.preview}</div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  )
}

export default SearchPage