import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    RefreshControl,
    StyleSheet,
    ActivityIndicator
} from 'react-native';
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
    navigation
}) => {
    const currency = user?.currency || 'USD';
    const now = new Date();
    const currentM = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const [selectedMonth, setSelectedMonth] = useState(currentM);
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadSummary = useCallback(async () => {
        try {
            setLoading(true);
            const data = await mobileApi.getMonthlySummary(selectedMonth);
            setSummary(data);
        } catch (err) {
            console.error('Failed to load summary:', err.message);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [selectedMonth]);

    useEffect(() => {
        loadSummary();
    }, [loadSummary]);

    const onRefresh = () => {
        setRefreshing(true);
        loadSummary();
    };

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
                        {currency} ({getCurrencySymbol(currency)}) ▾
                    </Text>
                </TouchableOpacity>
            </View>

            <View style={styles.monthSelector}>
                <TouchableOpacity onPress={handlePrevMonth} style={styles.navArrowBtn}>
                    <Text style={styles.navArrowText}>‹</Text>
                </TouchableOpacity>
                <Text style={styles.monthLabelText}>{monthLabel}</Text>
                <TouchableOpacity onPress={handleNextMonth} style={styles.navArrowBtn}>
                    <Text style={styles.navArrowText}>›</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.actionButtonsRow}>
                <TouchableOpacity
                    style={[styles.actionBtn, styles.incomeActionBtn]}
                    onPress={() => onOpenTransactionModal('income')}
                >
                    <Text style={styles.actionBtnPlus}>+</Text>
                    <Text style={styles.actionBtnText}>Ingreso</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.actionBtn, styles.expenseActionBtn]}
                    onPress={() => onOpenTransactionModal('expense')}
                >
                    <Text style={styles.actionBtnMinus}>−</Text>
                    <Text style={styles.actionBtnText}>Gasto</Text>
                </TouchableOpacity>
            </View>

            {loading && !refreshing ? (
                <View style={styles.loaderWrap}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                </View>
            ) : (
                <>
                    <View style={styles.metricsContainer}>
                        <View style={[styles.metricCard, styles.incomeCard]}>
                            <Text style={styles.metricLabel}>Ingresos del mes</Text>
                            <Text style={[styles.metricValue, styles.textEmerald]}>
                                {formatCurrency(totalIncome, currency)}
                            </Text>
                        </View>

                        <View style={[styles.metricCard, styles.expenseCard]}>
                            <Text style={styles.metricLabel}>Gastos del mes</Text>
                            <Text style={[styles.metricValue, styles.textRose]}>
                                {formatCurrency(totalExpense, currency)}
                            </Text>
                        </View>

                        <View style={[styles.metricCard, styles.balanceCard]}>
                            <Text style={styles.metricLabel}>Balance neto</Text>
                            <Text style={[styles.metricValue, balance >= 0 ? styles.textIndigo : styles.textRose]}>
                                {formatCurrency(balance, currency)}
                            </Text>
                            <Text style={styles.metricSub}>
                                {balance >= 0 ? 'Superávit en el periodo' : 'Déficit en el periodo'}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Últimos Movimientos</Text>
                    </View>

                    {recentTransactions.length === 0 ? (
                        <View style={styles.emptyCard}>
                            <Text style={styles.emptyTitle}>Sin movimientos este mes</Text>
                            <Text style={styles.emptySub}>
                                Registra un ingreso o gasto con los botones superiores
                            </Text>
                        </View>
                    ) : (
                        recentTransactions.map((trx) => {
                            const isIncome = trx.type === 'income';
                            return (
                                <View key={trx.id} style={styles.trxItem}>
                                    <View style={styles.trxLeft}>
                                        <View style={[styles.trxBadge, isIncome ? styles.badgeIncome : styles.badgeExpense]}>
                                            <Text style={isIncome ? styles.badgeTextIncome : styles.badgeTextExpense}>
                                                {isIncome ? '↗' : '↘'}
                                            </Text>
                                        </View>
                                        <View>
                                            <Text style={styles.trxDescription}>
                                                {trx.description || (isIncome ? 'Ingreso' : 'Gasto')}
                                            </Text>
                                            <Text style={styles.trxSub}>
                                                {trx.categoryFinance?.name || 'General'} • {getPaymentMethodLabel(trx.paymentMethod, trx.type)} • {trx.date}
                                            </Text>
                                        </View>
                                    </View>
                                    <Text style={[styles.trxAmount, isIncome ? styles.textEmerald : styles.textRose]}>
                                        {isIncome ? '+' : '-'} {formatCurrency(trx.amount, currency)}
                                    </Text>
                                </View>
                            );
                        })
                    )}

                    {expenseBreakdown.length > 0 && (
                        <>
                            <View style={[styles.sectionHeader, { marginTop: 24 }]}>
                                <Text style={styles.sectionTitle}>Distribución de Gastos</Text>
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
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderWidth: 1,
        borderColor: theme.colors.border,
        marginBottom: 16
    },
    navArrowBtn: {
        padding: 6
    },
    navArrowText: {
        fontSize: 20,
        fontWeight: '700',
        color: theme.colors.textMuted
    },
    monthLabelText: {
        fontSize: 15,
        fontWeight: '700',
        color: theme.colors.text
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
        paddingVertical: 14,
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
    actionBtnPlus: {
        color: '#FFFFFF',
        fontSize: 20,
        fontWeight: '800'
    },
    actionBtnMinus: {
        color: '#FFFFFF',
        fontSize: 20,
        fontWeight: '800'
    },
    actionBtnText: {
        color: '#FFFFFF',
        fontSize: 16,
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
        marginTop: 4
    },
    metricSub: {
        fontSize: 11,
        color: theme.colors.textSubtle,
        marginTop: 4
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
    emptyCard: {
        backgroundColor: theme.colors.card,
        borderRadius: theme.radii.md,
        padding: 24,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderStyle: 'dashed'
    },
    emptyTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.colors.text
    },
    emptySub: {
        fontSize: 12,
        color: theme.colors.textMuted,
        marginTop: 4,
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
    badgeTextIncome: {
        color: theme.colors.emerald,
        fontSize: 16,
        fontWeight: '800'
    },
    badgeTextExpense: {
        color: theme.colors.rose,
        fontSize: 16,
        fontWeight: '800'
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
    trxAmount: {
        fontSize: 15,
        fontWeight: '700',
        marginLeft: 8
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
