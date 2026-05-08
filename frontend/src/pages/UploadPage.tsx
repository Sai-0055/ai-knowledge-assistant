import { useState, useRef } from 'react'
import './UploadPage.css'

interface UploadResult {
  success: boolean
  fileName: string
  chunksProcessed: number
  totalDocuments: number
  message: string
}

const UploadPage = () => {
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState<UploadResult | null>(null)
  const [error, setError] = useState('')
  const [stats, setStats] = useState<any>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const uploadFile = async (file: File) => {
    setUploading(true)
    setError('')
    setResult(null)

    try {
      const token = localStorage.getItem('token')
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('http://localhost:5000/api/documents/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Upload failed')
      } else {
        setResult(data)
        fetchStats()
      }
    } catch {
      setError('Upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('http://localhost:5000/api/documents/stats', {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      setStats(data)
    } catch { }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) uploadFile(file)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) uploadFile(file)
  }

  return (
    <div className="upload-page">
      <div className="upload-container">
        <div className="upload-header">
          <div className="upload-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
              stroke="white" strokeWidth="2">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="12" y1="18" x2="12" y2="12"/>
              <line x1="9" y1="15" x2="15" y2="15"/>
            </svg>
          </div>
          <h1 className="upload-title">Document Upload</h1>
          <p className="upload-subtitle">
            Upload PDF or text files to make them searchable with AI
          </p>
        </div>

        {/* Drop Zone */}
        <div
          className={`drop-zone ${dragging ? 'dragging' : ''} ${uploading ? 'uploading' : ''}`}
          onDragOver={e => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileRef.current?.click()}
        >
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.txt"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />

          {uploading ? (
            <div className="upload-loading">
              <div className="upload-spinner" />
              <p>Processing document...</p>
              <p className="upload-hint">Extracting text and generating embeddings</p>
            </div>
          ) : (
            <div className="upload-prompt">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="1.5">
                <polyline points="16 16 12 12 8 16"/>
                <line x1="12" y1="12" x2="12" y2="21"/>
                <path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3"/>
              </svg>
              <p className="drop-text">
                {dragging ? 'Drop file here!' : 'Drag & drop or click to upload'}
              </p>
              <p className="drop-hint">Supports PDF and TXT files up to 10MB</p>
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="upload-error">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            {error}
          </div>
        )}

        {/* Success */}
        {result && (
          <div className="upload-success">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            <div>
              <div className="success-title">
                {result.fileName} uploaded successfully!
              </div>
              <div className="success-detail">
                {result.chunksProcessed} chunks processed •
                {result.totalDocuments} total chunks in knowledge base
              </div>
            </div>
          </div>
        )}

        {/* Stats */}
        {stats && (
          <div className="upload-stats">
            <div className="stats-icon">📚</div>
            <div className="stats-text">{stats.message}</div>
          </div>
        )}

        {/* Info cards */}
        <div className="info-grid">
          <div className="info-card">
            <div className="info-num">1</div>
            <div className="info-text">Upload your PDF or text document</div>
          </div>
          <div className="info-card">
            <div className="info-num">2</div>
            <div className="info-text">AI splits it into chunks and generates embeddings</div>
          </div>
          <div className="info-card">
            <div className="info-num">3</div>
            <div className="info-text">Ask questions about your document in chat</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default UploadPage