import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    fetchTransactionsThunk,
    deleteTransactionThunk,
    setFilter,
    resetFilters
} from '../store/financeSlice';
import { formatCurrency, getCurrencySymbol, getPaymentMethodLabel, PAYMENT_METHODS } from '../utils/currencies';
import {
    Filter,
    Search,
    Trash2,
    Calendar,
    ArrowUpRight,
    ArrowDownRight,
    Plus,
    RotateCcw,
    CreditCard,
    Tag,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';
import Swal from 'sweetalert2';

export const HistoryPage = ({ onOpenTransactionModal }) => {
    const dispatch = useDispatch();
    const currency = useSelector((state) => state.auth.user?.currency || 'USD');
    const {
        transactions,
        filteredSummary,
        pagination,
        categories,
        filters,
        isLoadingTransactions
    } = useSelector((state) => state.finance);

    const [searchInput, setSearchInput] = useState(filters.description || '');

    useEffect(() => {
        dispatch(fetchTransactionsThunk({ ...filters, page: pagination.page }));
    }, [dispatch, filters.type, filters.idCategory, filters.paymentMethod, filters.month, filters.description, pagination.page]);

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        dispatch(setFilter({ description: searchInput }));
    };

    const handleTypeChange = (newType) => {
        dispatch(setFilter({ type: newType }));
    };

    const handleCategoryChange = (e) => {
        dispatch(setFilter({ idCategory: e.target.value }));
    };

    const handlePaymentMethodChange = (e) => {
        dispatch(setFilter({ paymentMethod: e.target.value }));
    };

    const handleMonthChange = (e) => {
        dispatch(setFilter({ month: e.target.value }));
    };

    const handleReset = () => {
        setSearchInput('');
        dispatch(resetFilters());
    };

    const handleDelete = (id, description) => {
        Swal.fire({
            title: '¿Eliminar movimiento?',
            text: `Se borrará permanentemente "${description || 'este movimiento'}"`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#e11d48',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        }).then((result) => {
            if (result.isConfirmed) {
                dispatch(deleteTransactionThunk(id))
                    .unwrap()
                    .then(() => {
                        Swal.fire({
                            icon: 'success',
                            title: 'Eliminado',
                            timer: 1300,
                            showConfirmButton: false
                        });
                    })
                    .catch((err) => {
                        Swal.fire({
                            icon: 'error',
                            title: 'Error',
                            text: err || 'No se pudo eliminar el registro'
                        });
                    });
            }
        });
    };

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= pagination.totalPages) {
            dispatch(fetchTransactionsThunk({ ...filters, page: newPage }));
        }
    };

    return (
        <div className="page-container history-page">
            <div className="page-header-flex">
                <div>
                    <h1 className="page-heading">Histórico de Movimientos</h1>
                    <p className="page-subheading">
                        Explora, filtra y audita todos tus ingresos y gastos registrados
                    </p>
                </div>
                <div className="header-actions">
                    <button
                        type="button"
                        className="btn-primary btn-emerald"
                        onClick={() => onOpenTransactionModal('income')}
                    >
                        <Plus size={16} />
                        <span>+ Ingreso</span>
                    </button>
                    <button
                        type="button"
                        className="btn-primary btn-rose"
                        onClick={() => onOpenTransactionModal('expense')}
                    >
                        <Plus size={16} />
                        <span>- Gasto</span>
                    </button>
                </div>
            </div>

            <div className="filters-card">
                <div className="filters-top-row">
                    <div className="type-filter-pills">
                        <button
                            type="button"
                            className={`filter-pill ${filters.type === '' ? 'active' : ''}`}
                            onClick={() => handleTypeChange('')}
                        >
                            Todos
                        </button>
                        <button
                            type="button"
                            className={`filter-pill income ${filters.type === 'income' ? 'active' : ''}`}
                            onClick={() => handleTypeChange('income')}
                        >
                            Ingresos
                        </button>
                        <button
                            type="button"
                            className={`filter-pill expense ${filters.type === 'expense' ? 'active' : ''}`}
                            onClick={() => handleTypeChange('expense')}
                        >
                            Gastos
                        </button>
                    </div>

                    <form onSubmit={handleSearchSubmit} className="search-box-form">
                        <Search size={16} className="search-icon" />
                        <input
                            type="text"
                            placeholder="Buscar en descripción..."
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            className="search-input"
                        />
                        <button type="submit" className="search-submit-btn">
                            Buscar
                        </button>
                    </form>
                </div>

                <div className="filters-dropdowns-row">
                    <div className="filter-item">
                        <label className="filter-label">
                            <Calendar size={13} className="inline-icon" /> Mes
                        </label>
                        <input
                            type="month"
                            value={filters.month || ''}
                            onChange={handleMonthChange}
                            className="filter-select"
                        />
                    </div>

                    <div className="filter-item">
                        <label className="filter-label">
                            <Tag size={13} className="inline-icon" /> Categoría
                        </label>
                        <select
                            value={filters.idCategory || ''}
                            onChange={handleCategoryChange}
                            className="filter-select"
                        >
                            <option value="">Todas las categorías</option>
                            {categories.map((c) => (
                                <option key={c.id} value={c.id}>
                                    {c.name.charAt(0).toUpperCase() + c.name.slice(1)} ({c.type === 'income' ? 'Ingreso' : 'Gasto'})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="filter-item">
                        <label className="filter-label">
                            <CreditCard size={13} className="inline-icon" /> Método / Recepción
                        </label>
                        <select
                            value={filters.paymentMethod || ''}
                            onChange={handlePaymentMethodChange}
                            className="filter-select"
                        >
                            <option value="">Todos los métodos</option>
                            {PAYMENT_METHODS.map((m) => (
                                <option key={m.id} value={m.id}>
                                    {m.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="filter-item filter-reset-item">
                        <button
                            type="button"
                            className="btn-reset-filters"
                            onClick={handleReset}
                            title="Restablecer todos los filtros"
                        >
                            <RotateCcw size={14} />
                            <span>Limpiar</span>
                        </button>
                    </div>
                </div>
            </div>

            <div className="filtered-summary-banner">
                <div className="filtered-stat">
                    <span className="stat-label">Movimientos filtrados:</span>
                    <span className="stat-value count">{pagination.total}</span>
                </div>
                <div className="filtered-stat">
                    <span className="stat-label">Ingresos filtrados:</span>
                    <span className="stat-value text-emerald">
                        +{formatCurrency(filteredSummary.totalIncome, currency)}
                    </span>
                </div>
                <div className="filtered-stat">
                    <span className="stat-label">Gastos filtrados:</span>
                    <span className="stat-value text-rose">
                        -{formatCurrency(filteredSummary.totalExpense, currency)}
                    </span>
                </div>
                <div className="filtered-stat">
                    <span className="stat-label">Balance del filtro:</span>
                    <span className={`stat-value ${filteredSummary.netBalance >= 0 ? 'text-indigo' : 'text-rose'}`}>
                        {formatCurrency(filteredSummary.netBalance, currency)}
                    </span>
                </div>
            </div>

            <div className="table-wrapper-card">
                {isLoadingTransactions ? (
                    <div className="table-loading-state">
                        <p>Cargando movimientos...</p>
                    </div>
                ) : transactions.length === 0 ? (
                    <div className="empty-state">
                        <p className="empty-state-title">No se encontraron movimientos</p>
                        <p className="empty-state-subtitle">
                            Intenta cambiar los filtros seleccionados o registra un nuevo movimiento
                        </p>
                    </div>
                ) : (
                    <div className="responsive-table-container">
                        <table className="fintrack-table">
                            <thead>
                                <tr>
                                    <th>Fecha</th>
                                    <th>Tipo</th>
                                    <th>Descripción</th>
                                    <th>Categoría</th>
                                    <th>Método / Forma</th>
                                    <th className="text-right">Monto</th>
                                    <th className="text-center">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {transactions.map((trx) => {
                                    const isIncome = trx.type === 'income';
                                    return (
                                        <tr key={trx.id} className="table-row">
                                            <td className="cell-date">{trx.date}</td>
                                            <td className="cell-type">
                                                <span className={`table-badge ${isIncome ? 'income' : 'expense'}`}>
                                                    {isIncome ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
                                                    {isIncome ? 'Ingreso' : 'Gasto'}
                                                </span>
                                            </td>
                                            <td className="cell-description">
                                                {trx.description || <span className="text-muted">(Sin descripción)</span>}
                                            </td>
                                            <td className="cell-category">
                                                <span className="category-pill">
                                                    {trx.categoryFinance?.name || 'General'}
                                                </span>
                                            </td>
                                            <td className="cell-method">
                                                <span className="method-pill">
                                                    {getPaymentMethodLabel(trx.paymentMethod, trx.type)}
                                                </span>
                                            </td>
                                            <td className={`cell-amount text-right ${isIncome ? 'text-emerald font-semibold' : 'text-rose font-semibold'}`}>
                                                {isIncome ? '+' : '-'} {formatCurrency(trx.amount, currency)}
                                            </td>
                                            <td className="cell-actions text-center">
                                                <button
                                                    type="button"
                                                    className="btn-row-action delete"
                                                    title="Eliminar movimiento"
                                                    onClick={() => handleDelete(trx.id, trx.description)}
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {pagination.totalPages > 1 && (
                    <div className="pagination-bar">
                        <span className="pagination-info">
                            Página {pagination.page} de {pagination.totalPages} ({pagination.total} registros)
                        </span>
                        <div className="pagination-buttons">
                            <button
                                type="button"
                                className="pagination-btn"
                                disabled={pagination.page <= 1}
                                onClick={() => handlePageChange(pagination.page - 1)}
                            >
                                <ChevronLeft size={16} />
                                <span>Anterior</span>
                            </button>
                            <button
                                type="button"
                                className="pagination-btn"
                                disabled={pagination.page >= pagination.totalPages}
                                onClick={() => handlePageChange(pagination.page + 1)}
                            >
                                <span>Siguiente</span>
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
