import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { CURRENCIES } from '../utils/currencies';
import { theme } from '../theme';
import { mobileApi } from '../services/api';

const AUTH_TOKEN_KEY = 'fintrack_auth_token';
const AUTH_EMAIL_KEY = 'fintrack_auth_email';

export const AuthScreen = ({ onAuthSuccess }) => {
    const [isRegister, setIsRegister] = useState(false);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [currency, setCurrency] = useState('COP');
    const [apiUrl, setApiUrl] = useState(mobileApi.getBaseUrl());
    const [showConfig, setShowConfig] = useState(false);
    const [loading, setLoading] = useState(false);
    const [testingConnection, setTestingConnection] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState(null);

    const [hasBiometrics, setHasBiometrics] = useState(false);
    const [hasStoredToken, setHasStoredToken] = useState(false);
    const [biometricTypeLabel, setBiometricTypeLabel] = useState('Huella Digital');
    const [biometricLoading, setBiometricLoading] = useState(false);

    useEffect(() => {
        checkBiometricsAvailability();
    }, []);

    const checkBiometricsAvailability = async () => {
        try {
            const hasHardware = await LocalAuthentication.hasHardwareAsync();
            const isEnrolled = await LocalAuthentication.isEnrolledAsync();
            setHasBiometrics(hasHardware && isEnrolled);

            if (hasHardware && isEnrolled) {
                const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
                if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
                    setBiometricTypeLabel('Face ID');
                } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
                    setBiometricTypeLabel('Huella Digital');
                } else {
                    setBiometricTypeLabel('Biometria');
                }
            }

            const storedToken = await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
            setHasStoredToken(!!storedToken);

            const storedEmail = await SecureStore.getItemAsync(AUTH_EMAIL_KEY);
            if (storedEmail) {
                setEmail(storedEmail);
            }
        } catch {
            setHasBiometrics(false);
            setHasStoredToken(false);
        }
    };

    const handleBiometricAuth = async () => {
        try {
            setBiometricLoading(true);
            const authResult = await LocalAuthentication.authenticateAsync({
                promptMessage: 'Accede a FinTrack de forma segura',
                fallbackLabel: 'Usar contrasena',
                cancelLabel: 'Cancelar',
                disableDeviceFallback: false
            });

            if (authResult.success) {
                mobileApi.setBaseUrl(apiUrl);
                const token = await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
                if (!token) {
                    Alert.alert('Atencion', 'No hay credenciales guardadas. Inicia sesion con correo y contrasena.');
                    setHasStoredToken(false);
                    return;
                }

                mobileApi.setToken(token);
                try {
                    const profile = await mobileApi.getProfile();
                    onAuthSuccess(profile);
                } catch {
                    await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
                    setHasStoredToken(false);
                    Alert.alert('Sesion Expirada', 'Por favor ingresa tu correo y contrasena para renovar tu sesion.');
                }
            }
        } catch {
            Alert.alert('Error', 'No se pudo completar la autenticacion biometrica.');
        } finally {
            setBiometricLoading(false);
        }
    };

    const handleTabSwitch = (registerMode) => {
        setIsRegister(registerMode);
        setPassword('');
        setConfirmPassword('');
    };

    const handleTestConnection = async () => {
        try {
            setTestingConnection(true);
            setConnectionStatus(null);
            mobileApi.setBaseUrl(apiUrl);
            const isOk = await mobileApi.pingServer();
            setConnectionStatus(isOk ? 'success' : 'failed');
            if (isOk) {
                Alert.alert('Servidor Conectado', `Conexion exitosa con ${apiUrl}`);
            } else {
                Alert.alert(
                    'Error de Conexion',
                    `No se pudo conectar a ${apiUrl}. Verifica que el backend este activo y que el dispositivo tenga acceso a la red.`
                );
            }
        } finally {
            setTestingConnection(false);
        }
    };

    const handleSubmit = async () => {
        if (!email.trim()) {
            Alert.alert('Atencion', 'Ingresa tu correo electronico');
            return;
        }

        if (!password || password.trim().length < 6) {
            Alert.alert('Atencion', 'La contrasena debe tener al menos 6 caracteres');
            return;
        }

        try {
            setLoading(true);
            mobileApi.setBaseUrl(apiUrl);

            let res;
            if (isRegister) {
                if (!name.trim()) {
                    Alert.alert('Atencion', 'Ingresa tu nombre completo');
                    setLoading(false);
                    return;
                }
                if (password !== confirmPassword) {
                    Alert.alert('Atencion', 'Las contrasenas no coinciden');
                    setLoading(false);
                    return;
                }
                res = await mobileApi.register({
                    name: name.trim(),
                    email: email.trim().toLowerCase(),
                    password: password.trim(),
                    currency
                });
            } else {
                res = await mobileApi.login(email.trim().toLowerCase(), password.trim());
            }

            if (res.token) {
                mobileApi.setToken(res.token);
                await SecureStore.setItemAsync(AUTH_TOKEN_KEY, res.token);
                await SecureStore.setItemAsync(AUTH_EMAIL_KEY, email.trim().toLowerCase());
                setHasStoredToken(true);
                onAuthSuccess(res.user || { email, currency });
            } else {
                throw new Error('No se recibio token de autenticacion');
            }
        } catch (err) {
            Alert.alert('Error', err.message || 'Error en la conexion con el servidor');
        } finally {
            setLoading(false);
        }
    };

    const canUseBiometrics = hasBiometrics && hasStoredToken && !isRegister;

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.container}
        >
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.card}>
                    <View style={styles.logoBadge}>
                        <Ionicons name="wallet-outline" size={30} color="#FFFFFF" />
                    </View>
                    <Text style={styles.appTitle}>FinTrack Movil</Text>
                    <Text style={styles.appSubtitle}>
                        {isRegister ? 'Crea tu cuenta y selecciona tu moneda' : 'Gestiona tus ingresos y gastos'}
                    </Text>

                    <View style={styles.tabRow}>
                        <TouchableOpacity
                            style={[styles.tab, !isRegister && styles.tabActive]}
                            onPress={() => handleTabSwitch(false)}
                        >
                            <Text style={[styles.tabText, !isRegister && styles.tabTextActive]}>
                                Iniciar Sesion
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.tab, isRegister && styles.tabActive]}
                            onPress={() => handleTabSwitch(true)}
                        >
                            <Text style={[styles.tabText, isRegister && styles.tabTextActive]}>
                                Registrarse
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {canUseBiometrics && (
                        <View style={styles.biometricSection}>
                            <TouchableOpacity
                                style={styles.biometricBtn}
                                onPress={handleBiometricAuth}
                                disabled={biometricLoading || loading}
                            >
                                {biometricLoading ? (
                                    <ActivityIndicator color="#FFFFFF" />
                                ) : (
                                    <View style={styles.biometricContent}>
                                        <Ionicons
                                            name={biometricTypeLabel === 'Face ID' ? 'scan-outline' : 'finger-print-outline'}
                                            size={22}
                                            color="#FFFFFF"
                                        />
                                        <Text style={styles.biometricBtnText}>
                                            Ingresar con {biometricTypeLabel}
                                        </Text>
                                    </View>
                                )}
                            </TouchableOpacity>

                            <View style={styles.dividerContainer}>
                                <View style={styles.dividerLine} />
                                <Text style={styles.dividerText}>o con contrasena</Text>
                                <View style={styles.dividerLine} />
                            </View>
                        </View>
                    )}

                    {isRegister && (
                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Nombre Completo</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Tu nombre"
                                value={name}
                                onChangeText={setName}
                                placeholderTextColor={theme.colors.textSubtle}
                            />
                        </View>
                    )}

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Correo Electronico</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="ejemplo@correo.com"
                            keyboardType="email-address"
                            autoCapitalize="none"
                            value={email}
                            onChangeText={setEmail}
                            placeholderTextColor={theme.colors.textSubtle}
                        />
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Contrasena</Text>
                        <View style={styles.passwordInputContainer}>
                            <TextInput
                                style={styles.passwordInput}
                                placeholder="Minimo 6 caracteres"
                                secureTextEntry={!showPassword}
                                value={password}
                                onChangeText={setPassword}
                                placeholderTextColor={theme.colors.textSubtle}
                                autoCapitalize="none"
                            />
                            <TouchableOpacity
                                style={styles.eyeBtn}
                                onPress={() => setShowPassword(!showPassword)}
                                accessibilityLabel="Alternar visibilidad de contrasena"
                            >
                                <Ionicons
                                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                                    size={20}
                                    color={theme.colors.textMuted}
                                />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {isRegister && (
                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Confirmar Contrasena</Text>
                            <View style={styles.passwordInputContainer}>
                                <TextInput
                                    style={styles.passwordInput}
                                    placeholder="Repite tu contrasena"
                                    secureTextEntry={!showConfirmPassword}
                                    value={confirmPassword}
                                    onChangeText={setConfirmPassword}
                                    placeholderTextColor={theme.colors.textSubtle}
                                    autoCapitalize="none"
                                />
                                <TouchableOpacity
                                    style={styles.eyeBtn}
                                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                                    accessibilityLabel="Alternar visibilidad de contrasena"
                                >
                                    <Ionicons
                                        name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                                        size={20}
                                        color={theme.colors.textMuted}
                                    />
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}

                    {isRegister && (
                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Moneda de tu pais</Text>
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
                        </View>
                    )}

                    <TouchableOpacity
                        style={styles.submitBtn}
                        onPress={handleSubmit}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#FFFFFF" />
                        ) : (
                            <Text style={styles.submitBtnText}>
                                {isRegister ? 'Completar Registro' : 'Entrar a FinTrack'}
                            </Text>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.configToggle}
                        onPress={() => setShowConfig(!showConfig)}
                    >
                        <Text style={styles.configToggleText}>
                            {showConfig ? 'Ocultar configuracion de servidor' : 'Configurar URL de servidor (IP)'}
                        </Text>
                    </TouchableOpacity>

                    {showConfig && (
                        <View style={styles.configBox}>
                            <Text style={styles.configLabel}>URL API Backend:</Text>
                            <TextInput
                                style={styles.input}
                                value={apiUrl}
                                onChangeText={setApiUrl}
                                autoCapitalize="none"
                            />
                            <View style={styles.configActionRow}>
                                <TouchableOpacity
                                    style={styles.testBtn}
                                    onPress={handleTestConnection}
                                    disabled={testingConnection}
                                >
                                    {testingConnection ? (
                                        <ActivityIndicator size="small" color="#FFFFFF" />
                                    ) : (
                                        <Text style={styles.testBtnText}>Probar Conexion</Text>
                                    )}
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.resetBtn}
                                    onPress={() => setApiUrl(mobileApi.getBaseUrl())}
                                >
                                    <Text style={styles.resetBtnText}>Detectar IP</Text>
                                </TouchableOpacity>
                            </View>
                            {connectionStatus && (
                                <View style={[styles.statusBadge, connectionStatus === 'success' ? styles.statusSuccess : styles.statusError]}>
                                    <Text style={[styles.statusBadgeText, connectionStatus === 'success' ? styles.statusSuccessText : styles.statusErrorText]}>
                                        {connectionStatus === 'success' ? 'Conectado al servidor' : 'No se pudo conectar al servidor'}
                                    </Text>
                                </View>
                            )}
                            <Text style={styles.configHelp}>
                                Servidor Cloud: https://fintrack-backend-pza5.onrender.com
                            </Text>
                        </View>
                    )}
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.bg
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 20
    },
    card: {
        backgroundColor: theme.colors.card,
        borderRadius: 24,
        padding: 24,
        borderWidth: 1,
        borderColor: theme.colors.border,
        alignItems: 'center',
        elevation: 3,
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 10
    },
    logoBadge: {
        width: 60,
        height: 60,
        borderRadius: 16,
        backgroundColor: theme.colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12
    },
    appTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: theme.colors.text
    },
    appSubtitle: {
        fontSize: 13,
        color: theme.colors.textMuted,
        textAlign: 'center',
        marginTop: 4,
        marginBottom: 20
    },
    tabRow: {
        flexDirection: 'row',
        backgroundColor: theme.colors.bg,
        borderRadius: theme.radii.md,
        padding: 4,
        width: '100%',
        marginBottom: 20
    },
    tab: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: theme.radii.sm
    },
    tabActive: {
        backgroundColor: theme.colors.card,
        elevation: 2,
        shadowColor: '#000',
        shadowOpacity: 0.06,
        shadowRadius: 4
    },
    tabText: {
        fontSize: 13,
        fontWeight: '600',
        color: theme.colors.textMuted
    },
    tabTextActive: {
        color: theme.colors.primary,
        fontWeight: '700'
    },
    biometricSection: {
        width: '100%',
        marginBottom: 8
    },
    biometricBtn: {
        width: '100%',
        backgroundColor: theme.colors.emerald,
        paddingVertical: 13,
        borderRadius: theme.radii.md,
        alignItems: 'center',
        justifyContent: 'center'
    },
    biometricContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8
    },
    biometricBtnText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '700'
    },
    dividerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        marginVertical: 14
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: theme.colors.border
    },
    dividerText: {
        fontSize: 11,
        color: theme.colors.textMuted,
        paddingHorizontal: 10,
        textTransform: 'uppercase',
        fontWeight: '600'
    },
    formGroup: {
        width: '100%',
        marginBottom: 14
    },
    label: {
        fontSize: 12,
        fontWeight: '600',
        color: theme.colors.textMuted,
        marginBottom: 6
    },
    input: {
        backgroundColor: theme.colors.bg,
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: theme.radii.sm,
        paddingHorizontal: 14,
        paddingVertical: 10,
        fontSize: 14,
        color: theme.colors.text
    },
    passwordInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.bg,
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: theme.radii.sm
    },
    passwordInput: {
        flex: 1,
        paddingHorizontal: 14,
        paddingVertical: 10,
        fontSize: 14,
        color: theme.colors.text
    },
    eyeBtn: {
        paddingHorizontal: 12,
        paddingVertical: 10,
        justifyContent: 'center',
        alignItems: 'center'
    },
    currencyRow: {
        flexDirection: 'row',
        marginTop: 4
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
        fontWeight: '600',
        color: theme.colors.textMuted
    },
    currencyChipTextActive: {
        color: theme.colors.emerald,
        fontWeight: '700'
    },
    submitBtn: {
        width: '100%',
        backgroundColor: theme.colors.primary,
        paddingVertical: 14,
        borderRadius: theme.radii.md,
        alignItems: 'center',
        marginTop: 10
    },
    submitBtnText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '700'
    },
    configToggle: {
        marginTop: 18,
        padding: 6
    },
    configToggleText: {
        fontSize: 12,
        color: theme.colors.primary,
        fontWeight: '600'
    },
    configBox: {
        width: '100%',
        marginTop: 10,
        padding: 12,
        backgroundColor: theme.colors.bg,
        borderRadius: theme.radii.sm,
        borderWidth: 1,
        borderColor: theme.colors.border
    },
    configLabel: {
        fontSize: 11,
        fontWeight: '600',
        color: theme.colors.textMuted,
        marginBottom: 4
    },
    configActionRow: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 8
    },
    testBtn: {
        flex: 1,
        backgroundColor: theme.colors.primary,
        paddingVertical: 8,
        borderRadius: theme.radii.sm,
        alignItems: 'center',
        justifyContent: 'center'
    },
    testBtnText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '700'
    },
    resetBtn: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        backgroundColor: theme.colors.card,
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: theme.radii.sm,
        alignItems: 'center',
        justifyContent: 'center'
    },
    resetBtnText: {
        color: theme.colors.text,
        fontSize: 12,
        fontWeight: '600'
    },
    statusBadge: {
        marginTop: 8,
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: theme.radii.sm
    },
    statusSuccess: {
        backgroundColor: theme.colors.emeraldLight
    },
    statusError: {
        backgroundColor: theme.colors.roseLight
    },
    statusBadgeText: {
        fontSize: 11,
        fontWeight: '600',
        textAlign: 'center'
    },
    statusSuccessText: {
        color: theme.colors.emerald
    },
    statusErrorText: {
        color: theme.colors.rose
    },
    configHelp: {
        fontSize: 10,
        color: theme.colors.textSubtle,
        marginTop: 6,
        lineHeight: 14
    }
});
