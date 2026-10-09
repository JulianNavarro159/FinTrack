import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateCurrencyThunk } from '../store/authSlice';
import { CURRENCIES } from '../utils/currencies';
import { Coins, X, Check } from 'lucide-react';
import Swal from 'sweetalert2';

export const CurrencyModal = ({ isOpen, onClose, isRequired = false }) => {
    const dispatch = useDispatch();
    const currentCurrency = useSelector((state) => state.auth.user?.currency || 'USD');
    const [selected, setSelected] = useState(currentCurrency);
    const [isSaving, setIsSaving] = useState(false);

    if (!isOpen) return null;

    const handleSave = async () => {
        try {
            setIsSaving(true);
            await dispatch(updateCurrencyThunk(selected)).unwrap();
            Swal.fire({
                icon: 'success',
                title: 'Moneda actualizada',
                text: `Tu moneda preferida ahora es ${selected}`,
                timer: 1600,
                showConfirmButton: false
            });
            onClose();
        } catch (err) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: err || 'No se pudo actualizar la moneda'
            });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="modal-backdrop">
            <div className="modal-card">
                <div className="modal-header">
                    <div className="modal-title-wrap">
                        <div className="modal-icon-badge bg-emerald">
                            <Coins size={22} className="text-emerald" />
                        </div>
                        <div>
                            <h3 className="modal-title">Selecciona tu moneda</h3>
                            <p className="modal-subtitle">
                                Elige la moneda oficial de tu país para tus ingresos y gastos
                            </p>
                        </div>
                    </div>
                    {!isRequired && (
                        <button type="button" className="btn-icon-close" onClick={onClose}>
                            <X size={20} />
                        </button>
                    )}
                </div>

                <div className="currency-grid">
                    {CURRENCIES.map((curr) => {
                        const isChosen = selected === curr.code;
                        return (
                            <button
                                key={curr.code}
                                type="button"
                                className={`currency-option-card ${isChosen ? 'selected' : ''}`}
                                onClick={() => setSelected(curr.code)}
                            >
                                <div className="currency-symbol-box">{curr.symbol}</div>
                                <div className="currency-info">
                                    <span className="currency-code">{curr.code}</span>
                                    <span className="currency-name">{curr.name}</span>
                                </div>
                                {isChosen && <Check size={18} className="text-emerald check-icon" />}
                            </button>
                        );
                    })}
                </div>

                <div className="modal-footer">
                    {!isRequired && (
                        <button type="button" className="btn-secondary" onClick={onClose} disabled={isSaving}>
                            Cancelar
                        </button>
                    )}
                    <button type="button" className="btn-primary" onClick={handleSave} disabled={isSaving}>
                        {isSaving ? 'Guardando...' : 'Guardar Moneda'}
                    </button>
                </div>
            </div>
        </div>
    );
};
