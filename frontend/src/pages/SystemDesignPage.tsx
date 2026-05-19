import './SystemDesignPage.css'

const SystemDesignPage = () => {
  const layers = [
    {
      title: 'Frontend Layer',
      color: '#6366f1',
      items: [
        { name: 'React + TypeScript', desc: 'UI framework with type safety' },
        { name: 'Vite', desc: 'Fast build tool with code splitting' },
        { name: 'Lazy Loading', desc: 'Pages load only when needed' },
        { name: 'Memoization', desc: 'Prevents unnecessary re-renders' },
      ]
    },
    {
      title: 'API Layer',
      color: '#8b5cf6',
      items: [
        { name: 'Express.js', desc: 'REST API framework' },
        { name: 'JWT Auth', desc: 'Stateless authentication' },
        { name: 'Rate Limiting', desc: 'Prevents abuse and spam' },
        { name: 'Helmet', desc: 'Security headers' },
        { name: 'Compression', desc: 'Gzip responses for speed' },
      ]
    },
    {
      title: 'AI Layer',
      color: '#22c55e',
      items: [
        { name: 'OpenAI GPT-4o mini', desc: 'Language model for chat' },
        { name: 'RAG Pipeline', desc: 'Document-aware responses' },
        { name: 'Embeddings', desc: 'Semantic similarity search' },
        { name: 'Circuit Breaker', desc: 'Fault tolerance for AI calls' },
        { name: 'Retry + Backoff', desc: 'Auto-retry on failures' },
        { name: 'Streaming SSE', desc: 'Real-time token streaming' },
      ]
    },
    {
      title: 'Data Layer',
      color: '#f59e0b',
      items: [
        { name: 'PostgreSQL', desc: 'Users and message persistence' },
        { name: 'Redis', desc: 'Response caching + job queue' },
        { name: 'Vector Store', desc: 'Document embeddings storage' },
        { name: 'Bull Queue', desc: 'Async document processing' },
      ]
    },
    {
      title: 'Observability',
      color: '#ef4444',
      items: [
        { name: 'Winston Logger', desc: 'Structured logging' },
        { name: 'Morgan', desc: 'HTTP request logging' },
        { name: 'Metrics', desc: 'p50/p95/p99 response times' },
        { name: 'Health Check', desc: 'Service status monitoring' },
        { name: 'Circuit Status', desc: 'Real-time breaker states' },
      ]
    }
  ]

  const flow = [
    { step: '1', text: 'User opens app → React loads from Vite' },
    { step: '2', text: 'AuthContext checks JWT token in localStorage' },
    { step: '3', text: 'Login → POST /api/auth/login → JWT returned' },
    { step: '4', text: 'Chat message → Rate limiter → Auth check' },
    { step: '5', text: 'Cache check → Redis HIT → Instant response' },
    { step: '6', text: 'Cache MISS → RAG search → Vector similarity' },
    { step: '7', text: 'Top-k chunks retrieved → Sent as context to LLM' },
    { step: '8', text: 'OpenAI streams response → SSE → Frontend renders' },
    { step: '9', text: 'Response saved to PostgreSQL + Redis cache' },
    { step: '10', text: 'Metrics recorded → Monitoring dashboard updated' },
  ]

  const scalingStrategies = [
    {
      title: 'Horizontal Scaling',
      icon: '📈',
      desc: 'Run multiple backend instances behind a load balancer. Redis handles shared state (cache, sessions) across instances.'
    },
    {
      title: 'Database Scaling',
      icon: '🗄️',
      desc: 'Add read replicas for heavy read workloads. Index frequently queried columns. Use connection pooling (pg-pool).'
    },
    {
      title: 'Cost Optimization',
      icon: '💰',
      desc: 'Redis cache reduces OpenAI API calls by 60-80%. Use gpt-4o-mini instead of gpt-4. Limit max_tokens. Batch similar requests.'
    },
    {
      title: 'Failure Handling',
      icon: '🛡️',
      desc: 'Circuit breaker stops cascading failures. Retry with backoff handles transient errors. Fallback responses prevent user-facing crashes.'
    },
    {
      title: 'Queue Scaling',
      icon: '📋',
      desc: 'Bull queue handles async document processing. Multiple workers can process jobs in parallel. Failed jobs are retried automatically.'
    },
    {
      title: 'CDN + Caching',
      icon: '🌐',
      desc: 'Serve frontend assets from CDN. Use HTTP cache headers for static files. Redis TTL ensures fresh responses.'
    }
  ]

  return (
    <div className="sysdesign-page">
      <div className="sysdesign-container">

        <div className="sysdesign-header">
          <h1 className="sysdesign-title">🏗️ System Architecture</h1>
          <p className="sysdesign-subtitle">
            AI Knowledge Assistant — Full Stack Production System
          </p>
        </div>

        {/* Architecture layers */}
        <div className="section-title">System Layers</div>
        <div className="layers-grid">
          {layers.map(layer => (
            <div key={layer.title} className="layer-card">
              <div className="layer-title" style={{ color: layer.color }}>
                {layer.title}
              </div>
              {layer.items.map(item => (
                <div key={item.name} className="layer-item">
                  <div className="layer-item-name"
                    style={{ borderLeftColor: layer.color }}>
                    {item.name}
                  </div>
                  <div className="layer-item-desc">{item.desc}</div>
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Request flow */}
        <div className="section-title">Request Flow — End to End</div>
        <div className="flow-list">
          {flow.map(item => (
            <div key={item.step} className="flow-item">
              <div className="flow-step">{item.step}</div>
              <div className="flow-text">{item.text}</div>
            </div>
          ))}
        </div>

        {/* Scaling strategies */}
        <div className="section-title">Scaling + Production Strategies</div>
        <div className="scaling-grid">
          {scalingStrategies.map(s => (
            <div key={s.title} className="scaling-card">
              <div className="scaling-icon">{s.icon}</div>
              <div className="scaling-title">{s.title}</div>
              <div className="scaling-desc">{s.desc}</div>
            </div>
          ))}
        </div>

        {/* Tech stack summary */}
        <div className="section-title">Complete Tech Stack</div>
        <div className="tech-table">
          {[
            ['Frontend', 'React, TypeScript, Vite, CSS'],
            ['Backend', 'Node.js, Express.js'],
            ['Database', 'PostgreSQL'],
            ['Cache', 'Redis (Memurai)'],
            ['AI', 'OpenAI GPT-4o mini, Embeddings API'],
            ['Queue', 'Bull (Redis-based)'],
            ['Auth', 'JWT (jsonwebtoken)'],
            ['Security', 'Helmet, CORS, Rate Limiting'],
            ['Resilience', 'Circuit Breaker (Opossum), Retry'],
            ['Logging', 'Winston, Morgan'],
            ['Monitoring', 'Custom metrics, Health checks'],
            ['DevOps', 'Git, GitHub, Nodemon'],
          ].map(([category, tech]) => (
            <div key={category} className="tech-row">
              <span className="tech-category">{category}</span>
              <span className="tech-value">{tech}</span>
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}

export default SystemDesignPage