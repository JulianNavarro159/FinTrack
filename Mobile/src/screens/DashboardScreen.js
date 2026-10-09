import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    RefreshControl,
    StyleSheet,
    ActivityIndicator,
    Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatCurrency, getCurrencySymbol, getPaymentMethodLabel } from '../utils/currencies';
import { theme } from '../theme';
import { mobileApi } from '../services/api';

const MONTH_NAMES = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export const DashboardScreen = ({
    user,
    onOpenTransactionModal,
    onOpenCurrencyModal,
    refreshSignal = 0,
    onTransactionChanged
}) => {
    const currency = user?.currency || 'USD';
    const now = new Date();
    const currentM = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const [selectedMonth, setSelectedMonth] = useState(currentM);
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadSummary = useCallback(async (force = false) => {
        try {
            if (!summary) setLoading(true);
            const data = await mobileApi.getMonthlySummary(selectedMonth, force);
            setSummary(data);
        } catch (err) {
            console.error('Failed to load summary:', err.message);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [selectedMonth, summary]);

    useEffect(() => {
        loadSummary(true);
    }, [selectedMonth, refreshSignal]);

    const onRefresh = () => {
        setRefreshing(true);
        loadSummary(true);
    };

    const [yearStr, monthStr] = selectedMonth.split('-');
    const currentYear = parseInt(yearStr, 10);
    const currentMonthIndex = parseInt(monthStr, 10) - 1;
    const monthLabel = `${MONTH_NAMES[currentMonthIndex]} ${currentYear}`;
    const isCurrentMonth = selectedMonth === currentM;

    const handlePrevMonth = () => {
        let prevM = currentMonthIndex - 1;
        let prevY = currentYear;
        if (prevM < 0) {
            prevM = 11;
            prevY -= 1;
        }
        setSelectedMonth(`${prevY}-${String(prevM + 1).padStart(2, '0')}`);
    };

    const handleNextMonth = () => {
        let nextM = currentMonthIndex + 1;
        let nextY = currentYear;
        if (nextM > 11) {
            nextM = 0;
            nextY += 1;
        }
        setSelectedMonth(`${nextY}-${String(nextM + 1).padStart(2, '0')}`);
    };

    const handleDeleteRecent = (trx) => {
        Alert.alert(
            'Eliminar movimiento',
            `Deseas eliminar "${trx.description || (trx.type === 'income' ? 'Ingreso' : 'Gasto')}" de ${formatCurrency(trx.amount, currency)}?`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Eliminar',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await mobileApi.deleteTransaction(trx.id);
                            loadSummary(true);
                            if (onTransactionChanged) {
                                onTransactionChanged();
                            }
                        } catch (err) {
                            Alert.alert('Error', err.message || 'No se pudo eliminar el movimiento');
                        }
                    }
                }
            ]
        );
    };

    const totalIncome = summary?.totalIncome || 0;
    const totalExpense = summary?.totalExpense || 0;
    const balance = summary?.balance || 0;
    const recentTransactions = summary?.recentTransactions || [];
    const expenseBreakdown = summary?.categoryBreakdown?.expense || [];

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.contentContainer}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            showsVerticalScrollIndicator={false}
        >
            <View style={styles.topHeader}>
                <View>
                    <Text style={styles.greetingText}>Hola, {user?.name || 'Usuario'}</Text>
                    <Text style={styles.subtitleText}>Control de finanzas personales</Text>
                </View>
                <TouchableOpacity style={styles.currencyBadge} onPress={onOpenCurrencyModal}>
                    <Text style={styles.currencyBadgeText}>
                        {currency} ({getCurrencySymbol(currency)})
                    </Text>
                    <Ionicons name="chevron-down" size={13} color={theme.colors.primary} />
                </TouchableOpacity>
            </View>

            <View style={styles.monthSelector}>
                <TouchableOpacity onPress={handlePrevMonth} style={styles.navArrowBtn} accessibilityLabel="Mes anterior">
                    <Ionicons name="chevron-back" size={18} color={theme.colors.textMuted} />
                </TouchableOpacity>
                <View style={styles.monthCenterWrap}>
                    <Text style={styles.monthLabelText}>{monthLabel}</Text>
                    {!isCurrentMonth && (
                        <TouchableOpacity
                            style={styles.todayShortcut}
                            onPress={() => setSelectedMonth(currentM)}
                        >
                            <Text style={styles.todayShortcutText}>Volver al mes actual</Text>
                        </TouchableOpacity>
                    )}
                </View>
                <TouchableOpacity onPress={handleNextMonth} style={styles.navArrowBtn} accessibilityLabel="Mes siguiente">
                    <Ionicons name="chevron-forward" size={18} color={theme.colors.textMuted} />
                </TouchableOpacity>
            </View>

            <View style={styles.actionButtonsRow}>
                <TouchableOpacity
                    style={[styles.actionBtn, styles.incomeActionBtn]}
                    onPress={() => onOpenTransactionModal('income')}
                >
                    <Ionicons name="arrow-down-circle" size={20} color="#FFFFFF" />
                    <Text style={styles.actionBtnText}>Ingreso</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.actionBtn, styles.expenseActionBtn]}
                    onPress={() => onOpenTransactionModal('expense')}
                >
                    <Ionicons name="arrow-up-circle" size={20} color="#FFFFFF" />
                    <Text style={styles.actionBtnText}>Gasto</Text>
                </TouchableOpacity>
            </View>

            {loading && !summary ? (
                <View style={styles.loaderWrap}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                </View>
            ) : (
                <>
                    <View style={styles.metricsContainer}>
                        <View style={[styles.metricCard, styles.incomeCard]}>
                            <View style={styles.metricHeaderRow}>
                                <Text style={styles.metricLabel}>Ingresos del mes</Text>
                                <View style={styles.metricIconWrapIncome}>
                                    <Ionicons name="trending-up-outline" size={16} color={theme.colors.emerald} />
                                </View>
                            </View>
                            <Text style={[styles.metricValue, styles.textEmerald]}>
                                {formatCurrency(totalIncome, currency)}
                            </Text>
                        </View>

                        <View style={[styles.metricCard, styles.expenseCard]}>
                            <View style={styles.metricHeaderRow}>
                                <Text style={styles.metricLabel}>Gastos del mes</Text>
                                <View style={styles.metricIconWrapExpense}>
                                    <Ionicons name="trending-down-outline" size={16} color={theme.colors.rose} />
                                </View>
                            </View>
                            <Text style={[styles.metricValue, styles.textRose]}>
                                {formatCurrency(totalExpense, currency)}
                            </Text>
                        </View>

                        <View style={[styles.metricCard, styles.balanceCard]}>
                            <View style={styles.metricHeaderRow}>
                                <Text style={styles.metricLabel}>Balance neto</Text>
                                <View style={styles.metricIconWrapBalance}>
                                    <Ionicons name="wallet-outline" size={16} color={theme.colors.primary} />
                                </View>
                            </View>
                            <Text style={[styles.metricValue, balance >= 0 ? styles.textIndigo : styles.textRose]}>
                                {formatCurrency(balance, currency)}
                            </Text>
                            <View style={styles.balanceStatusRow}>
                                <View style={[styles.statusDot, balance >= 0 ? styles.statusDotPositive : styles.statusDotNegative]} />
                                <Text style={styles.metricSub}>
                                    {balance >= 0 ? 'Superavit en el periodo' : 'Deficit en el periodo'}
                                </Text>
                            </View>
                        </View>
                    </View>

                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Ultimos Movimientos</Text>
                        <Text style={styles.sectionHint}>Toca para opciones</Text>
                    </View>

                    {recentTransactions.length === 0 ? (
                        <View style={styles.emptyCard}>
                            <Ionicons name="receipt-outline" size={32} color={theme.colors.textSubtle} />
                            <Text style={styles.emptyTitle}>Sin movimientos este mes</Text>
                            <Text style={styles.emptySub}>
                                Registra un ingreso o gasto con los botones superiores
                            </Text>
                        </View>
                    ) : (
                        recentTransactions.map((trx) => {
                            const isIncome = trx.type === 'income';
                            return (
                                <TouchableOpacity
                                    key={trx.id}
                                    style={styles.trxItem}
                                    onPress={() => handleDeleteRecent(trx)}
                                    activeOpacity={0.7}
                                >
                                    <View style={styles.trxLeft}>
                                        <View style={[styles.trxBadge, isIncome ? styles.badgeIncome : styles.badgeExpense]}>
                                            <Ionicons
                                                name={isIncome ? 'arrow-down' : 'arrow-up'}
                                                size={15}
                                                color={isIncome ? theme.colors.emerald : theme.colors.rose}
                                            />
                                        </View>
                                        <View style={styles.trxTextWrap}>
                                            <Text style={styles.trxDescription} numberOfLines={1}>
                                                {trx.description || (isIncome ? 'Ingreso' : 'Gasto')}
                                            </Text>
                                            <Text style={styles.trxSub} numberOfLines={1}>
                                                {trx.categoryFinance?.name || 'General'} • {getPaymentMethodLabel(trx.paymentMethod, trx.type)} • {trx.date}
                                            </Text>
                                        </View>
                                    </View>
                                    <View style={styles.trxRight}>
                                        <Text style={[styles.trxAmount, isIncome ? styles.textEmerald : styles.textRose]}>
                                            {isIncome ? '+' : '-'} {formatCurrency(trx.amount, currency)}
                                        </Text>
                                        <Ionicons name="chevron-forward" size={14} color={theme.colors.textSubtle} />
                                    </View>
                                </TouchableOpacity>
                            );
                        })
                    )}

                    {expenseBreakdown.length > 0 && (
                        <>
                            <View style={[styles.sectionHeader, { marginTop: 24 }]}>
                                <Text style={styles.sectionTitle}>Distribucion de Gastos</Text>
                            </View>
                            <View style={styles.breakdownCard}>
                                {expenseBreakdown.map((item) => {
                                    const percentage = totalExpense > 0
                                        ? Math.round((item.amount / totalExpense) * 100)
                                        : 0;
                                    return (
                                        <View key={item.name} style={styles.breakdownItem}>
                                            <View style={styles.breakdownMeta}>
                                                <Text style={styles.breakdownName}>
                                                    {item.name.charAt(0).toUpperCase() + item.name.slice(1)}
                                                </Text>
                                                <Text style={styles.breakdownAmount}>
                                                    {formatCurrency(item.amount, currency)} ({percentage}%)
                                                </Text>
                                            </View>
                                            <View style={styles.progressTrack}>
                                                <View style={[styles.progressFill, { width: `${Math.min(100, percentage)}%` }]} />
                                            </View>
                                        </View>
                                    );
                                })}
                            </View>
                        </>
                    )}
                </>
            )}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.bg
    },
    contentContainer: {
        padding: 16,
        paddingBottom: 40
    },
    topHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16
    },
    greetingText: {
        fontSize: 22,
        fontWeight: '800',
        color: theme.colors.text
    },
    subtitleText: {
        fontSize: 13,
        color: theme.colors.textMuted,
        marginTop: 2
    },
    currencyBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: theme.colors.primaryLight,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: theme.radii.full,
        borderWidth: 1,
        borderColor: theme.colors.primary
    },
    currencyBadgeText: {
        fontSize: 12,
        fontWeight: '700',
        color: theme.colors.primary
    },
    monthSelector: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: theme.colors.card,
        borderRadius: theme.radii.md,
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderWidth: 1,
        borderColor: theme.colors.border,
        marginBottom: 16
    },
    monthCenterWrap: {
        alignItems: 'center'
    },
    navArrowBtn: {
        padding: 6
    },
    monthLabelText: {
        fontSize: 15,
        fontWeight: '700',
        color: theme.colors.text
    },
    todayShortcut: {
        marginTop: 2
    },
    todayShortcutText: {
        fontSize: 11,
        color: theme.colors.primary,
        fontWeight: '600'
    },
    actionButtonsRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 16
    },
    actionBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 13,
        borderRadius: theme.radii.lg,
        elevation: 2,
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 4,
        gap: 8
    },
    incomeActionBtn: {
        backgroundColor: theme.colors.emerald
    },
    expenseActionBtn: {
        backgroundColor: theme.colors.rose
    },
    actionBtnText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '700'
    },
    loaderWrap: {
        paddingVertical: 40,
        alignItems: 'center'
    },
    metricsContainer: {
        gap: 10,
        marginBottom: 20
    },
    metricCard: {
        backgroundColor: theme.colors.card,
        borderRadius: theme.radii.lg,
        padding: 16,
        borderWidth: 1,
        borderColor: theme.colors.border
    },
    incomeCard: {
        borderLeftWidth: 5,
        borderLeftColor: theme.colors.emerald
    },
    expenseCard: {
        borderLeftWidth: 5,
        borderLeftColor: theme.colors.rose
    },
    balanceCard: {
        borderLeftWidth: 5,
        borderLeftColor: theme.colors.primary
    },
    metricHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    metricIconWrapIncome: {
        width: 26,
        height: 26,
        borderRadius: 13,
        backgroundColor: theme.colors.emeraldLight,
        justifyContent: 'center',
        alignItems: 'center'
    },
    metricIconWrapExpense: {
        width: 26,
        height: 26,
        borderRadius: 13,
        backgroundColor: theme.colors.roseLight,
        justifyContent: 'center',
        alignItems: 'center'
    },
    metricIconWrapBalance: {
        width: 26,
        height: 26,
        borderRadius: 13,
        backgroundColor: theme.colors.primaryLight,
        justifyContent: 'center',
        alignItems: 'center'
    },
    metricLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: theme.colors.textMuted,
        textTransform: 'uppercase',
        letterSpacing: 0.5
    },
    metricValue: {
        fontSize: 24,
        fontWeight: '800',
        marginTop: 6
    },
    balanceStatusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 6
    },
    statusDot: {
        width: 7,
        height: 7,
        borderRadius: 3.5
    },
    statusDotPositive: {
        backgroundColor: theme.colors.emerald
    },
    statusDotNegative: {
        backgroundColor: theme.colors.rose
    },
    metricSub: {
        fontSize: 11,
        color: theme.colors.textSubtle,
        fontWeight: '500'
    },
    textEmerald: { color: theme.colors.emerald },
    textRose: { color: theme.colors.rose },
    textIndigo: { color: theme.colors.primary },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: theme.colors.text
    },
    sectionHint: {
        fontSize: 11,
        color: theme.colors.textSubtle
    },
    emptyCard: {
        backgroundColor: theme.colors.card,
        borderRadius: theme.radii.md,
        padding: 24,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderStyle: 'dashed',
        gap: 6
    },
    emptyTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.colors.text
    },
    emptySub: {
        fontSize: 12,
        color: theme.colors.textMuted,
        textAlign: 'center'
    },
    trxItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: theme.colors.card,
        borderRadius: theme.radii.md,
        padding: 12,
        borderWidth: 1,
        borderColor: theme.colors.border,
        marginBottom: 8
    },
    trxLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        flex: 1
    },
    trxBadge: {
        width: 32,
        height: 32,
        borderRadius: theme.radii.sm,
        justifyContent: 'center',
        alignItems: 'center'
    },
    badgeIncome: {
        backgroundColor: theme.colors.emeraldLight
    },
    badgeExpense: {
        backgroundColor: theme.colors.roseLight
    },
    trxTextWrap: {
        flex: 1
    },
    trxDescription: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.colors.text
    },
    trxSub: {
        fontSize: 11,
        color: theme.colors.textMuted,
        marginTop: 2
    },
    trxRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6
    },
    trxAmount: {
        fontSize: 14,
        fontWeight: '700'
    },
    breakdownCard: {
        backgroundColor: theme.colors.card,
        borderRadius: theme.radii.md,
        padding: 16,
        borderWidth: 1,
        borderColor: theme.colors.border,
        gap: 12
    },
    breakdownItem: {
        gap: 4
    },
    breakdownMeta: {
        flexDirection: 'row',
        justifyContent: 'space-between'
    },
    breakdownName: {
        fontSize: 13,
        fontWeight: '600',
        color: theme.colors.text
    },
    breakdownAmount: {
        fontSize: 12,
        color: theme.colors.textMuted
    },
    progressTrack: {
        height: 6,
        backgroundColor: theme.colors.bg,
        borderRadius: theme.radii.full,
        overflow: 'hidden'
    },
    progressFill: {
        height: '100%',
        backgroundColor: theme.colors.rose,
        borderRadius: theme.radii.full
    }
});
