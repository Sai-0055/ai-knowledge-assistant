import { useState, lazy, Suspense } from 'react'
import { useAuth } from './context/AuthContext'
import LoginPage from './pages/LoginPage'
import HealthIndicator from './components/HealthIndicator'

// Lazy load pages — they only load when user navigates to them
// This makes the initial page load much faster
const ChatPage   = lazy(() => import('./pages/ChatPage'))
const UploadPage = lazy(() => import('./pages/UploadPage'))
const SearchPage = lazy(() => import('./pages/SearchPage'))

type Page = 'chat' | 'upload' | 'search'

// Loading spinner shown while lazy page loads
const PageLoader = () => (
  <div style={{
    flex: 1, display: 'flex', alignItems: 'center',
    justifyContent: 'center', background: '#0a0a14'
  }}>
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    <div style={{
      width: 32, height: 32, border: '3px solid #2a2a4a',
      borderTopColor: '#6366f1', borderRadius: '50%',
      animation: 'spin 0.7s linear infinite'
    }} />
  </div>
)

function App() {
  const { user, loading } = useAuth()
  const [currentPage, setCurrentPage] = useState<Page>('chat')

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

  const navItems: { id: Page; label: string; icon: string }[] = [
    { id: 'chat',   label: 'Chat',        icon: '💬' },
    { id: 'upload', label: 'Upload Docs', icon: '📄' },
    { id: 'search', label: 'Search',      icon: '🔍' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>

      {/* Navigation */}
      <nav style={{
        background: '#13131f',
        borderBottom: '1px solid #2a2a3d',
        padding: '8px 24px',
        display: 'flex',
        gap: '6px',
        alignItems: 'center'
      }}>
        {navItems.map(item => (
          <button
            key={item.id}
            onClick={() => setCurrentPage(item.id)}
            style={{
              padding: '6px 16px',
              borderRadius: '20px',
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'inherit',
              fontSize: '13px',
              fontWeight: '500',
              background: currentPage === item.id ? '#6366f1' : 'transparent',
              color: currentPage === item.id ? 'white' : '#6b7280',
              transition: 'all 0.15s'
            }}
          >
            {item.icon} {item.label}
          </button>
        ))}

        <div style={{ marginLeft: 'auto' }}>
          <HealthIndicator />
        </div>
      </nav>

      {/* Suspense wraps lazy loaded pages */}
      <Suspense fallback={<PageLoader />}>
        {currentPage === 'chat'   && <ChatPage />}
        {currentPage === 'upload' && <UploadPage />}
        {currentPage === 'search' && <SearchPage />}
      </Suspense>

    </div>
  )
}

export default App