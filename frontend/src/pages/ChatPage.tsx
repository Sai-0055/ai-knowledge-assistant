import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import './ChatPage.css'

interface Message {
  id: number
  role: 'user' | 'bot'
  text: string
  time: string
  isError?: boolean
  isStreaming?: boolean
  usingRAG?: boolean
  sources?: string[]
}

const ChatPage = () => {
  const { user, logout } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [historyLoading, setHistoryLoading] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => { loadHistory() }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const loadHistory = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('http://localhost:5000/api/chat/history', {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      if (data.messages && data.messages.length > 0) {
        setMessages(data.messages)
      } else {
        setMessages([{
          id: 0, role: 'bot',
          text: `Hi ${user?.name}! I'm your AI Knowledge Assistant. Upload documents and I'll answer questions about them!`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }])
      }
    } catch {
      setMessages([{
        id: 0, role: 'bot',
        text: `Hi ${user?.name}! Ask me anything!`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }])
    } finally {
      setHistoryLoading(false)
    }
  }

  const clearHistory = async () => {
    try {
      const token = localStorage.getItem('token')
      await fetch('http://localhost:5000/api/chat/history', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })
      setMessages([{
        id: 0, role: 'bot',
        text: 'Chat history cleared! Start a fresh conversation.',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }])
    } catch { console.error('Could not clear history') }
  }

  const sendMessage = async () => {
    if (!input.trim() || loading) return

    const userMessage: Message = {
      id: Date.now(), role: 'user',
      text: input.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)

    const botMessageId = Date.now() + 1
    setMessages(prev => [...prev, {
      id: botMessageId, role: 'bot', text: '',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isStreaming: true
    }])

    try {
      const token = localStorage.getItem('token')
      const response = await fetch('http://localhost:5000/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ message: userMessage.text })
      })

      const contentType = response.headers.get('content-type') || ''

      if (contentType.includes('application/json')) {
        const data = await response.json()
        setMessages(prev => prev.map(msg =>
          msg.id === botMessageId
            ? { ...msg, text: data.botReply + ' ⚡', isStreaming: false }
            : msg
        ))
      } else {
        const reader = response.body!.getReader()
        const decoder = new TextDecoder()
        let buffer = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() || ''

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6))

                if (data.rag && data.sources) {
                  // RAG sources received
                  setMessages(prev => prev.map(msg =>
                    msg.id === botMessageId
                      ? { ...msg, usingRAG: true, sources: data.sources }
                      : msg
                  ))
                } else if (data.error) {
                  setMessages(prev => prev.map(msg =>
                    msg.id === botMessageId
                      ? { ...msg, text: data.error, isStreaming: false, isError: true }
                      : msg
                  ))
                } else if (data.done) {
                  setMessages(prev => prev.map(msg =>
                    msg.id === botMessageId
                      ? { ...msg, isStreaming: false }
                      : msg
                  ))
                } else if (data.text) {
                  setMessages(prev => prev.map(msg =>
                    msg.id === botMessageId
                      ? { ...msg, text: msg.text + data.text }
                      : msg
                  ))
                }
              } catch { }
            }
          }
        }
      }
    } catch (err) {
      setMessages(prev => prev.map(msg =>
        msg.id === botMessageId
          ? { ...msg, text: 'Something went wrong. Please try again.', isStreaming: false, isError: true }
          : msg
      ))
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  if (historyLoading) {
    return (
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
  }

  return (
    <div className="chat-page">

      {/* Header */}
      <header className="chat-header">
        <div className="chat-header-left">
          <div className="logo">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
              stroke="white" strokeWidth="2">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/>
              <path d="M2 17l10 5 10-5"/>
              <path d="M2 12l10 5 10-5"/>
            </svg>
          </div>
          <div>
            <div className="chat-app-name">AI Knowledge Assistant</div>
            <div className="chat-subtitle">RAG Pipeline — Day 9</div>
          </div>
        </div>

        <div className="chat-header-right">
          <button className="clear-btn" onClick={clearHistory}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
              <path d="M10 11v6M14 11v6"/>
            </svg>
            Clear
          </button>
          <div className="user-section">
            <div className="user-avatar">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="user-info">
              <span className="user-name">{user?.name}</span>
              <span className="user-role">{user?.role}</span>
            </div>
            <button className="logout-btn" onClick={logout}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Messages */}
      <div className="chat-messages">
        {messages.map(msg => (
          <div key={msg.id} className={`message-row ${msg.role}`}>
            {msg.role === 'bot' && (
              <div className="bot-avatar">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                  stroke="white" strokeWidth="2">
                  <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                  <path d="M2 17l10 5 10-5"/>
                  <path d="M2 12l10 5 10-5"/>
                </svg>
              </div>
            )}
            <div className="message-bubble-wrap">
              {/* RAG indicator */}
              {msg.usingRAG && msg.sources && (
                <div className="rag-badge">
                  📄 Answering from: {msg.sources.join(', ')}
                </div>
              )}
              <div className={`message-bubble ${msg.role} ${msg.isError ? 'error' : ''}`}>
                {msg.text}
                {msg.isStreaming && <span className="cursor" />}
              </div>
              <div className="message-time">{msg.time}</div>
            </div>
          </div>
        ))}

        {loading && messages[messages.length - 1]?.text === '' && (
          <div className="message-row bot">
            <div className="bot-avatar">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                stroke="white" strokeWidth="2">
                <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                <path d="M2 17l10 5 10-5"/>
                <path d="M2 12l10 5 10-5"/>
              </svg>
            </div>
            <div className="typing-indicator">
              <span /><span /><span />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="chat-input-area">
        <div className="chat-input-wrap">
          <textarea
            className="chat-input"
            placeholder="Ask about your documents or anything else..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            disabled={loading}
          />
          <button className="send-btn" onClick={sendMessage}
            disabled={!input.trim() || loading}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2">
              <line x1="22" y1="2" x2="11" y2="13"/>
              <polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </button>
        </div>
        <div className="chat-hint">
          Upload documents to get context-aware answers
        </div>
      </div>
    </div>
  )
}

export default ChatPage