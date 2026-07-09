import { Component } from 'react'

export default class ErrorBoundary extends Component<{ children: any }> {
  state = { error: null as Error | null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  componentDidCatch(error: Error, info: any) {
    console.error('ErrorBoundary caught:', error, info)
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ minHeight: '100vh', background: '#08080f', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
          <div style={{ background: 'rgba(30,30,42,0.6)', borderRadius: 16, padding: 32, maxWidth: 480, textAlign: 'center' as const }}>
            <h2 style={{ color: 'white', marginBottom: 8 }}>Something went wrong</h2>
            <p style={{ color: '#ef4444', fontFamily: 'monospace', fontSize: 13, wordBreak: 'break-all' as const, marginBottom: 16 }}>
              {this.state.error.message}
            </p>
            <button
              onClick={() => { this.setState({ error: null }); window.location.href = '/' }}
              style={{ padding: '10px 20px', borderRadius: 12, background: '#5266eb', color: 'white', border: 'none', cursor: 'pointer' }}
            >
              Reload App
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
