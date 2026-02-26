import React from 'react';

interface State { hasError: boolean; error: Error | null; }

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('=== CRASH BRUMERIE ===', error.message, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 24, fontFamily: 'monospace', background: '#fff', minHeight: '100vh' }}>
          <h2 style={{ color: '#e11d48', fontSize: 18, fontWeight: 900 }}>❌ Erreur détectée</h2>
          <p style={{ color: '#334155', fontSize: 13, marginTop: 8 }}>
            <strong>{this.state.error?.message}</strong>
          </p>
          <pre style={{ background: '#f1f5f9', padding: 12, borderRadius: 8, fontSize: 11, marginTop: 12, overflowX: 'auto', whiteSpace: 'pre-wrap' }}>
            {this.state.error?.stack}
          </pre>
          <button onClick={() => window.location.reload()}
            style={{ marginTop: 16, padding: '12px 24px', background: '#16a34a', color: 'white', border: 'none', borderRadius: 12, fontWeight: 900, fontSize: 12 }}>
            Recharger l'application
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
