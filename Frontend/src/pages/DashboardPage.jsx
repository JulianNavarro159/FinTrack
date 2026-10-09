import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMonthlySummaryThunk, setSelectedMonth } from '../store/financeSlice';
import { formatCurrency, getCurrencySymbol, getPaymentMethodLabel } from '../utils/currencies';
import {
    TrendingUp,
    TrendingDown,
    Wallet,
    PlusCircle,
    MinusCircle,
    ChevronLeft,
    ChevronRight,
    ArrowUpRight,
    ArrowDownRight,
    Calendar,
    Clock,
    CreditCard
} from 'lucide-react';
import { Link } from 'react-router-dom';

const MONTH_NAMES = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export const DashboardPage = ({ onOpenTransactionModal, onOpenCurrencyModal }) => {
    const dispatch = useDispatch();
    const currency = useSelector((state) => state.auth.user?.currency || 'USD');
    const { selectedMonth, summary, isLoadingSummary } = useSelector((state) => state.finance);

    useEffect(() => {
        dispatch(fetchMonthlySummaryThunk(selectedMonth));
    }, [dispatch, selectedMonth]);

    const [yearStr, monthStr] = selectedMonth.split('-');
    const currentYear = parseInt(yearStr, 10);
    const currentMonthIndex = parseInt(monthStr, 10) - 1;
    const monthLabel = `${MONTH_NAMES[currentMonthIndex]} ${currentYear}`;

    const handlePrevMonth = () => {
        let prevM = currentMonthIndex - 1;
        let prevY = currentYear;
        if (prevM < 0) {
            prevM = 11;
            prevY -= 1;
        }
        const newMonth = `${prevY}-${String(prevM + 1).padStart(2, '0')}`;
        dispatch(setSelectedMonth(newMonth));
    };

    const handleNextMonth = () => {
        let nextM = currentMonthIndex + 1;
        let nextY = currentYear;
        if (nextM > 11) {
            nextM = 0;
            nextY += 1;
        }
        const newMonth = `${nextY}-${String(nextM + 1).padStart(2, '0')}`;
        dispatch(setSelectedMonth(newMonth));
    };

    const handleCurrentMonth = () => {
        const now = new Date();
        const currentM = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        dispatch(setSelectedMonth(currentM));
    };

    const totalIncome = summary?.totalIncome || 0;
    const totalExpense = summary?.totalExpense || 0;
    const balance = summary?.balance || 0;
    const recentTransactions = summary?.recentTransactions || [];
    const expenseBreakdown = summary?.categoryBreakdown?.expense || [];

    return (
        <div className="page-container dashboard-page">
            <div className="dashboard-top-bar">
                <div>
                    <h1 className="page-heading">Panel Financiero</h1>
                    <p className="page-subheading">
                        Resumen general y control de tus movimientos del mes
                    </p>
                </div>

                <div className="month-navigator">
                    <button
                        type="button"
                        className="btn-month-nav"
                        onClick={handlePrevMonth}
                        title="Mes anterior"
                    >
                        <ChevronLeft size={18} />
                    </button>
                    <div className="current-month-display">
                        <Calendar size={16} className="text-muted" />
                        <span className="month-text">{monthLabel}</span>
                    </div>
                    <button
                        type="button"
                        className="btn-month-nav"
                        onClick={handleNextMonth}
                        title="Mes siguiente"
                    >
                        <ChevronRight size={18} />
                    </button>
                    <button
                        type="button"
                        className="btn-today-pill"
                        onClick={handleCurrentMonth}
                    >
                        Mes Actual
                    </button>
                </div>
            </div>

            <div className="quick-actions-bar">
                <button
                    type="button"
                    className="action-card-btn income-btn"
                    onClick={() => onOpenTransactionModal('income')}
                >
                    <div className="action-icon-circle bg-emerald">
                        <PlusCircle size={22} className="text-white" />
                    </div>
                    <div className="action-btn-text">
                        <span className="action-btn-title">Registrar Ingreso</span>
                        <span className="action-btn-desc">Suma salario, ventas o transferencias</span>
                    </div>
                </button>

                <button
                    type="button"
                    className="action-card-btn expense-btn"
                    onClick={() => onOpenTransactionModal('expense')}
                >
                    <div className="action-icon-circle bg-rose">
                        <MinusCircle size={22} className="text-white" />
                    </div>
                    <div className="action-btn-text">
                        <span className="action-btn-title">Registrar Gasto</span>
                        <span className="action-btn-desc">Registra compras, pagos o salidas</span>
                    </div>
                </button>
            </div>

            <div className="metrics-grid">
                <div className="metric-card income-card">
                    <div className="metric-card-header">
                        <span className="metric-label">Ingresos del Mes</span>
                        <div className="metric-icon-wrap emerald">
                            <TrendingUp size={20} />
                        </div>
                    </div>
                    <div className="metric-value text-emerald">
                        {isLoadingSummary ? '...' : formatCurrency(totalIncome, currency)}
                    </div>
                    <div className="metric-footer">
                        <span className="metric-subtext">Total percibido en {monthLabel}</span>
                    </div>
                </div>

                <div className="metric-card expense-card">
                    <div className="metric-card-header">
                        <span className="metric-label">Gastos del Mes</span>
                        <div className="metric-icon-wrap rose">
                            <TrendingDown size={20} />
                        </div>
                    </div>
                    <div className="metric-value text-rose">
                        {isLoadingSummary ? '...' : formatCurrency(totalExpense, currency)}
                    </div>
                    <div className="metric-footer">
                        <span className="metric-subtext">Total egresado en {monthLabel}</span>
                    </div>
                </div>

                <div className={`metric-card balance-card ${balance >= 0 ? 'positive' : 'negative'}`}>
                    <div className="metric-card-header">
                        <span className="metric-label">Balance Neto</span>
                        <div className="metric-icon-wrap indigo">
                            <Wallet size={20} />
                        </div>
                    </div>
                    <div className={`metric-value ${balance >= 0 ? 'text-indigo' : 'text-rose'}`}>
                        {isLoadingSummary ? '...' : formatCurrency(balance, currency)}
                    </div>
                    <div className="metric-footer">
                        <span className="metric-subtext">
                            {balance >= 0 ? 'Superávit disponible' : 'Déficit en el periodo'}
                        </span>
                    </div>
                </div>
            </div>

            <div className="dashboard-content-split">
                <div className="content-panel recent-panel">
                    <div className="panel-header">
                        <div className="panel-title-wrap">
                            <Clock size={18} className="text-muted" />
                            <h2 className="panel-title">Últimos Movimientos</h2>
                        </div>
                        <Link to="/history" className="panel-link">
                            Ver historial completo &rarr;
                        </Link>
                    </div>

                    {recentTransactions.length === 0 ? (
                        <div className="empty-state">
                            <p className="empty-state-title">No hay transacciones este mes</p>
                            <p className="empty-state-subtitle">
                                Comienza registrando un ingreso o un gasto con los botones superiores
                            </p>
                        </div>
                    ) : (
                        <div className="transactions-list">
                            {recentTransactions.map((trx) => {
                                const isIncome = trx.type === 'income';
                                return (
                                    <div key={trx.id} className="transaction-row-card">
                                        <div className="trx-left">
                                            <div className={`trx-type-badge ${isIncome ? 'income' : 'expense'}`}>
                                                {isIncome ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />}
                                            </div>
                                            <div className="trx-details">
                                                <span className="trx-desc">
                                                    {trx.description || (isIncome ? 'Ingreso' : 'Gasto')}
                                                </span>
                                                <div className="trx-meta">
                                                    <span className="trx-category">
                                                        {trx.categoryFinance?.name || 'General'}
                                                    </span>
                                                    <span className="trx-bullet">&bull;</span>
                                                    <span className="trx-method">
                                                        <CreditCard size={12} className="inline-icon" />
                                                        {getPaymentMethodLabel(trx.paymentMethod, trx.type)}
                                                    </span>
                                                    <span className="trx-bullet">&bull;</span>
                                                    <span className="trx-date">{trx.date}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className={`trx-amount ${isIncome ? 'text-emerald' : 'text-rose'}`}>
                                            {isIncome ? '+' : '-'} {formatCurrency(trx.amount, currency)}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div className="content-panel breakdown-panel">
                    <div className="panel-header">
                        <h2 className="panel-title">Distribución de Gastos</h2>
                        <span className="panel-badge">{expenseBreakdown.length} categorías</span>
                    </div>

                    {expenseBreakdown.length === 0 ? (
                        <div className="empty-state">
                            <p className="empty-state-title">Sin gastos registrados</p>
                            <p className="empty-state-subtitle">
                                Aún no has registrado gastos en {monthLabel}
                            </p>
                        </div>
                    ) : (
                        <div className="category-bars-list">
                            {expenseBreakdown.map((item) => {
                                const percentage = totalExpense > 0
                                    ? Math.round((item.amount / totalExpense) * 100)
                                    : 0;
                                return (
                                    <div key={item.name} className="category-bar-item">
                                        <div className="category-bar-meta">
                                            <span className="category-bar-name">
                                                {item.name.charAt(0).toUpperCase() + item.name.slice(1)}
                                            </span>
                                            <span className="category-bar-amt">
                                                {formatCurrency(item.amount, currency)} ({percentage}%)
                                            </span>
                                        </div>
                                        <div className="progress-track">
                                            <div
                                                className="progress-fill"
                                                style={{ width: `${Math.min(100, percentage)}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
