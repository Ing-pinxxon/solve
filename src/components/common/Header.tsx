import React, { useRef } from 'react';

interface HeaderProps {
  themeMode: 'light' | 'dark';
  onChangeTheme: (theme: 'light' | 'dark') => void;
  currency: string;
  onChangeCurrency: (currency: string) => void;
  onExport: () => void;
  onImport: (file: File) => void;
}

export const Header: React.FC<HeaderProps> = ({
  themeMode,
  onChangeTheme,
  currency,
  onChangeCurrency,
  onExport,
  onImport,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onImport(e.target.files[0]);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <header className="main-header glass-panel animate-fade-in">
      <div className="header-container">
        {/* Logotipo Simplificado Móvil */}
        <div className="header-logo" onClick={() => window.location.reload()}>
          <span className="logo-spark">⚡</span>
          <span className="logo-text text-gradient">$olve</span>
        </div>

        {/* Acciones Compactadas en Píldoras en una Sola Fila */}
        <div className="header-actions">
          {/* Selector de Divisa Ultra Compacto */}
          <select
            className="currency-select-compact mono-numbers"
            value={currency}
            onChange={(e) => onChangeCurrency(e.target.value)}
            title="Seleccionar divisa"
          >
            <option value="$">$</option>
            <option value="COP">COP</option>
            <option value="MXN">MXN</option>
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
            <option value="ARS">ARS</option>
          </select>

          {/* Botón de Alternancia de Tema en Píldora */}
          <button
            type="button"
            className="btn-theme-compact-pill"
            onClick={() => onChangeTheme(themeMode === 'dark' ? 'light' : 'dark')}
            title={themeMode === 'dark' ? 'Modo Claro' : 'Modo Oscuro'}
          >
            {themeMode === 'dark' ? '🛸' : '☕'}
          </button>

          {/* Botones de Respaldo */}
          <button
            type="button"
            className="btn-theme-compact-pill"
            onClick={onExport}
            title="Exportar respaldo JSON"
          >
            📤
          </button>
          <button
            type="button"
            className="btn-theme-compact-pill"
            onClick={triggerFileInput}
            title="Cargar respaldo JSON"
          >
            📥
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".json"
            style={{ display: 'none' }}
          />
        </div>
      </div>

      <style>{`
        .main-header {
          position: sticky;
          top: 0;
          width: 100%;
          padding: 8px 12px;
          margin-bottom: 20px;
          z-index: 1000;
          border-radius: 16px;
          background: var(--glass-bg);
          border: 1px solid var(--glass-border);
        }

        .header-container {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
        }

        .header-logo {
          display: flex;
          align-items: center;
          gap: 4px;
          cursor: pointer;
        }

        .logo-spark {
          font-size: 1.1rem;
        }

        .logo-text {
          font-weight: 800;
          font-size: 1rem;
          letter-spacing: 0.05em;
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        /* Selector de Divisas en Píldora Compacta */
        .currency-select-compact {
          background: var(--surface-active);
          border: 1px solid var(--surface-border);
          color: var(--text-primary);
          padding: 6px 8px;
          border-radius: 9999px; /* Pill */
          font-family: var(--font-sans);
          font-weight: bold;
          font-size: 0.75rem;
          cursor: pointer;
          outline: none;
          height: 32px;
          transition: all var(--transition-fast);
        }

        .currency-select-compact:hover {
          border-color: var(--text-muted);
        }

        /* Botón Píldora Circular */
        .btn-theme-compact-pill {
          background: var(--surface-active);
          border: 1px solid var(--surface-border);
          color: var(--text-primary);
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 0.85rem;
          transition: all var(--transition-fast);
          padding: 0;
        }

        .btn-theme-compact-pill:hover {
          background: var(--surface-hover);
          border-color: var(--text-muted);
          transform: scale(1.05);
        }
      `}</style>
    </header>
  );
};
