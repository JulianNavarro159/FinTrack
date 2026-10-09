import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createTransactionThunk } from '../store/financeSlice';
import { getCurrencySymbol, PAYMENT_METHODS } from '../utils/currencies';
import { PlusCircle, MinusCircle, X, Calendar, Tag, CreditCard, AlignLeft } from 'lucide-react';
import Swal from 'sweetalert2';

export const TransactionModal = ({ isOpen, onClose, initialType = 'expense' }) => {
    const dispatch = useDispatch();
    const currency = useSelector((state) => state.auth.user?.currency || 'USD');
    const categories = useSelector((state) => state.finance.categories || []);
    const isSubmitting = useSelector((state) => state.finance.isSubmitting);

    const [type, setType] = useState(initialType);
    const [amount, setAmount] = useState('');
    const [idCategory, setIdCategory] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('cash');
    const [description, setDescription] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

    useEffect(() => {
        if (isOpen) {
            setType(initialType);
            setAmount('');
            setDescription('');
            setPaymentMethod('cash');
            setDate(new Date().toISOString().split('T')[0]);
        }
    }, [isOpen, initialType]);

    const availableCategories = categories.filter((c) => c.type === type);

    useEffect(() => {
        if (availableCategories.length > 0) {
            setIdCategory(availableCategories[0].id);
        } else {
            setIdCategory('');
        }
    }, [type, categories]);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        const parsedAmount = parseFloat(amount);
        if (isNaN(parsedAmount) || parsedAmount <= 0) {
            Swal.fire({
                icon: 'warning',
                title: 'Monto inválido',
                text: 'Por favor ingresa un monto válido mayor a 0'
            });
            return;
        }

        if (!idCategory) {
            Swal.fire({
                icon: 'warning',
                title: 'Categoría requerida',
                text: 'Por favor selecciona una categoría'
            });
            return;
        }

        try {
            await dispatch(createTransactionThunk({
                type,
                amount: parsedAmount,
                idCategory: parseInt(idCategory, 10),
                paymentMethod,
                description: description.trim(),
                date
            })).unwrap();

            Swal.fire({
                icon: 'success',
                title: type === 'income' ? 'Ingreso registrado' : 'Gasto registrado',
                timer: 1400,
                showConfirmButton: false
            });
            onClose();
        } catch (err) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: err || 'No se pudo guardar la transacción'
            });
        }
    };

    const currencySymbol = getCurrencySymbol(currency);
    const isIncome = type === 'income';

    return (
        <div className="modal-backdrop">
            <div className="modal-card">
                <div className="modal-header">
                    <div className="modal-title-wrap">
                        <div className={`modal-icon-badge ${isIncome ? 'bg-emerald' : 'bg-rose'}`}>
                            {isIncome ? (
                                <PlusCircle size={22} className="text-emerald" />
                            ) : (
                                <MinusCircle size={22} className="text-rose" />
                            )}
                        </div>
                        <div>
                            <h3 className="modal-title">
                                {isIncome ? 'Registrar Ingreso' : 'Registrar Gasto'}
                            </h3>
                            <p className="modal-subtitle">
                                Ingresa los detalles del movimiento financiero
                            </p>
                        </div>
                    </div>
                    <button type="button" className="btn-icon-close" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="type-toggle-container">
                        <button
                            type="button"
                            className={`type-toggle-btn ${isIncome ? 'active income' : ''}`}
                            onClick={() => setType('income')}
                        >
                            <PlusCircle size={16} />
                            Ingreso
                        </button>
                        <button
                            type="button"
                            className={`type-toggle-btn ${!isIncome ? 'active expense' : ''}`}
                            onClick={() => setType('expense')}
                        >
                            <MinusCircle size={16} />
                            Gasto
                        </button>
                    </div>

                    <div className="form-group amount-group">
                        <label className="form-label">Monto ({currency})</label>
                        <div className="amount-input-wrap">
                            <span className="amount-symbol">{currencySymbol}</span>
                            <input
                                type="number"
                                step="any"
                                min="0"
                                required
                                autoFocus
                                placeholder="0.00"
                                className="input-amount"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group flex-1">
                            <label className="form-label">
                                <Calendar size={14} className="inline-icon" /> Fecha
                            </label>
                            <input
                                type="date"
                                required
                                className="form-input"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                            />
                        </div>

                        <div className="form-group flex-1">
                            <label className="form-label">
                                <Tag size={14} className="inline-icon" /> Categoría
                            </label>
                            <select
                                className="form-input select"
                                value={idCategory}
                                onChange={(e) => setIdCategory(e.target.value)}
                                required
                            >
                                {availableCategories.length === 0 ? (
                                    <option value="">Sin categorías disponibles</option>
                                ) : (
                                    availableCategories.map((c) => (
                                        <option key={c.id} value={c.id}>
                                            {c.name.charAt(0).toUpperCase() + c.name.slice(1)}
                                        </option>
                                    ))
                                )}
                            </select>
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">
                            <CreditCard size={14} className="inline-icon" />
                            {isIncome ? 'Forma en que recibí el ingreso' : 'Método de pago utilizado'}
                        </label>
                        <div className="payment-methods-chips">
                            {PAYMENT_METHODS.map((method) => {
                                const isSelected = paymentMethod === method.id;
                                const label = isIncome ? method.incomeLabel : method.expenseLabel;
                                return (
                                    <button
                                        key={method.id}
                                        type="button"
                                        className={`chip-button ${isSelected ? 'active' : ''}`}
                                        onClick={() => setPaymentMethod(method.id)}
                                    >
                                        {label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">
                            <AlignLeft size={14} className="inline-icon" /> Descripción (opcional)
                        </label>
                        <input
                            type="text"
                            placeholder="Ej. Salario quincenal, compra del super, transporte..."
                            className="form-input"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn-secondary" onClick={onClose} disabled={isSubmitting}>
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className={`btn-primary ${isIncome ? 'btn-emerald' : 'btn-rose'}`}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Guardando...' : isIncome ? 'Registrar Ingreso' : 'Registrar Gasto'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
