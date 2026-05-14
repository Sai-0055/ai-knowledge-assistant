import { useState, useEffect } from 'react'

interface HealthData {
  status: string
  services: {
    database: string
    redis: string
    circuitBreakers: Record<string, {
      state: string
      stats: {
        successes: number
        failures: number
      }
    }>
  }
}

const HealthIndicator = () => {
  const [health, setHealth] = useState<HealthData | null>(null)
  const [show, setShow] = useState(false)

  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch('http://localhost:5000/health')
        const data = await res.json()
        setHealth(data)
      } catch {
        setHealth(null)
      }
    }
    check()
    const interval = setInterval(check, 30000)
    return () => clearInterval(interval)
  }, [])

  const isHealthy = health?.status === 'OK'
  const hasOpenCircuit = health?.services?.circuitBreakers &&
    Object.values(health.services.circuitBreakers).some(
      (cb: any) => cb.state === 'open'
    )

  return (
    <div style={{ position: 'relative' }}>
      <div
        onClick={() => setShow(!show)}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          cursor: 'pointer', padding: '4px 10px',
          borderRadius: 20, background: '#1a1a2e',
          border: '1px solid #2a2a3d', fontSize: 12,
          color: hasOpenCircuit ? '#f59e0b' : isHealthy ? '#22c55e' : '#ef4444'
        }}
      >
        <div style={{
          width: 7, height: 7, borderRadius: '50%',
          background: hasOpenCircuit ? '#f59e0b' : isHealthy ? '#22c55e' : '#ef4444',
          animation: hasOpenCircuit ? 'pulse 1s infinite' : 'none'
        }} />
        {hasOpenCircuit ? 'Degraded' : isHealthy ? 'Healthy' : 'Offline'}
      </div>

      {show && health && (
        <div style={{
          position: 'absolute', right: 0, top: '100%', marginTop: 8,
          background: '#13131f', border: '1px solid #2a2a3d',
          borderRadius: 10, padding: 14, minWidth: 220, zIndex: 100
        }}>
          <div style={{ fontSize: 11, color: '#555577', marginBottom: 8,
            textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            System Health
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[
              { label: 'Database', status: health.services?.database },
              { label: 'Redis', status: health.services?.redis },
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between',
                fontSize: 12 }}>
                <span style={{ color: '#9999cc' }}>{item.label}</span>
                <span style={{ color: item.status === 'connected' ? '#22c55e' : '#ef4444' }}>
                  {item.status || 'unknown'}
                </span>
              </div>
            ))}

            {health.services?.circuitBreakers &&
              Object.entries(health.services.circuitBreakers).map(([name, cb]: any) => (
                <div key={name} style={{ display: 'flex', justifyContent: 'space-between',
                  fontSize: 12 }}>
                  <span style={{ color: '#9999cc' }}>{name}</span>
                  <span style={{
                    color: cb.state === 'closed' ? '#22c55e' :
                           cb.state === 'half-open' ? '#f59e0b' : '#ef4444'
                  }}>
                    {cb.state}
                  </span>
                </div>
              ))
            }
          </div>
        </div>
      )}
    </div>
  )
}

export default HealthIndicator