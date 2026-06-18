import React, { useState, useEffect } from 'react';

interface OnboardingWizardProps {
  activeTheme: 'light' | 'dark';
  onComplete: (currency: string) => void;
}

export const OnboardingWizard: React.FC<OnboardingWizardProps> = ({ activeTheme, onComplete }) => {
  const [selectedCurrency, setSelectedCurrency] = useState('$');
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    {
      title: '1. Registra tu Perfil',
      description: 'Ingresa tus tarjetas de crédito o préstamos. El sistema audita tus tasas de interés e identifica cobros excesivos (usura).',
      icon: '📊',
      animation: 'profile-anim',
    },
    {
      title: '2. Activa tu Acelerador',
      description: 'Define un abono mensual extra (por pequeño que sea). Este capital se inyecta directamente al capital para recortar intereses.',
      icon: '⚡',
      animation: 'accelerator-anim',
    },
    {
      title: '3. Elige tu Estrategia',
      description: 'Selecciona "Agresiva" (Avalancha) para matar intereses altos primero, o "Progresiva" (Bola de Nieve) para eliminar saldos pequeños velozmente.',
      icon: '🔥',
      animation: 'strategy-anim',
    },
    {
      title: '4. Efecto Cascada',
      description: '¡El poder real! Cuando liquidas una deuda, todo su dinero se transfiere automáticamente a la siguiente, destruyéndola en tiempo récord.',
      icon: '🎉',
      animation: 'cascade-anim',
    },
  ];

  // Auto-avanzar slides como un video/historia cada 4.5 segundos
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % steps.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [steps.length]);

  return (
    <div className="onboarding-overlay animate-fade-in">
      <div className="onboarding-container glass-panel">
        <div className="onboarding-grid">
          {/* Columna Izquierda: Mensaje y Ajustes */}
          <div className="onboarding-left">
            <div className="logo-area">
              <span className="logo-icon">⚡</span>
              <span className="logo-text text-gradient">DEUDAS//ZERO</span>
            </div>
            
            <h1 className="welcome-title">Bienvenido a tu Libertad Financiera</h1>
            <p className="welcome-desc">
              Esta aplicación simula estrategias matemáticas avanzadas para ayudarte a salir de deudas en una fracción del tiempo estimado.
            </p>

            <div className="settings-box glass-card">
              <h3 className="settings-title">Personaliza tu Simulador</h3>
              
              <div className="form-group">
                <label className="form-label">Selecciona tu Divisa</label>
                <div className="currency-grid">
                  {['$', 'COP', 'MXN', 'USD', 'EUR', 'ARS'].map((curr) => (
                    <button
                      key={curr}
                      type="button"
                      className={`currency-btn ${selectedCurrency === curr ? 'active' : ''}`}
                      onClick={() => setSelectedCurrency(curr)}
                    >
                      {curr}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              type="button"
              className="btn-primary start-btn glow-success"
              onClick={() => onComplete(selectedCurrency)}
            >
              Comenzar Proyección 🚀
            </button>
          </div>

          {/* Columna Derecha: El "Video Animado" */}
          <div className="onboarding-right glass-card">
            {/* Indicadores de Progreso tipo Historias de Instagram */}
            <div className="story-indicators">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className="story-bar-track"
                  onClick={() => setActiveStep(index)}
                >
                  <div
                    className={`story-bar-fill ${index === activeStep ? 'active' : ''} ${
                      index < activeStep ? 'filled' : ''
                    }`}
                  />
                </div>
              ))}
            </div>

            <div className="story-content animate-fade-in" key={activeStep}>
              <div className="story-header">
                <span className="story-icon">{steps[activeStep].icon}</span>
                <h2 className="story-title">{steps[activeStep].title}</h2>
              </div>
              <p className="story-desc">{steps[activeStep].description}</p>
              
              {/* Contenedor del Vídeo / Animación Dinámica en HTML */}
              <div className="animation-viewport">
                {activeStep === 0 && (
                  <div className="anim-box profile-anim">
                    <div className="anim-card card-1">💳 Tarjeta Banco A <span>$3.500 (TEA 29%)</span></div>
                    <div className="anim-card card-2">🚗 Crédito Auto A <span>$12.000 (TEA 14%)</span></div>
                    <div className="anim-card card-3">🎓 Préstamo Est. C <span>$8.000 (TEA 9%)</span></div>
                  </div>
                )}

                {activeStep === 1 && (
                  <div className="anim-box accelerator-anim">
                    <div className="slider-track-mock">
                      <div className="slider-handle-mock" />
                    </div>
                    <div className="accelerator-gauge">
                      Abono Extra: <span className="mono-numbers text-gradient-emerald">+$300/mes</span>
                    </div>
                    <div className="speed-lines">
                      <div className="line line-1" />
                      <div className="line line-2" />
                      <div className="line line-3" />
                    </div>
                  </div>
                )}

                {activeStep === 2 && (
                  <div className="anim-box strategy-anim">
                    <div className="strategy-card strat-agresiva">
                      <h4>AMORTIZACIÓN AGRESIVA</h4>
                      <div className="target-aim">Ataque: TEA 29% 🎯</div>
                    </div>
                    <div className="vs-badge">VS</div>
                    <div className="strategy-card strat-progresiva">
                      <h4>AMORTIZACIÓN PROGRESIVA</h4>
                      <div className="target-aim">Ataque: Menor Saldo 🎯</div>
                    </div>
                  </div>
                )}

                {activeStep === 3 && (
                  <div className="anim-box cascade-anim">
                    <div className="liquidated-mock glow-success">🎉 ¡Banco A Pagado!</div>
                    <div className="arrow-down">⬇️ Transferencia de Capital</div>
                    <div className="cascading-payment">
                      Mínimo ($150) + Acelerador ($300) = <span className="mono-numbers text-gradient-emerald">+$450</span> directo al capital del Crédito Auto!
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .onboarding-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(4, 6, 12, 0.85);
          backdrop-filter: blur(12px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          padding: 20px;
        }

        .onboarding-container {
          max-width: 1000px;
          width: 100%;
          min-height: 580px;
          overflow: hidden;
        }

        .onboarding-grid {
          display: grid;
          grid-template-columns: 1.1fr 0.9fr;
          min-height: 580px;
        }

        .onboarding-left {
          padding: 40px;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .logo-area {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 24px;
        }

        .logo-icon {
          font-size: 1.8rem;
        }

        .logo-text {
          font-family: var(--font-sans);
          font-weight: 800;
          font-size: 1.4rem;
          letter-spacing: 0.05em;
        }

        .welcome-title {
          font-size: 2.2rem;
          font-weight: 800;
          line-height: 1.2;
          margin-bottom: 16px;
          color: var(--text-primary);
        }

        .welcome-desc {
          font-size: 1.05rem;
          line-height: 1.5;
          color: var(--text-secondary);
          margin-bottom: 30px;
        }

        .settings-box {
          margin-bottom: 30px;
          border-color: rgba(255, 255, 255, 0.05);
        }

        .settings-title {
          font-size: 0.95rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--text-secondary);
          margin-bottom: 16px;
        }

        .currency-grid {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 8px;
        }

        .currency-btn {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid var(--surface-border);
          color: var(--text-secondary);
          padding: 10px 0;
          border-radius: 6px;
          font-family: var(--font-sans);
          font-weight: 600;
          font-size: 0.9rem;
          cursor: pointer;
          transition: all var(--transition-fast);
          text-align: center;
        }

        .currency-btn:hover {
          background: rgba(255, 255, 255, 0.08);
          color: var(--text-primary);
        }

        .currency-btn.active {
          background: var(--accent-primary);
          border-color: var(--accent-primary);
          color: #FFFFFF;
          box-shadow: 0 4px 10px rgba(99, 102, 241, 0.25);
        }

        .start-btn {
          width: 100%;
          justify-content: center;
          padding: 16px;
          font-size: 1.1rem;
        }

        /* Columna Derecha - Animación Explicativa */
        .onboarding-right {
          margin: 20px;
          display: flex;
          flex-direction: column;
          background: rgba(0, 0, 0, 0.2) !important;
          border-color: rgba(255, 255, 255, 0.04) !important;
          position: relative;
          padding: 30px !important;
        }

        .story-indicators {
          display: flex;
          gap: 6px;
          margin-bottom: 24px;
        }

        .story-bar-track {
          flex: 1;
          height: 4px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 2px;
          cursor: pointer;
          overflow: hidden;
        }

        .story-bar-fill {
          height: 100%;
          width: 0%;
          background: var(--accent-primary);
          border-radius: 2px;
          transition: width 0.1s linear;
        }

        .story-bar-fill.active {
          width: 100%;
          transition: width 4.5s linear;
          background: var(--accent-primary);
        }

        .story-bar-fill.filled {
          width: 100%;
          background: rgba(255, 255, 255, 0.4);
        }

        .story-content {
          flex: 1;
          display: flex;
          flex-direction: column;
        }

        .story-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 12px;
        }

        .story-icon {
          font-size: 1.8rem;
        }

        .story-title {
          font-size: 1.3rem;
          font-weight: 700;
          color: var(--text-primary);
        }

        .story-desc {
          font-size: 0.95rem;
          line-height: 1.45;
          color: var(--text-secondary);
          margin-bottom: 24px;
          height: 60px;
        }

        /* Contenedores de Animaciones del Sistema */
        .animation-viewport {
          flex: 1;
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          position: relative;
          padding: 20px;
        }

        .anim-box {
          display: flex;
          flex-direction: column;
          gap: 12px;
          width: 100%;
          align-items: center;
        }

        /* 1. Animación de Perfil de Deudas */
        .profile-anim .anim-card {
          width: 85%;
          padding: 12px 16px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 8px;
          font-size: 0.85rem;
          font-family: var(--font-mono);
          display: flex;
          justify-content: space-between;
          animation: flyIn 0.6s cubic-bezier(0.18, 0.89, 0.32, 1.28) forwards;
          opacity: 0;
        }

        .profile-anim .card-1 { animation-delay: 0.2s; }
        .profile-anim .card-2 { animation-delay: 0.5s; }
        .profile-anim .card-3 { animation-delay: 0.8s; }

        @keyframes flyIn {
          from {
            opacity: 0;
            transform: translateX(40px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        /* 2. Animación de Acelerador */
        .accelerator-anim {
          justify-content: center;
        }

        .slider-track-mock {
          width: 80%;
          height: 6px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 3px;
          position: relative;
          margin-bottom: 20px;
        }

        .slider-handle-mock {
          width: 18px;
          height: 18px;
          background: var(--accent-emerald);
          border-radius: 50%;
          position: absolute;
          top: -6px;
          left: 10%;
          box-shadow: 0 0 10px var(--accent-emerald);
          animation: slideHandle 3s infinite ease-in-out;
        }

        .accelerator-gauge {
          font-family: var(--font-sans);
          font-weight: 700;
          font-size: 1.1rem;
        }

        .speed-lines {
          display: flex;
          gap: 15px;
          width: 60%;
          height: 4px;
          margin-top: 15px;
        }

        .speed-lines .line {
          height: 100%;
          background: var(--accent-emerald);
          border-radius: 2px;
          animation: speedCharge 1.5s infinite linear;
          opacity: 0.3;
        }

        .speed-lines .line-1 { flex: 1; animation-delay: 0.1s; }
        .speed-lines .line-2 { flex: 1.5; animation-delay: 0.3s; }
        .speed-lines .line-3 { flex: 0.8; animation-delay: 0.5s; }

        @keyframes slideHandle {
          0%, 100% { left: 10%; }
          50% { left: 75%; }
        }

        @keyframes speedCharge {
          0% { opacity: 0.2; transform: scaleX(0.5); }
          50% { opacity: 0.8; transform: scaleX(1.5); }
          100% { opacity: 0.2; transform: scaleX(0.5); }
        }

        /* 3. Animación de Estrategias */
        .strategy-anim {
          flex-direction: row !important;
          justify-content: space-around;
        }

        .strategy-card {
          width: 42%;
          padding: 12px;
          border-radius: 8px;
          text-align: center;
          border: 1px solid rgba(255, 255, 255, 0.05);
          animation: bounceScale 3s infinite ease-in-out;
        }

        .strat-agresiva {
          background: rgba(99, 102, 241, 0.1);
          border-color: var(--accent-primary);
          animation-delay: 0s;
        }

        .strat-progresiva {
          background: rgba(139, 92, 246, 0.1);
          border-color: var(--accent-violet);
          animation-delay: 1.5s;
        }

        .strategy-card h4 {
          font-size: 0.7rem;
          margin-bottom: 8px;
          letter-spacing: 0.05em;
        }

        .target-aim {
          font-family: var(--font-mono);
          font-size: 0.75rem;
          font-weight: bold;
        }

        .vs-badge {
          font-family: var(--font-sans);
          font-weight: 800;
          font-size: 0.9rem;
          color: var(--text-muted);
        }

        @keyframes bounceScale {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.08); box-shadow: 0 0 15px rgba(255,255,255,0.05); }
        }

        /* 4. Animación Cascada */
        .cascade-anim {
          justify-content: center;
        }

        .liquidated-mock {
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 0.85rem;
          font-weight: 700;
          border: 1px solid var(--accent-emerald);
          background: rgba(16, 185, 129, 0.15);
        }

        .arrow-down {
          font-size: 1.2rem;
          animation: bounceArrow 1.2s infinite ease-in-out;
        }

        .cascading-payment {
          font-size: 0.8rem;
          line-height: 1.4;
          text-align: center;
          max-width: 80%;
          color: var(--text-secondary);
        }

        @keyframes bounceArrow {
          0%, 100% { transform: translateY(-3px); }
          50% { transform: translateY(3px); }
        }

        /* Adaptabilidad Móvil */
        @media (max-width: 768px) {
          .onboarding-overlay {
            padding: 10px;
          }
          
          .onboarding-grid {
            grid-template-columns: 1fr;
            min-height: auto;
          }

          .onboarding-left {
            padding: 24px;
          }

          .welcome-title {
            font-size: 1.7rem;
          }

          .onboarding-right {
            display: none; /* Ocultar animación interactiva en móviles pequeños para simplificar */
          }
        }
      `}</style>
    </div>
  );
};
