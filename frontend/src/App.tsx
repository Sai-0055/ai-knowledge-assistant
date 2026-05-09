import { useState } from 'react'
import { useAuth } from './context/AuthContext'
import LoginPage from './pages/LoginPage'
import ChatPage from './pages/ChatPage'
import UploadPage from './pages/UploadPage'

function App() {
  const { user, loading } = useAuth()
  const [currentPage, setCurrentPage] = useState<'chat' | 'upload'>('chat')

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center',
        justifyContent: 'center', background: '#080811'
      }}>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div style={{
          width: 36, height: 36, border: '3px solid #2a2a4a',
          borderTopColor: '#6366f1', borderRadius: '50%',
          animation: 'spin 0.7s linear infinite'
        }} />
      </div>
    )
  }

  if (!user) return <LoginPage />

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>

      {/* Navigation bar */}
      <nav style={{
        background: '#13131f',
        borderBottom: '1px solid #2a2a3d',
        padding: '8px 24px',
        display: 'flex',
        gap: '8px',
        alignItems: 'center'
      }}>
        <button
          onClick={() => setCurrentPage('chat')}
          style={{
            padding: '6px 16px',
            borderRadius: '20px',
            border: 'none',
            cursor: 'pointer',
            fontFamily: 'inherit',
            fontSize: '13px',
            fontWeight: '500',
            background: currentPage === 'chat' ? '#6366f1' : 'transparent',
            color: currentPage === 'chat' ? 'white' : '#6b7280',
            transition: 'all 0.15s'
          }}
        >
          💬 Chat
        </button>
        <button
          onClick={() => setCurrentPage('upload')}
          style={{
            padding: '6px 16px',
            borderRadius: '20px',
            border: 'none',
            cursor: 'pointer',
            fontFamily: 'inherit',
            fontSize: '13px',
            fontWeight: '500',
            background: currentPage === 'upload' ? '#6366f1' : 'transparent',
            color: currentPage === 'upload' ? 'white' : '#6b7280',
            transition: 'all 0.15s'
          }}
        >
          📄 Upload Docs
        </button>
      </nav>

      {/* Page content */}
      {currentPage === 'chat' ? <ChatPage /> : <UploadPage />}

    </div>
  )
}

export default App