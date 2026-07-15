import React, { useState } from 'react';
import { useAuth } from '../../auth/AuthContext';

type Mode = 'signin' | 'signup' | 'reset';

export function AuthModal() {
  const {
    authModalOpen,
    authModalReason,
    closeAuthModal,
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    signInWithApple,
    resetPassword,
  } = useAuth();

  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  if (!authModalOpen) return null;

  const reset = () => {
    setError(null);
    setInfo(null);
  };

  const handleSocial = async (provider: 'google' | 'apple') => {
    reset();
    setLoading(true);
    const fn = provider === 'google' ? signInWithGoogle : signInWithApple;
    const { error } = await fn();
    if (error) {
      setError(error);
      setLoading(false);
    }
    // En éxito, el navegador redirige al proveedor; no reseteamos loading.
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    reset();
    setLoading(true);

    if (mode === 'reset') {
      const { error } = await resetPassword(email);
      setLoading(false);
      if (error) setError(error);
      else setInfo('Te enviamos un correo para restablecer tu contraseña.');
      return;
    }

    if (mode === 'signup') {
      const { error, needsConfirmation } = await signUpWithEmail(email, password);
      setLoading(false);
      if (error) { setError(error); return; }
      if (needsConfirmation) {
        setInfo('Cuenta creada. Revisa tu correo para confirmarla y luego inicia sesión.');
        setMode('signin');
      }
      // Si no necesita confirmación, AuthContext cierra el modal al detectar sesión.
      return;
    }

    // signin
    const { error } = await signInWithEmail(email, password);
    setLoading(false);
    if (error) setError(error);
    // En éxito, AuthContext cierra el modal automáticamente.
  };

  const title =
    mode === 'signup' ? 'Crea tu cuenta'
      : mode === 'reset' ? 'Restablecer contraseña'
        : 'Inicia sesión';

  return (
    <div className="modal-overlay" onClick={closeAuthModal}>
      <div className="modal-card auth-modal" onClick={(e) => e.stopPropagation()}>
        <button className="auth-modal-close" onClick={closeAuthModal} aria-label="Cerrar">✕</button>

        <h3 className="auth-modal-title">{title}</h3>
        {authModalReason && mode !== 'reset' && (
          <p className="auth-modal-reason">{authModalReason}</p>
        )}

        {mode !== 'reset' && (
          <>
            <div className="auth-social">
              <button type="button" className="auth-social-btn" disabled={loading} onClick={() => handleSocial('google')}>
                <GoogleIcon /> Continuar con Google
              </button>
              <button type="button" className="auth-social-btn auth-social-apple" disabled={loading} onClick={() => handleSocial('apple')}>
                <AppleIcon /> Continuar con Apple
              </button>
            </div>
            <div className="auth-divider"><span>o</span></div>
          </>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Correo</label>
            <input
              type="email"
              className="form-input"
              placeholder="tucorreo@ejemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          {mode !== 'reset' && (
            <div className="form-group">
              <label className="form-label">Contraseña</label>
              <input
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              />
            </div>
          )}

          {error && <div className="auth-msg auth-msg-error">{error}</div>}
          {info && <div className="auth-msg auth-msg-info">{info}</div>}

          <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '4px' }} disabled={loading}>
            {loading ? 'Procesando…'
              : mode === 'signup' ? 'Crear cuenta'
                : mode === 'reset' ? 'Enviar enlace'
                  : 'Entrar'}
          </button>
        </form>

        <div className="auth-modal-foot">
          {mode === 'signin' && (
            <>
              <button type="button" className="auth-link" onClick={() => { reset(); setMode('reset'); }}>
                ¿Olvidaste tu contraseña?
              </button>
              <span>
                ¿No tienes cuenta?{' '}
                <button type="button" className="auth-link" onClick={() => { reset(); setMode('signup'); }}>
                  Crear cuenta
                </button>
              </span>
            </>
          )}
          {mode === 'signup' && (
            <span>
              ¿Ya tienes cuenta?{' '}
              <button type="button" className="auth-link" onClick={() => { reset(); setMode('signin'); }}>
                Inicia sesión
              </button>
            </span>
          )}
          {mode === 'reset' && (
            <button type="button" className="auth-link" onClick={() => { reset(); setMode('signin'); }}>
              ← Volver a iniciar sesión
            </button>
          )}
          <span className="auth-privacy-note">
            Al continuar aceptas la{' '}
            <a href="/privacidad.html" target="_blank" rel="noopener noreferrer" className="auth-link">
              política de privacidad
            </a>
          </span>
        </div>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38z" />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
      <path d="M16.36 12.6c-.02-2.05 1.67-3.03 1.75-3.08-.95-1.4-2.44-1.59-2.97-1.61-1.26-.13-2.46.74-3.1.74-.64 0-1.63-.72-2.68-.7-1.38.02-2.65.8-3.36 2.03-1.43 2.49-.37 6.17 1.03 8.19.68.99 1.5 2.1 2.56 2.06 1.03-.04 1.42-.66 2.66-.66 1.24 0 1.59.66 2.68.64 1.1-.02 1.8-1 2.48-2 .78-1.15 1.1-2.26 1.12-2.32-.02-.01-2.15-.83-2.17-3.28zM14.3 6.6c.56-.68.94-1.62.84-2.56-.81.03-1.79.54-2.37 1.21-.52.6-.98 1.56-.86 2.48.9.07 1.83-.46 2.39-1.13z" />
    </svg>
  );
}
