import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
}

/**
 * Barrera de errores global: si algo falla en el render, muestra una pantalla
 * amigable en lugar de dejar la app en blanco. Los datos locales no se pierden.
 */
export class ErrorBoundary extends React.Component<React.PropsWithChildren, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[$olve] Error de render:', error, info.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div
        style={{
          minHeight: '100dvh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 12,
          padding: 24,
          textAlign: 'center',
          background: '#ECE9FB',
          color: '#3B315B',
          fontFamily: "'Outfit', 'Inter', -apple-system, sans-serif",
        }}
      >
        <div style={{ fontSize: '2.4rem' }}>😵</div>
        <h1 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>Algo salió mal</h1>
        <p style={{ fontSize: '0.85rem', maxWidth: 300, margin: 0, color: '#746C8E' }}>
          Ocurrió un error inesperado. Tus deudas están guardadas y no se perdieron.
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          style={{
            marginTop: 8,
            padding: '13px 28px',
            border: 'none',
            borderRadius: 9999,
            background: 'linear-gradient(145deg, #B79BFF, #8B5CF6)',
            color: '#fff',
            fontWeight: 700,
            fontSize: '0.9rem',
            cursor: 'pointer',
            boxShadow: '8px 8px 20px rgba(124,58,237,0.38), -4px -4px 12px rgba(255,255,255,0.45)',
          }}
        >
          Recargar la app
        </button>
      </div>
    );
  }
}
