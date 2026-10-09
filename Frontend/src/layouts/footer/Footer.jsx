import React from 'react';
import { ShieldCheck } from 'lucide-react';

export const Footer = () => {
    return (
        <footer className="footer-container">
            <div className="footer-inner">
                <div className="footer-left">
                    <p className="footer-text">
                        FinTrack &bull; Sistema Integral de Gestión de Ingresos y Gastos
                    </p>
                </div>
                <div className="footer-right">
                    <span className="footer-badge">
                        <ShieldCheck size={14} className="text-emerald" />
                        Finanzas Seguras y Controladas
                    </span>
                </div>
            </div>
        </footer>
    );
};
