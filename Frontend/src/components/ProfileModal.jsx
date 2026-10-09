import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateProfileThunk } from '../store/authSlice';
import { CURRENCIES, getCurrencySymbol } from '../utils/currencies';
import { User, Mail, Coins, X, Check, Camera, Shield, Lock, Eye, EyeOff, ChevronDown, ChevronUp } from 'lucide-react';
import Swal from 'sweetalert2';

export const ProfileModal = ({ isOpen, onClose }) => {
    const dispatch = useDispatch();
    const user = useSelector((state) => state.auth.user);

    const [name, setName] = useState('');
    const [lastName, setLastName] = useState('');
    const [currency, setCurrency] = useState('USD');
    const [profilephoto, setProfilephoto] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const [showPasswordSection, setShowPasswordSection] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);

    useEffect(() => {
        if (user) {
            setName(user.name || '');
            setLastName(user.lastName || '');
            setCurrency(user.currency || 'USD');
            setProfilephoto(user.profilephoto || '');
        }
        setCurrentPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
        setShowPasswordSection(false);
    }, [user, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name.trim()) {
            Swal.fire({
                icon: 'warning',
                title: 'Nombre requerido',
                text: 'Por favor ingresa tu nombre'
            });
            return;
        }

        if (showPasswordSection || newPassword || currentPassword) {
            if (!currentPassword) {
                Swal.fire({
                    icon: 'warning',
                    title: 'Contraseña actual requerida',
                    text: 'Ingresa tu contraseña actual para confirmar el cambio'
                });
                return;
            }
            if (newPassword.length < 6) {
                Swal.fire({
                    icon: 'warning',
                    title: 'Contraseña demasiado corta',
                    text: 'La nueva contraseña debe tener al menos 6 caracteres'
                });
                return;
            }
            if (newPassword !== confirmNewPassword) {
                Swal.fire({
                    icon: 'warning',
                    title: 'Las contraseñas no coinciden',
                    text: 'Verifica que la nueva contraseña y su confirmación sean idénticas'
                });
                return;
            }
        }

        try {
            setIsSaving(true);
            const payload = {
                name: name.trim(),
                lastName: lastName.trim(),
                currency,
                profilephoto: profilephoto.trim() || null
            };

            if (newPassword) {
                payload.password = newPassword.trim();
                payload.currentPassword = currentPassword;
            }

            await dispatch(updateProfileThunk(payload)).unwrap();

            Swal.fire({
                icon: 'success',
                title: 'Perfil actualizado',
                text: newPassword
                    ? 'Tus datos y contraseña han sido actualizados correctamente'
                    : 'Tus datos han sido guardados correctamente',
                timer: 1600,
                showConfirmButton: false
            });
            onClose();
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error || 'No se pudo actualizar el perfil'
            });
        } finally {
            setIsSaving(false);
        }
    };

    const initial = name ? name.charAt(0).toUpperCase() : 'U';

    return (
        <div className="modal-backdrop">
            <div className="modal-card">
                <div className="modal-header">
                    <div className="modal-title-wrap">
                        <div className="modal-icon-badge bg-emerald">
                            <User size={22} className="text-emerald" />
                        </div>
                        <div>
                            <h3 className="modal-title">Mi Perfil</h3>
                            <p className="modal-subtitle">
                                Edita y administra tu información personal y financiera
                            </p>
                        </div>
                    </div>
                    <button type="button" className="btn-icon-close" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="profile-form">
                    <div className="profile-avatar-preview-section">
                        <div className="profile-avatar-large">
                            {profilephoto ? (
                                <img
                                    src={profilephoto}
                                    alt="Foto de perfil"
                                    className="profile-img-circle"
                                    onError={(e) => { e.target.style.display = 'none'; }}
                                />
                            ) : (
                                <span className="avatar-initial-large">{initial}</span>
                            )}
                        </div>
                        <div className="avatar-hint-wrap">
                            <span className="avatar-hint-title">{name || 'Usuario'} {lastName}</span>
                            <span className="avatar-hint-email">
                                <Mail size={13} className="inline-icon" />
                                {user?.email || ''}
                            </span>
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group flex-1">
                            <label className="form-label">
                                <User size={14} className="inline-icon" /> Nombre
                            </label>
                            <input
                                type="text"
                                required
                                className="form-input"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Tu nombre"
                            />
                        </div>

                        <div className="form-group flex-1">
                            <label className="form-label">
                                <User size={14} className="inline-icon" /> Apellido
                            </label>
                            <input
                                type="text"
                                className="form-input"
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                placeholder="Tu apellido (opcional)"
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">
                            <Mail size={14} className="inline-icon" /> Correo Electrónico
                        </label>
                        <input
                            type="email"
                            disabled
                            className="form-input disabled"
                            value={user?.email || ''}
                        />
                        <span className="field-hint">
                            El correo electrónico está vinculado a tu cuenta y no puede modificarse.
                        </span>
                    </div>

                    <div className="form-group">
                        <label className="form-label">
                            <Coins size={14} className="inline-icon" /> Moneda Preferida
                        </label>
                        <select
                            className="form-input select"
                            value={currency}
                            onChange={(e) => setCurrency(e.target.value)}
                        >
                            {CURRENCIES.map((curr) => (
                                <option key={curr.code} value={curr.code}>
                                    {curr.code} - {curr.name} ({curr.symbol})
                                </option>
                            ))}
                        </select>
                        <span className="field-hint">
                            Moneda activa: {currency} ({getCurrencySymbol(currency)})
                        </span>
                    </div>

                    <div className="form-group">
                        <label className="form-label">
                            <Camera size={14} className="inline-icon" /> URL de Foto de Perfil (opcional)
                        </label>
                        <input
                            type="url"
                            className="form-input"
                            value={profilephoto}
                            onChange={(e) => setProfilephoto(e.target.value)}
                            placeholder="https://ejemplo.com/mifoto.jpg"
                        />
                    </div>

                    <div className="form-group">
                        <button
                            type="button"
                            className="password-accordion-btn"
                            onClick={() => setShowPasswordSection(!showPasswordSection)}
                        >
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Lock size={15} />
                                Cambiar Contraseña
                            </span>
                            {showPasswordSection ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>

                        {showPasswordSection && (
                            <div className="password-change-box">
                                <div className="form-group">
                                    <label className="form-label">
                                        <Lock size={13} className="inline-icon" /> Contraseña Actual
                                    </label>
                                    <div className="password-input-wrap">
                                        <input
                                            type={showCurrentPassword ? 'text' : 'password'}
                                            className="form-input"
                                            value={currentPassword}
                                            onChange={(e) => setCurrentPassword(e.target.value)}
                                            placeholder="Tu contraseña actual"
                                            autoComplete="current-password"
                                        />
                                        <button
                                            type="button"
                                            className="password-toggle-btn"
                                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                            aria-label="Alternar visibilidad"
                                        >
                                            {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">
                                        <Lock size={13} className="inline-icon" /> Nueva Contraseña
                                    </label>
                                    <div className="password-input-wrap">
                                        <input
                                            type={showNewPassword ? 'text' : 'password'}
                                            className="form-input"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            placeholder="Mínimo 6 caracteres"
                                            autoComplete="new-password"
                                        />
                                        <button
                                            type="button"
                                            className="password-toggle-btn"
                                            onClick={() => setShowNewPassword(!showNewPassword)}
                                            aria-label="Alternar visibilidad"
                                        >
                                            {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">
                                        <Lock size={13} className="inline-icon" /> Confirmar Nueva Contraseña
                                    </label>
                                    <div className="password-input-wrap">
                                        <input
                                            type={showConfirmNewPassword ? 'text' : 'password'}
                                            className="form-input"
                                            value={confirmNewPassword}
                                            onChange={(e) => setConfirmNewPassword(e.target.value)}
                                            placeholder="Repite la nueva contraseña"
                                            autoComplete="new-password"
                                        />
                                        <button
                                            type="button"
                                            className="password-toggle-btn"
                                            onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                                            aria-label="Alternar visibilidad"
                                        >
                                            {showConfirmNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn-secondary" onClick={onClose} disabled={isSaving}>
                            Cancelar
                        </button>
                        <button type="submit" className="btn-primary" disabled={isSaving}>
                            {isSaving ? 'Guardando...' : 'Guardar Cambios'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
