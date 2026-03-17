import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--ink-3)', fontFamily: 'inherit' }}>
          <p style={{ fontSize: '15px', marginBottom: '12px' }}>Algo salió mal.</p>
          <a href="/" style={{ fontSize: '13px', color: 'var(--accent)', fontWeight: 600 }}>
            Volver al inicio
          </a>
        </div>
      )
    }
    return this.props.children
  }
}
