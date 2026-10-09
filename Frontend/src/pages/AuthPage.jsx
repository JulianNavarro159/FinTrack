import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { loginUserThunk, registerUserThunk, clearAuthError } from '../store/authSlice';
import { CURRENCIES } from '../utils/currencies';
import { Wallet, LogIn, UserPlus, Coins, Mail, User, AlertCircle, Lock, Eye, EyeOff } from 'lucide-react';
import { useAuth0 } from '@auth0/auth0-react';

export const AuthPage = () => {
    const dispatch = useDispatch();
    const { isLoading, error } = useSelector((state) => state.auth);
    const [isRegister, setIsRegister] = useState(false);

    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [clientError, setClientError] = useState('');
    const [currency, setCurrency] = useState('COP');

    const auth0 = useAuth0();

    const handleTabSwitch = (registerMode) => {
        setIsRegister(registerMode);
        setPassword('');
        setConfirmPassword('');
        setClientError('');
        dispatch(clearAuthError());
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        dispatch(clearAuthError());
        setClientError('');

        if (password.length < 6) {
            setClientError('La contraseña debe tener al menos 6 caracteres');
            return;
        }

        if (isRegister) {
            if (password !== confirmPassword) {
                setClientError('Las contraseñas no coinciden');
                return;
            }
            dispatch(registerUserThunk({
                name: name.trim(),
                email: email.trim().toLowerCase(),
                password,
                currency
            }));
        } else {
            dispatch(loginUserThunk({
                email: email.trim().toLowerCase(),
                password
            }));
        }
    };

    const handleAuth0Login = () => {
        if (auth0 && auth0.loginWithRedirect) {
            auth0.loginWithRedirect();
        }
    };

    return (
        <div className="auth-page-container">
            <div className="auth-card">
                <div className="auth-header">
                    <div className="auth-logo-badge">
                        <Wallet size={28} className="text-white" />
                    </div>
                    <h1 className="auth-title">FinTrack</h1>
                    <p className="auth-subtitle">
                        {isRegister ? 'Crea tu cuenta y selecciona tu moneda' : 'Controla tus ingresos y gastos en cualquier lugar'}
                    </p>
                </div>

                {(error || clientError) && (
                    <div className="auth-error-banner">
                        <AlertCircle size={16} />
                        <span>{clientError || error}</span>
                    </div>
                )}

                <div className="auth-tabs">
                    <button
                        type="button"
                        className={`auth-tab ${!isRegister ? 'active' : ''}`}
                        onClick={() => handleTabSwitch(false)}
                    >
                        <LogIn size={15} />
                        <span>Iniciar Sesión</span>
                    </button>
                    <button
                        type="button"
                        className={`auth-tab ${isRegister ? 'active' : ''}`}
                        onClick={() => handleTabSwitch(true)}
                    >
                        <UserPlus size={15} />
                        <span>Registrarse</span>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="auth-form">
                    {isRegister && (
                        <div className="form-group">
                            <label className="form-label">
                                <User size={14} className="inline-icon" /> Nombre Completo
                            </label>
                            <input
                                type="text"
                                required
                                placeholder="Tu nombre"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="form-input"
                            />
                        </div>
                    )}

                    <div className="form-group">
                        <label className="form-label">
                            <Mail size={14} className="inline-icon" /> Correo Electrónico
                        </label>
                        <input
                            type="email"
                            required
                            placeholder="ejemplo@correo.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="form-input"
                            autoComplete="username"
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">
                            <Lock size={14} className="inline-icon" /> Contraseña
                        </label>
                        <div className="password-input-wrap">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                required
                                placeholder="Mínimo 6 caracteres"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="form-input"
                                autoComplete={isRegister ? 'new-password' : 'current-password'}
                            />
                            <button
                                type="button"
                                className="password-toggle-btn"
                                onClick={() => setShowPassword(!showPassword)}
                                aria-label="Alternar visibilidad de contraseña"
                            >
                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                    </div>

                    {isRegister && (
                        <div className="form-group">
                            <label className="form-label">
                                <Lock size={14} className="inline-icon" /> Confirmar Contraseña
                            </label>
                            <div className="password-input-wrap">
                                <input
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    required
                                    placeholder="Repite tu contraseña"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="form-input"
                                    autoComplete="new-password"
                                />
                                <button
                                    type="button"
                                    className="password-toggle-btn"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    aria-label="Alternar visibilidad de contraseña"
                                >
                                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>
                    )}

                    {isRegister && (
                        <div className="form-group">
                            <label className="form-label">
                                <Coins size={14} className="inline-icon" /> Moneda de tu país
                            </label>
                            <select
                                value={currency}
                                onChange={(e) => setCurrency(e.target.value)}
                                className="form-input select"
                            >
                                {CURRENCIES.map((c) => (
                                    <option key={c.code} value={c.code}>
                                        {c.name}
                                    </option>
                                ))}
                            </select>
                            <span className="field-hint">
                                Esta moneda se usará por defecto para registrar y visualizar montos.
                            </span>
                        </div>
                    )}

                    <button
                        type="submit"
                        className="btn-auth-submit"
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            'Procesando...'
                        ) : isRegister ? (
                            'Completar Registro'
                        ) : (
                            'Entrar a FinTrack'
                        )}
                    </button>
                </form>

                {auth0?.loginWithRedirect && (
                    <div className="auth-divider-wrap">
                        <div className="divider-line" />
                        <span className="divider-text">o ingresa con</span>
                        <div className="divider-line" />
                    </div>
                )}

                {auth0?.loginWithRedirect && (
                    <button
                        type="button"
                        className="btn-auth0-sso"
                        onClick={handleAuth0Login}
                    >
                        Continuar con Auth0 SSO
                    </button>
                )}
            </div>
        </div>
    );
};
