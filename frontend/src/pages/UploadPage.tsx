import { useState, useRef, useEffect } from 'react'
import './UploadPage.css'

interface Job {
  jobId: string
  fileName: string
  status: 'queued' | 'processing' | 'completed' | 'failed'
  progress: number
  createdAt: string
  completedAt: string | null
  result: any
  error: string | null
}

const UploadPage = () => {
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [jobs, setJobs] = useState<Job[]>([])
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const pollingRef = useRef<any>(null)

  useEffect(() => {
    fetchJobs()
    // Poll job status every 2 seconds
    pollingRef.current = setInterval(fetchJobs, 2000)
    return () => clearInterval(pollingRef.current)
  }, [])

  const fetchJobs = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('http://localhost:5000/api/documents/jobs', {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      if (data.jobs) setJobs(data.jobs)
    } catch { }
  }

  const uploadFile = async (file: File) => {
    setUploading(true)
    setError('')

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
        // Job queued — polling will update the status
        fetchJobs()
      }
    } catch {
      setError('Upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#22c55e'
      case 'processing': return '#6366f1'
      case 'failed': return '#ef4444'
      default: return '#f59e0b'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return '✅'
      case 'processing': return '⚙️'
      case 'failed': return '❌'
      default: return '⏳'
    }
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
            Documents are processed in the background — upload and continue working!
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
              <p>Adding to queue...</p>
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

        {/* Jobs Queue */}
        {jobs.length > 0 && (
          <div className="jobs-section">
            <div className="jobs-title">📋 Processing Queue</div>
            {jobs.map(job => (
              <div key={job.jobId} className="job-card">
                <div className="job-header">
                  <span className="job-icon">{getStatusIcon(job.status)}</span>
                  <span className="job-name">{job.fileName}</span>
                  <span className="job-status"
                    style={{ color: getStatusColor(job.status) }}>
                    {job.status}
                  </span>
                </div>

                {/* Progress bar */}
                {(job.status === 'processing' || job.status === 'queued') && (
                  <div className="job-progress-bar">
                    <div
                      className="job-progress-fill"
                      style={{ width: `${job.progress}%` }}
                    />
                  </div>
                )}

                {job.status === 'completed' && job.result && (
                  <div className="job-result">
                    ✅ {job.result.chunksProcessed} chunks processed and indexed
                  </div>
                )}

                {job.status === 'failed' && job.error && (
                  <div className="job-error">{job.error}</div>
                )}

                <div className="job-time">
                  Queued at {new Date(job.createdAt).toLocaleTimeString()}
                  {job.completedAt && ` • Completed at ${new Date(job.completedAt).toLocaleTimeString()}`}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Info cards */}
        <div className="info-grid">
          <div className="info-card">
            <div className="info-num">1</div>
            <div className="info-text">Upload your document — get instant response</div>
          </div>
          <div className="info-card">
            <div className="info-num">2</div>
            <div className="info-text">Background worker processes and indexes it</div>
          </div>
          <div className="info-card">
            <div className="info-num">3</div>
            <div className="info-text">Ask questions in chat once completed</div>
          </div>
        </div>

      </div>
    </div>
  )
}

export default UploadPage