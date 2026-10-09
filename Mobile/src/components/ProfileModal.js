import React, { useState, useEffect } from 'react';
import {
    Modal,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    StyleSheet,
    ActivityIndicator,
    Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CURRENCIES, getCurrencySymbol } from '../utils/currencies';
import { theme } from '../theme';

export const ProfileModal = ({ visible, onClose, user, onUpdateProfile }) => {
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
        if (user && visible) {
            setName(user.name || '');
            setLastName(user.lastName || '');
            setCurrency(user.currency || 'USD');
            setProfilephoto(user.profilephoto || '');
        }
        setCurrentPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
        setShowPasswordSection(false);
    }, [user, visible]);

    const handleSave = async () => {
        if (!name.trim()) {
            Alert.alert('Atencion', 'Por favor ingresa tu nombre');
            return;
        }

        if (showPasswordSection || newPassword || currentPassword) {
            if (!currentPassword) {
                Alert.alert('Atencion', 'Por favor ingresa tu contrasena actual para confirmar el cambio');
                return;
            }
            if (newPassword.length < 6) {
                Alert.alert('Atencion', 'La nueva contrasena debe tener al menos 6 caracteres');
                return;
            }
            if (newPassword !== confirmNewPassword) {
                Alert.alert('Atencion', 'Las nuevas contrasenas no coinciden');
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

            await onUpdateProfile(payload);
            Alert.alert(
                'Exito',
                newPassword
                    ? 'Perfil y contrasena actualizados correctamente'
                    : 'Perfil actualizado correctamente'
            );
            onClose();
        } catch (error) {
            Alert.alert('Error', error.message || 'No se pudo actualizar el perfil');
        } finally {
            setIsSaving(false);
        }
    };

    const initial = name ? name.charAt(0).toUpperCase() : 'U';

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={styles.card}>
                    <View style={styles.header}>
                        <Text style={styles.title}>Mi Informacion de Usuario</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                            <Text style={styles.closeBtnText}>✕</Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false}>
                        <View style={styles.avatarSection}>
                            <View style={styles.avatarCircle}>
                                <Text style={styles.avatarText}>{initial}</Text>
                            </View>
                            <View style={styles.avatarInfo}>
                                <Text style={styles.avatarName}>{name || 'Usuario'} {lastName}</Text>
                                <Text style={styles.avatarEmail}>{user?.email || ''}</Text>
                            </View>
                        </View>

                        <Text style={styles.label}>Nombre</Text>
                        <TextInput
                            style={styles.input}
                            value={name}
                            onChangeText={setName}
                            placeholder="Tu nombre"
                            placeholderTextColor={theme.colors.textSubtle}
                        />

                        <Text style={styles.label}>Apellido</Text>
                        <TextInput
                            style={styles.input}
                            value={lastName}
                            onChangeText={setLastName}
                            placeholder="Tu apellido (opcional)"
                            placeholderTextColor={theme.colors.textSubtle}
                        />

                        <Text style={styles.label}>Correo Electronico (no editable)</Text>
                        <TextInput
                            style={[styles.input, styles.inputDisabled]}
                            value={user?.email || ''}
                            editable={false}
                        />

                        <Text style={styles.label}>Moneda Preferida</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.currencyRow}>
                            {CURRENCIES.map((c) => {
                                const selected = currency === c.code;
                                return (
                                    <TouchableOpacity
                                        key={c.code}
                                        style={[styles.currencyChip, selected && styles.currencyChipActive]}
                                        onPress={() => setCurrency(c.code)}
                                    >
                                        <Text style={[styles.currencyChipText, selected && styles.currencyChipTextActive]}>
                                            {c.code} ({c.symbol})
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>

                        <Text style={styles.label}>URL de Foto de Perfil (opcional)</Text>
                        <TextInput
                            style={styles.input}
                            value={profilephoto}
                            onChangeText={setProfilephoto}
                            placeholder="https://ejemplo.com/mifoto.jpg"
                            placeholderTextColor={theme.colors.textSubtle}
                            autoCapitalize="none"
                        />

                        <TouchableOpacity
                            style={styles.passwordAccordionBtn}
                            onPress={() => setShowPasswordSection(!showPasswordSection)}
                        >
                            <View style={styles.passwordAccordionTitle}>
                                <Ionicons name="lock-closed-outline" size={16} color={theme.colors.text} />
                                <Text style={styles.passwordAccordionText}>Cambiar Contrasena</Text>
                            </View>
                            <Ionicons
                                name={showPasswordSection ? 'chevron-up-outline' : 'chevron-down-outline'}
                                size={16}
                                color={theme.colors.textMuted}
                            />
                        </TouchableOpacity>

                        {showPasswordSection && (
                            <View style={styles.passwordBox}>
                                <Text style={styles.label}>Contrasena Actual</Text>
                                <View style={styles.passwordInputWrap}>
                                    <TextInput
                                        style={styles.passwordInput}
                                        secureTextEntry={!showCurrentPassword}
                                        value={currentPassword}
                                        onChangeText={setCurrentPassword}
                                        placeholder="Tu contrasena actual"
                                        placeholderTextColor={theme.colors.textSubtle}
                                        autoCapitalize="none"
                                    />
                                    <TouchableOpacity
                                        style={styles.eyeBtn}
                                        onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                                    >
                                        <Ionicons
                                            name={showCurrentPassword ? 'eye-off-outline' : 'eye-outline'}
                                            size={18}
                                            color={theme.colors.textMuted}
                                        />
                                    </TouchableOpacity>
                                </View>

                                <Text style={styles.label}>Nueva Contrasena</Text>
                                <View style={styles.passwordInputWrap}>
                                    <TextInput
                                        style={styles.passwordInput}
                                        secureTextEntry={!showNewPassword}
                                        value={newPassword}
                                        onChangeText={setNewPassword}
                                        placeholder="Minimo 6 caracteres"
                                        placeholderTextColor={theme.colors.textSubtle}
                                        autoCapitalize="none"
                                    />
                                    <TouchableOpacity
                                        style={styles.eyeBtn}
                                        onPress={() => setShowNewPassword(!showNewPassword)}
                                    >
                                        <Ionicons
                                            name={showNewPassword ? 'eye-off-outline' : 'eye-outline'}
                                            size={18}
                                            color={theme.colors.textMuted}
                                        />
                                    </TouchableOpacity>
                                </View>

                                <Text style={styles.label}>Confirmar Nueva Contrasena</Text>
                                <View style={styles.passwordInputWrap}>
                                    <TextInput
                                        style={styles.passwordInput}
                                        secureTextEntry={!showConfirmNewPassword}
                                        value={confirmNewPassword}
                                        onChangeText={setConfirmNewPassword}
                                        placeholder="Repite la nueva contrasena"
                                        placeholderTextColor={theme.colors.textSubtle}
                                        autoCapitalize="none"
                                    />
                                    <TouchableOpacity
                                        style={styles.eyeBtn}
                                        onPress={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                                    >
                                        <Ionicons
                                            name={showConfirmNewPassword ? 'eye-off-outline' : 'eye-outline'}
                                            size={18}
                                            color={theme.colors.textMuted}
                                        />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}

                        <View style={styles.footer}>
                            <TouchableOpacity style={styles.btnCancel} onPress={onClose} disabled={isSaving}>
                                <Text style={styles.btnCancelText}>Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.btnSave} onPress={handleSave} disabled={isSaving}>
                                {isSaving ? (
                                    <ActivityIndicator color="#FFFFFF" size="small" />
                                ) : (
                                    <Text style={styles.btnSaveText}>Guardar Cambios</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
        justifyContent: 'flex-end'
    },
    card: {
        backgroundColor: theme.colors.card,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 20,
        maxHeight: '90%'
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        color: theme.colors.text
    },
    closeBtn: {
        padding: 4
    },
    closeBtnText: {
        fontSize: 18,
        color: theme.colors.textMuted
    },
    avatarSection: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.bg,
        padding: 12,
        borderRadius: theme.radii.md,
        borderWidth: 1,
        borderColor: theme.colors.border,
        marginBottom: 16,
        gap: 12
    },
    avatarCircle: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: theme.colors.primary,
        justifyContent: 'center',
        alignItems: 'center'
    },
    avatarText: {
        fontSize: 20,
        fontWeight: '800',
        color: '#FFFFFF'
    },
    avatarInfo: {
        flex: 1
    },
    avatarName: {
        fontSize: 15,
        fontWeight: '700',
        color: theme.colors.text
    },
    avatarEmail: {
        fontSize: 12,
        color: theme.colors.textMuted,
        marginTop: 2
    },
    label: {
        fontSize: 13,
        fontWeight: '600',
        color: theme.colors.textMuted,
        marginBottom: 6,
        marginTop: 10
    },
    input: {
        backgroundColor: theme.colors.bg,
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: theme.radii.sm,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 14,
        color: theme.colors.text
    },
    inputDisabled: {
        opacity: 0.6,
        backgroundColor: theme.colors.border
    },
    currencyRow: {
        flexDirection: 'row',
        marginVertical: 4
    },
    currencyChip: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: theme.radii.full,
        backgroundColor: theme.colors.bg,
        borderWidth: 1,
        borderColor: theme.colors.border,
        marginRight: 8
    },
    currencyChipActive: {
        backgroundColor: theme.colors.emeraldLight,
        borderColor: theme.colors.emerald
    },
    currencyChipText: {
        fontSize: 12,
        color: theme.colors.textMuted,
        fontWeight: '500'
    },
    currencyChipTextActive: {
        color: theme.colors.emerald,
        fontWeight: '700'
    },
    passwordAccordionBtn: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: theme.colors.bg,
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: theme.radii.sm,
        paddingVertical: 12,
        paddingHorizontal: 14,
        marginTop: 14
    },
    passwordAccordionTitle: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8
    },
    passwordAccordionText: {
        fontSize: 13,
        fontWeight: '700',
        color: theme.colors.text
    },
    passwordBox: {
        backgroundColor: theme.colors.bg,
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: theme.radii.sm,
        padding: 12,
        marginTop: 8
    },
    passwordInputWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.card,
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: theme.radii.sm
    },
    passwordInput: {
        flex: 1,
        paddingHorizontal: 12,
        paddingVertical: 9,
        fontSize: 14,
        color: theme.colors.text
    },
    eyeBtn: {
        paddingHorizontal: 10,
        paddingVertical: 8,
        justifyContent: 'center',
        alignItems: 'center'
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 12,
        marginTop: 20,
        marginBottom: 10
    },
    btnCancel: {
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: theme.radii.sm,
        backgroundColor: theme.colors.bg
    },
    btnCancelText: {
        color: theme.colors.textMuted,
        fontWeight: '600'
    },
    btnSave: {
        paddingVertical: 12,
        paddingHorizontal: 22,
        borderRadius: theme.radii.sm,
        backgroundColor: theme.colors.primary
    },
    btnSaveText: {
        color: '#FFFFFF',
        fontWeight: '700'
    }
});
