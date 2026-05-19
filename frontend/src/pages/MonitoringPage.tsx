import { useState, useEffect } from 'react'
import './MonitoringPage.css'

interface Metrics {
  uptime: string
  requests: {
    total: number
    success: number
    errors: number
    errorRate: string
  }
  responseTimes: {
    p50: string
    p95: string
    p99: string
    avg: string
  }
  endpoints: Record<string, {
    count: number
    errors: number
    errorRate: string
    avgTime: string
    p95: string
  }>
}

const MonitoringPage = () => {
  const [metrics, setMetrics] = useState<Metrics | null>(null)
  const [health, setHealth] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<string>('')

  useEffect(() => {
    fetchAll()
    const interval = setInterval(fetchAll, 10000)
    return () => clearInterval(interval)
  }, [])

  const fetchAll = async () => {
    try {
      const [metricsRes, healthRes] = await Promise.all([
        fetch('http://localhost:5000/metrics'),
        fetch('http://localhost:5000/health')
      ])
      const [metricsData, healthData] = await Promise.all([
        metricsRes.json(),
        healthRes.json()
      ])
      setMetrics(metricsData)
      setHealth(healthData)
      setLastUpdated(new Date().toLocaleTimeString())
    } catch {
      console.error('Could not fetch metrics')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
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
    <div className="monitor-page">
      <div className="monitor-container">

        <div className="monitor-header">
          <div className="monitor-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
              stroke="white" strokeWidth="2">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
            </svg>
          </div>
          <div>
            <h1 className="monitor-title">System Monitoring</h1>
            <p className="monitor-subtitle">Last updated: {lastUpdated}</p>
          </div>
          <button className="refresh-btn" onClick={fetchAll}>
            Refresh
          </button>
        </div>

        {/* System status */}
        <div className="status-grid">
          <div className="status-card">
            <div className="status-label">Status</div>
            <div className="status-value green">
              {health?.status === 'OK' ? '🟢 Online' : '🔴 Offline'}
            </div>
          </div>
          <div className="status-card">
            <div className="status-label">Uptime</div>
            <div className="status-value">{health?.uptime || metrics?.uptime || '-'}</div>
          </div>
          <div className="status-card">
            <div className="status-label">Memory</div>
            <div className="status-value">{health?.memory?.used || '-'}</div>
          </div>
          <div className="status-card">
            <div className="status-label">Error Rate</div>
            <div className={`status-value ${
              parseInt(metrics?.requests.errorRate || '0') > 10 ? 'red' : 'green'
            }`}>
              {metrics?.requests.errorRate || '0%'}
            </div>
          </div>
        </div>

        {/* Request metrics */}
        <div className="section-title">📊 Request Metrics</div>
        <div className="metrics-grid">
          <div className="metric-card">
            <div className="metric-num">{metrics?.requests.total || 0}</div>
            <div className="metric-label">Total Requests</div>
          </div>
          <div className="metric-card">
            <div className="metric-num green">{metrics?.requests.success || 0}</div>
            <div className="metric-label">Successful</div>
          </div>
          <div className="metric-card">
            <div className="metric-num red">{metrics?.requests.errors || 0}</div>
            <div className="metric-label">Errors</div>
          </div>
        </div>

        {/* Response time percentiles */}
        <div className="section-title">⏱️ Response Times</div>
        <div className="metrics-grid">
          {[
            { label: 'p50 (median)', value: metrics?.responseTimes.p50, desc: '50% of requests faster than this' },
            { label: 'p95', value: metrics?.responseTimes.p95, desc: '95% of requests faster than this' },
            { label: 'p99', value: metrics?.responseTimes.p99, desc: '99% of requests faster than this' },
            { label: 'Average', value: metrics?.responseTimes.avg, desc: 'Mean response time' },
          ].map(item => (
            <div key={item.label} className="metric-card">
              <div className="metric-num purple">{item.value || '0ms'}</div>
              <div className="metric-label">{item.label}</div>
              <div className="metric-desc">{item.desc}</div>
            </div>
          ))}
        </div>

        {/* Circuit breakers */}
        {health?.services?.circuitBreakers &&
          Object.keys(health.services.circuitBreakers).length > 0 && (
          <>
            <div className="section-title">🔌 Circuit Breakers</div>
            <div className="cb-list">
              {Object.entries(health.services.circuitBreakers).map(([name, cb]: any) => (
                <div key={name} className="cb-card">
                  <div className="cb-name">{name}</div>
                  <div className={`cb-state ${cb.state === 'closed' ? 'green' :
                    cb.state === 'half-open' ? 'amber' : 'red'}`}>
                    {cb.state === 'closed' ? '🟢' :
                     cb.state === 'half-open' ? '🟡' : '🔴'} {cb.state}
                  </div>
                  <div className="cb-stats">
                    ✅ {cb.stats.successes} success •
                    ❌ {cb.stats.failures} failures
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Endpoint breakdown */}
        {metrics?.endpoints && Object.keys(metrics.endpoints).length > 0 && (
          <>
            <div className="section-title">🛣️ Endpoint Breakdown</div>
            <div className="endpoint-table">
              <div className="endpoint-header">
                <span>Endpoint</span>
                <span>Requests</span>
                <span>Errors</span>
                <span>Avg Time</span>
                <span>p95</span>
              </div>
              {Object.entries(metrics.endpoints).map(([endpoint, data]) => (
                <div key={endpoint} className="endpoint-row">
                  <span className="endpoint-name">{endpoint}</span>
                  <span>{data.count}</span>
                  <span className={data.errors > 0 ? 'red' : 'green'}>
                    {data.errors}
                  </span>
                  <span>{data.avgTime}</span>
                  <span>{data.p95}</span>
                </div>
              ))}
            </div>
          </>
        )}

      </div>
    </div>
  )
}

export default MonitoringPage