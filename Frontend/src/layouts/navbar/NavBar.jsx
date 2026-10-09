import React from 'react';
import { NavLink } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../../store/authSlice';
import { getCurrencySymbol } from '../../utils/currencies';
import { Wallet, LayoutDashboard, History, Coins, LogOut, Plus, UserCheck } from 'lucide-react';

export const NavBar = ({ onOpenCurrencyModal, onOpenTransactionModal, onOpenProfileModal }) => {
    const dispatch = useDispatch();
    const user = useSelector((state) => state.auth.user);
    const currency = user?.currency || 'USD';
    const currencySymbol = getCurrencySymbol(currency);

    const handleLogout = () => {
        dispatch(logout());
    };

    return (
        <header className="navbar-container">
            <div className="navbar-inner">
                <div className="navbar-left">
                    <NavLink to="/" className="brand-logo-link">
                        <div className="brand-icon-box">
                            <Wallet size={20} className="brand-icon" />
                        </div>
                        <span className="brand-text">FinTrack</span>
                    </NavLink>

                    <nav className="nav-links">
                        <NavLink
                            to="/"
                            end
                            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                        >
                            <LayoutDashboard size={17} />
                            <span>Panel Principal</span>
                        </NavLink>
                        <NavLink
                            to="/history"
                            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                        >
                            <History size={17} />
                            <span>Historial</span>
                        </NavLink>
                    </nav>
                </div>

                <div className="navbar-right">
                    <button
                        type="button"
                        className="currency-pill-btn"
                        onClick={onOpenCurrencyModal}
                        title="Cambiar moneda de tu país"
                    >
                        <Coins size={15} />
                        <span>{currency} ({currencySymbol})</span>
                    </button>

                    <button
                        type="button"
                        className="btn-quick-add"
                        onClick={() => onOpenTransactionModal('expense')}
                    >
                        <Plus size={16} />
                        <span>Registrar</span>
                    </button>

                    <div className="user-profile-menu">
                        <button
                            type="button"
                            className="btn-profile-trigger"
                            onClick={onOpenProfileModal}
                            title="Editar mi información de usuario"
                        >
                            <div className="user-avatar-circle">
                                {user?.profilephoto ? (
                                    <img
                                        src={user.profilephoto}
                                        alt="Avatar"
                                        className="user-avatar-img"
                                        onError={(e) => { e.target.style.display = 'none'; }}
                                    />
                                ) : (
                                    <span>{user?.name ? user.name.charAt(0).toUpperCase() : 'U'}</span>
                                )}
                            </div>
                            <div className="user-text-info">
                                <span className="user-display-name">
                                    {user?.name || user?.email?.split('@')[0] || 'Usuario'}
                                </span>
                            </div>
                        </button>

                        <button
                            type="button"
                            className="btn-icon-logout"
                            onClick={handleLogout}
                            title="Cerrar sesión"
                        >
                            <LogOut size={17} />
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
};
