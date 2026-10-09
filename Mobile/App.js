import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    StatusBar,
    Alert,
    Platform
} from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import { theme } from './src/theme';
import { mobileApi } from './src/services/api';
import { DashboardScreen } from './src/screens/DashboardScreen';
import { HistoryScreen } from './src/screens/HistoryScreen';
import { AuthScreen } from './src/screens/AuthScreen';
import { TransactionModal } from './src/components/TransactionModal';
import { CurrencyModal } from './src/components/CurrencyModal';
import { ProfileModal } from './src/components/ProfileModal';
import { getCurrencySymbol } from './src/utils/currencies';

function FinTrackMain() {
    const insets = useSafeAreaInsets();
    const topInset = Math.max(insets.top, Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : 0);
    const bottomInset = Math.max(insets.bottom, 10);

    const [user, setUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [activeTab, setActiveTab] = useState('dashboard');
    const [categories, setCategories] = useState([]);

    const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
    const [transactionModalType, setTransactionModalType] = useState('expense');
    const [isCurrencyModalOpen, setIsCurrencyModalOpen] = useState(false);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [refreshSignal, setRefreshSignal] = useState(0);

    const handleTransactionChanged = () => {
        setRefreshSignal((prev) => prev + 1);
    };

    useEffect(() => {
        if (isAuthenticated) {
            mobileApi.getCategories()
                .then((cats) => setCategories(cats || []))
                .catch((err) => console.error('Error fetching categories:', err.message));
        }
    }, [isAuthenticated]);

    const handleAuthSuccess = (userData) => {
        setUser(userData);
        setIsAuthenticated(true);
    };

    const handleLogout = () => {
        mobileApi.setToken(null);
        setUser(null);
        setIsAuthenticated(false);
    };

    const handleOpenTransaction = (type = 'expense') => {
        setTransactionModalType(type);
        setIsTransactionModalOpen(true);
    };

    const handleCreateTransaction = async (data) => {
        await mobileApi.createTransaction(data);
        handleTransactionChanged();
        Alert.alert('Exito', data.type === 'income' ? 'Ingreso registrado con exito' : 'Gasto registrado con exito');
    };

    const handleSelectCurrency = async (newCurrency) => {
        await mobileApi.updateCurrency(newCurrency);
        setUser((prev) => ({ ...prev, currency: newCurrency }));
        Alert.alert('Moneda Actualizada', `Nueva moneda: ${newCurrency}`);
    };

    const handleUpdateProfile = async (profileData) => {
        const res = await mobileApi.updateProfile(profileData);
        if (res.token) {
            mobileApi.setToken(res.token);
            await SecureStore.setItemAsync('fintrack_auth_token', res.token);
        }
        if (res.user) {
            setUser(res.user);
        }
    };

    if (!isAuthenticated) {
        return (
            <View style={[styles.safeAreaAuth, { paddingTop: topInset, paddingBottom: insets.bottom }]}>
                <StatusBar barStyle="dark-content" backgroundColor={theme.colors.bg} translucent />
                <AuthScreen onAuthSuccess={handleAuthSuccess} />
            </View>
        );
    }

    const currency = user?.currency || 'USD';
    const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : 'U';

    return (
        <View style={styles.rootContainer}>
            <StatusBar barStyle="dark-content" backgroundColor={theme.colors.card} translucent />

            <View style={[styles.headerContainer, { paddingTop: topInset }]}>
                <View style={styles.topBar}>
                <View style={styles.brandBox}>
                    <View style={styles.brandIconBox}>
                        <Ionicons name="card-outline" size={18} color={theme.colors.primary} />
                    </View>
                    <Text style={styles.brandTitle}>FinTrack</Text>
                </View>

                <View style={styles.topBarRight}>
                    <TouchableOpacity
                        style={styles.profileBadgeBtn}
                        onPress={() => setIsProfileModalOpen(true)}
                        title="Editar perfil"
                    >
                        <View style={styles.smallAvatar}>
                            <Text style={styles.smallAvatarText}>{userInitial}</Text>
                        </View>
                        <Text style={styles.profileBtnText} numberOfLines={1}>
                            {user?.name?.split(' ')[0] || 'Perfil'}
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.currencyBtn}
                        onPress={() => setIsCurrencyModalOpen(true)}
                    >
                        <Text style={styles.currencyBtnText}>
                            {currency} {getCurrencySymbol(currency)}
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                        <Text style={styles.logoutText}>Salir</Text>
                    </TouchableOpacity>
                </View>
            </View>
            </View>

            <View style={styles.mainContainer}>
                {activeTab === 'dashboard' ? (
                    <DashboardScreen
                        user={user}
                        onOpenTransactionModal={handleOpenTransaction}
                        onOpenCurrencyModal={() => setIsCurrencyModalOpen(true)}
                        refreshSignal={refreshSignal}
                        onTransactionChanged={handleTransactionChanged}
                    />
                ) : (
                    <HistoryScreen
                        user={user}
                        categories={categories}
                        onOpenTransactionModal={handleOpenTransaction}
                        refreshSignal={refreshSignal}
                        onTransactionChanged={handleTransactionChanged}
                    />
                )}
            </View>

            <View style={[styles.bottomTabBar, { paddingBottom: bottomInset }]}>
                <TouchableOpacity
                    style={[styles.tabButton, activeTab === 'dashboard' && styles.tabButtonActive]}
                    onPress={() => setActiveTab('dashboard')}
                >
                    <Ionicons
                        name="stats-chart-outline"
                        size={20}
                        color={activeTab === 'dashboard' ? theme.colors.primary : theme.colors.textMuted}
                    />
                    <Text style={[styles.tabLabel, activeTab === 'dashboard' && styles.tabLabelActive]}>
                        Principal
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.centerAddButton}
                    onPress={() => handleOpenTransaction('expense')}
                >
                    <Ionicons name="add" size={26} color="#FFFFFF" />
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.tabButton, activeTab === 'history' && styles.tabButtonActive]}
                    onPress={() => setActiveTab('history')}
                >
                    <Ionicons
                        name="receipt-outline"
                        size={20}
                        color={activeTab === 'history' ? theme.colors.primary : theme.colors.textMuted}
                    />
                    <Text style={[styles.tabLabel, activeTab === 'history' && styles.tabLabelActive]}>
                        Historial
                    </Text>
                </TouchableOpacity>
            </View>

            <TransactionModal
                visible={isTransactionModalOpen}
                onClose={() => setIsTransactionModalOpen(false)}
                initialType={transactionModalType}
                currency={currency}
                categories={categories}
                onSubmit={handleCreateTransaction}
            />

            <CurrencyModal
                visible={isCurrencyModalOpen}
                onClose={() => setIsCurrencyModalOpen(false)}
                currentCurrency={currency}
                onSelectCurrency={handleSelectCurrency}
            />

            <ProfileModal
                visible={isProfileModalOpen}
                onClose={() => setIsProfileModalOpen(false)}
                user={user}
                onUpdateProfile={handleUpdateProfile}
            />
        </View>
    );
}

