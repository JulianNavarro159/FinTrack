import React, { useState, useRef } from 'react';
import { api } from '../services/api';
import { Database, Download, Upload, HardDrive, CheckCircle2, AlertTriangle, X, Shield, RefreshCw } from 'lucide-react';
import Swal from 'sweetalert2';

export const StorageBackupModal = ({ isOpen, onClose, onDataRestored }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleExport = () => {
    try {
      const dataStr = api.exportBackup();
      const date = new Date().toISOString().split('T')[0];
      const filename = `fintrack-backup-${date}.json`;

      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      Swal.fire({
        icon: 'success',
        title: 'Copia descargada',
        text: `Se descargó "${filename}". Puedes guardarlo en tu Google Drive, iCloud o almacenamiento del teléfono.`,
        timer: 2500,
        showConfirmButton: false
      });
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Error al exportar',
        text: err.message || 'No se pudo generar el archivo de copia.'
      });
    }
  };

  const handleImportFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        setIsProcessing(true);
        const content = event.target?.result;
        if (typeof content !== 'string') {
          throw new Error('Formato de archivo inválido.');
        }

        api.importBackup(content);

        Swal.fire({
          icon: 'success',
          title: 'Datos restaurados',
          text: 'Tu base de datos local ha sido restaurada con éxito.',
          timer: 2000,
          showConfirmButton: false
        });

        if (onDataRestored) {
          onDataRestored();
        }
        onClose();
      } catch (err) {
        Swal.fire({
          icon: 'error',
          title: 'Error al restaurar',
          text: err.message || 'El archivo no contiene un formato de respaldo válido de FinTrack.'
        });
      } finally {
        setIsProcessing(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-card">
        <div className="modal-header">
          <div className="modal-title-wrap">
            <div className="modal-icon-badge bg-emerald">
              <HardDrive size={22} className="text-emerald" />
            </div>
            <div>
              <h3 className="modal-title">Almacenamiento y Copia de Seguridad</h3>
              <p className="modal-subtitle">
                Tus datos financieros guardados en tu propio dispositivo y en la nube
              </p>
            </div>
          </div>
          <button type="button" className="btn-icon-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: '0.5rem 0' }}>
          <div
            style={{
              backgroundColor: '#ecfdf5',
              border: '1px solid #a7f3d0',
              borderRadius: '12px',
              padding: '1rem',
              marginBottom: '1.25rem',
              display: 'flex',
              gap: '0.75rem',
              alignItems: 'flex-start'
            }}
          >
            <CheckCircle2 size={20} style={{ color: '#059669', flexShrink: 0, marginTop: '2px' }} />
            <div style={{ fontSize: '0.85rem', color: '#065f46', lineHeight: '1.5' }}>
              <strong>Base de datos en tu teléfono activa:</strong> Tus movimientos, categorías y saldos se guardan
              de forma persistente en la memoria de tu propio dispositivo. Funcionan incluso sin internet y nunca se pierden
              al cerrar la app.
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div
              style={{
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '1rem'
              }}
            >
              <div>
                <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '0.925rem', fontWeight: '600' }}>
                  Descargar Copia de Seguridad (.json)
                </h4>
                <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>
                  Exporta todas tus transacciones para guardarlas en Google Drive, iCloud o tu carpeta de archivos.
                </p>
              </div>
              <button
                type="button"
                className="btn-primary"
                onClick={handleExport}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  fontSize: '0.825rem',
                  padding: '0.5rem 0.85rem',
                  whiteSpace: 'nowrap'
                }}
              >
                <Download size={15} />
                <span>Exportar</span>
              </button>
            </div>

            <div
              style={{
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '1rem'
              }}
            >
              <div>
                <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '0.925rem', fontWeight: '600' }}>
                  Restaurar Copia de Seguridad
                </h4>
                <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>
                  Carga un archivo de respaldo previo de FinTrack para recuperar tus movimientos en este teléfono.
                </p>
              </div>
              <input
                type="file"
                ref={fileInputRef}
                accept=".json,application/json"
                style={{ display: 'none' }}
                onChange={handleImportFile}
              />
              <button
                type="button"
                className="btn-secondary"
                disabled={isProcessing}
                onClick={() => fileInputRef.current?.click()}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  fontSize: '0.825rem',
                  padding: '0.5rem 0.85rem',
                  whiteSpace: 'nowrap'
                }}
              >
                <Upload size={15} />
                <span>{isProcessing ? 'Cargando...' : 'Restaurar'}</span>
              </button>
            </div>
          </div>
        </div>

        <div className="modal-footer" style={{ marginTop: '1.25rem' }}>
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
