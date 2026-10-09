import React, { useState } from 'react';
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
import { CURRENCIES } from '../utils/currencies';
import { theme } from '../theme';
import { mobileApi } from '../services/api';

export const AuthScreen = ({ onAuthSuccess }) => {
    const [isRegister, setIsRegister] = useState(false);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [currency, setCurrency] = useState('COP');
    const [apiUrl, setApiUrl] = useState(mobileApi.getBaseUrl());
    const [showConfig, setShowConfig] = useState(false);
    const [loading, setLoading] = useState(false);
    const [testingConnection, setTestingConnection] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState(null);

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
                    `No se pudo conectar a ${apiUrl}. Verifica que el backend este activo en tu computadora y que el telefono este en la misma red Wi-Fi.`
                );
            }
        } finally {
            setTestingConnection(false);
        }
    };

    const handleSubmit = async () => {
        if (!email.trim()) {
            Alert.alert('Atención', 'Ingresa tu correo electrónico');
            return;
        }

        try {
            setLoading(true);
            mobileApi.setBaseUrl(apiUrl);

            let res;
            if (isRegister) {
                if (!name.trim()) {
                    Alert.alert('Atención', 'Ingresa tu nombre completo');
                    setLoading(false);
                    return;
                }
                res = await mobileApi.register({
                    name: name.trim(),
                    email: email.trim().toLowerCase(),
                    currency
                });
            } else {
                res = await mobileApi.login(email.trim().toLowerCase());
            }

            if (res.token) {
                mobileApi.setToken(res.token);
                onAuthSuccess(res.user || { email, currency });
            } else {
                throw new Error('No se recibió token de autenticación');
            }
        } catch (err) {
            Alert.alert('Error', err.message || 'Error en la conexión con el servidor');
        } finally {
            setLoading(false);
        }
    };

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
                            onPress={() => setIsRegister(false)}
                        >
                            <Text style={[styles.tabText, !isRegister && styles.tabTextActive]}>
                                Iniciar Sesion
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.tab, isRegister && styles.tabActive]}
                            onPress={() => setIsRegister(true)}
                        >
                            <Text style={[styles.tabText, isRegister && styles.tabTextActive]}>
                                Registrarse
                            </Text>
                        </TouchableOpacity>
                    </View>

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
                                Computadora en red Wi-Fi: http://192.168.20.7:3001
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