export default function App() {
    return (
        <SafeAreaProvider>
            <FinTrackMain />
        </SafeAreaProvider>
    );
}

const styles = StyleSheet.create({
    rootContainer: {
        flex: 1,
        backgroundColor: theme.colors.bg
    },
    safeAreaAuth: {
        flex: 1,
        backgroundColor: theme.colors.bg
    },
    headerContainer: {
        backgroundColor: theme.colors.card,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border
    },
    topBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: theme.colors.card,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border
    },
    brandBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8
    },
    brandIconBox: {
        width: 32,
        height: 32,
        borderRadius: theme.radii.sm,
        backgroundColor: theme.colors.primaryLight,
        justifyContent: 'center',
        alignItems: 'center'
    },
    brandIcon: {
        fontSize: 16
    },
    brandTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: theme.colors.text
    },
    topBarRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6
    },
    profileBadgeBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.bg,
        borderWidth: 1,
        borderColor: theme.colors.border,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: theme.radii.full,
        gap: 6,
        maxWidth: 100
    },
    smallAvatar: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: theme.colors.primary,
        justifyContent: 'center',
        alignItems: 'center'
    },
    smallAvatarText: {
        color: '#FFFFFF',
        fontSize: 11,
        fontWeight: '800'
    },
    profileBtnText: {
        fontSize: 12,
        fontWeight: '600',
        color: theme.colors.text
    },
    currencyBtn: {
        backgroundColor: theme.colors.bg,
        borderWidth: 1,
        borderColor: theme.colors.border,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: theme.radii.full
    },
    currencyBtnText: {
        fontSize: 12,
        fontWeight: '700',
        color: theme.colors.text
    },
    logoutBtn: {
        paddingHorizontal: 6,
        paddingVertical: 4
    },
    logoutText: {
        fontSize: 12,
        color: theme.colors.rose,
        fontWeight: '600'
    },
    mainContainer: {
        flex: 1
    },
    bottomTabBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        backgroundColor: theme.colors.card,
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
        paddingTop: 8,
        position: 'relative'
    },
    tabButton: {
        alignItems: 'center',
        flex: 1
    },
    tabButtonActive: {},
    tabIcon: {
        fontSize: 20,
        opacity: 0.5
    },
    tabIconActive: {
        opacity: 1
    },
    tabLabel: {
        fontSize: 11,
        color: theme.colors.textMuted,
        fontWeight: '600',
        marginTop: 2
    },
    tabLabelActive: {
        color: theme.colors.primary,
        fontWeight: '700'
    },
    centerAddButton: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: theme.colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: -20,
        elevation: 4,
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowRadius: 6
    },
    centerAddIcon: {
        color: '#FFFFFF',
        fontSize: 28,
        fontWeight: '700',
        lineHeight: 30
    }
});
