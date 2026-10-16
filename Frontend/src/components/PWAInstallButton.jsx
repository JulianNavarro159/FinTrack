import React, { useState, useEffect } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, Smartphone, X, Share2, PlusSquare, QrCode, Copy, Check } from 'lucide-react';
import QRCode from 'qrcode';

export const PWAInstallButton = ({ className = '', variant = 'navbar' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showModal, setShowModal] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [copied, setCopied] = useState(false);

  // Active App URL for the phone to access directly
  const appUrl = typeof window !== 'undefined' && !window.location.origin.includes('localhost')
    ? window.location.origin
    : 'https://ais-dev-ljrjgtinvt7o6t5yyjpgef-280105086995.us-west2.run.app';

  useEffect(() => {
    QRCode.toDataURL(appUrl, {
      width: 220,
      margin: 2,
      color: {
        dark: '#1e1b4b',
        light: '#ffffff'
      }
    })
      .then((url) => setQrCodeUrl(url))
      .catch((err) => console.warn('QR code generation failed:', err));
  }, [appUrl]);

  // If already installed as a standalone PWA on phone, hide button
  if (isInstalled) {
    return null;
  }

  const handleClick = async () => {
    // If Android / Chrome native prompt is ready, trigger it directly
    if (isInstallable) {
      const outcome = await install();
      if (!outcome) {
        setShowModal(true);
      }
    } else {
      setShowModal(true);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(appUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isAuthVariant = variant === 'auth';

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className={className || (isAuthVariant ? 'btn-pwa-auth' : 'btn-pwa-install')}
        style={
          isAuthVariant
            ? {
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.45rem',
                width: '100%',
                marginTop: '0.75rem',
                padding: '0.65rem 1rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--primary)',
                backgroundColor: 'var(--primary-light)',
                color: 'var(--primary)',
                fontSize: '0.85rem',
                fontWeight: '600',
                cursor: 'pointer'
              }
            : {
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                backgroundColor: '#eef2ff',
                color: '#4f46e5',
                border: '1px solid #c7d2fe',
                borderRadius: '9999px',
                padding: '0.35rem 0.75rem',
                fontSize: '0.8rem',
                fontWeight: '600',
                cursor: 'pointer'
              }
        }
        title="Instalar FinTrack en tu teléfono"
      >
        <Smartphone size={15} />
        <span>Instalar en Teléfono</span>
      </button>

      {showModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            backdropFilter: 'blur(4px)'
          }}
          onClick={() => setShowModal(false)}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              maxWidth: '420px',
              width: '100%',
              padding: '1.5rem',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
              color: '#0f172a'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, #4f46e5, #059669)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff'
                  }}
                >
                  <Smartphone size={20} />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '700' }}>Instalar FinTrack en tu Móvil</h4>
                  <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748b' }}>App nativa rápida en tu pantalla de inicio</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#94a3b8',
                  padding: '4px'
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* QR Code Section for Fast Phone Access */}
            <div
              style={{
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '1rem',
                textAlign: 'center',
                marginBottom: '1rem'
              }}
            >
              <span style={{ fontSize: '0.8rem', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '0.5rem' }}>
                Escanea con la cámara de tu teléfono:
              </span>
              {qrCodeUrl ? (
                <img
                  src={qrCodeUrl}
                  alt="QR Code FinTrack"
                  style={{
                    width: '160px',
                    height: '160px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    margin: '0 auto 0.5rem auto',
                    display: 'block'
                  }}
                />
              ) : (
                <div style={{ height: '160px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <QrCode size={48} className="text-muted" />
                </div>
              )}
              <div style={{ fontSize: '0.75rem', color: '#4f46e5', wordBreak: 'break-all', padding: '0.25rem 0.5rem', backgroundColor: '#eef2ff', borderRadius: '6px', margin: '0.4rem 0' }}>
                {appUrl}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    padding: '0.35rem 0.75rem',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    backgroundColor: '#ffffff',
                    fontSize: '0.78rem',
                    fontWeight: '600',
                    color: '#334155',
                    cursor: 'pointer'
                  }}
                >
                  {copied ? <Check size={14} style={{ color: '#059669' }} /> : <Copy size={14} />}
                  <span>{copied ? '¡Enlace copiado!' : 'Copiar enlace al móvil'}</span>
                </button>
              </div>
            </div>

            {/* Step by step for iOS and Android */}
            <div style={{ fontSize: '0.85rem', color: '#334155', lineHeight: '1.5' }}>
              <div style={{ marginBottom: '0.65rem' }}>
                <strong style={{ color: '#0f172a', display: 'block', marginBottom: '0.2rem' }}>
                  📱 En iPhone / iPad (Safari):
                </strong>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#475569' }}>
                  <Share2 size={15} style={{ color: '#4f46e5', flexShrink: 0 }} />
                  <span>1. Toca el botón <strong>Compartir</strong> en la barra inferior.</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#475569', marginTop: '0.2rem' }}>
                  <PlusSquare size={15} style={{ color: '#059669', flexShrink: 0 }} />
                  <span>2. Elige <strong>Añadir a pantalla de inicio</strong>.</span>
                </div>
              </div>

              <div>
                <strong style={{ color: '#0f172a', display: 'block', marginBottom: '0.2rem' }}>
                  🤖 En Android (Chrome):
                </strong>
                <span style={{ color: '#475569' }}>
                  Toca el menú (<strong>⋮</strong>) y selecciona <strong>Instalar aplicación</strong> o <strong>Añadir a inicio</strong>.
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowModal(false)}
              style={{
                width: '100%',
                marginTop: '1.25rem',
                padding: '0.65rem 1rem',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: '#4f46e5',
                color: '#ffffff',
                fontSize: '0.875rem',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Listo
            </button>
          </div>
        </div>
      )}
    </>
  );
};
