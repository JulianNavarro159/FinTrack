import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    FlatList,
    StyleSheet,
    ActivityIndicator,
    Alert,
    RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatCurrency, getCurrencySymbol, getPaymentMethodLabel, PAYMENT_METHODS } from '../utils/currencies';
import { theme } from '../theme';
import { mobileApi } from '../services/api';

export const HistoryScreen = ({
    user,
    categories = [],
    onOpenTransactionModal,
    refreshSignal = 0,
    onTransactionChanged
}) => {
    const currency = user?.currency || 'USD';
    const [transactions, setTransactions] = useState([]);
    const [summary, setSummary] = useState({ totalIncome: 0, totalExpense: 0, netBalance: 0 });
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const [typeFilter, setTypeFilter] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [methodFilter, setMethodFilter] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');

    const debounceTimer = useRef(null);

    const handleSearchChange = (text) => {
        setSearchQuery(text);
        if (debounceTimer.current) {
            clearTimeout(debounceTimer.current);
        }
        debounceTimer.current = setTimeout(() => {
            setDebouncedSearch(text);
        }, 300);
    };

    const handleClearSearch = () => {
        setSearchQuery('');
        setDebouncedSearch('');
    };

    const loadTransactions = useCallback(async () => {
        try {
            setLoading(true);
            const data = await mobileApi.getTransactions({
                type: typeFilter,
                idCategory: categoryFilter,
                paymentMethod: methodFilter,
                description: debouncedSearch.trim()
            });
            setTransactions(data.transactions || []);
            if (data.summary) {
                setSummary(data.summary);
            }
        } catch (err) {
            console.error('Failed to load transactions:', err.message);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [typeFilter, categoryFilter, methodFilter, debouncedSearch]);

    useEffect(() => {
        loadTransactions();
    }, [loadTransactions, refreshSignal]);

    const onRefresh = () => {
        setRefreshing(true);
        loadTransactions();
    };

    const handleDelete = (id, desc) => {
        Alert.alert(
            'Eliminar movimiento',
            `Deseas eliminar "${desc || 'este movimiento'}"?`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Eliminar',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await mobileApi.deleteTransaction(id);
                            loadTransactions();
                            if (onTransactionChanged) {
                                onTransactionChanged();
                            }
                        } catch (err) {
                            Alert.alert('Error', err.message || 'No se pudo eliminar');
                        }
                    }
                }
            ]
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.searchHeader}>
                <View style={styles.searchBarWrap}>
                    <Ionicons name="search-outline" size={18} color={theme.colors.textMuted} style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Buscar por descripcion..."
                        value={searchQuery}
                        onChangeText={handleSearchChange}
                        placeholderTextColor={theme.colors.textSubtle}
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={handleClearSearch} style={styles.searchClearBtn}>
                            <Ionicons name="close-circle" size={16} color={theme.colors.textMuted} />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            <View style={styles.filterPillsRow}>
                <TouchableOpacity
                    style={[styles.filterPill, typeFilter === '' && styles.filterPillActive]}
                    onPress={() => setTypeFilter('')}
                >
                    <Text style={[styles.filterPillText, typeFilter === '' && styles.filterPillTextActive]}>
                        Todos
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.filterPill, typeFilter === 'income' && styles.filterPillIncomeActive]}
                    onPress={() => setTypeFilter('income')}
                >
                    <Ionicons
                        name="arrow-down-circle-outline"
                        size={14}
                        color={typeFilter === 'income' ? theme.colors.emerald : theme.colors.textMuted}
                    />
                    <Text style={[styles.filterPillText, typeFilter === 'income' && styles.filterPillIncomeTextActive]}>
                        Ingresos
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.filterPill, typeFilter === 'expense' && styles.filterPillExpenseActive]}
                    onPress={() => setTypeFilter('expense')}
                >
                    <Ionicons
                        name="arrow-up-circle-outline"
                        size={14}
                        color={typeFilter === 'expense' ? theme.colors.rose : theme.colors.textMuted}
                    />
                    <Text style={[styles.filterPillText, typeFilter === 'expense' && styles.filterPillExpenseTextActive]}>
                        Gastos
                    </Text>
                </TouchableOpacity>
            </View>

            <View style={styles.summaryBanner}>
                <View style={styles.statBox}>
                    <Text style={styles.statLabel}>Movimientos</Text>
                    <Text style={styles.statNum}>{transactions.length}</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statBox}>
                    <Text style={styles.statLabel}>Ingresos</Text>
                    <Text style={[styles.statNum, styles.textEmerald]}>
                        +{formatCurrency(summary.totalIncome, currency)}
                    </Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statBox}>
                    <Text style={styles.statLabel}>Gastos</Text>
                    <Text style={[styles.statNum, styles.textRose]}>
                        -{formatCurrency(summary.totalExpense, currency)}
                    </Text>
                </View>
            </View>

            {loading && !refreshing ? (
                <View style={styles.loaderWrap}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                </View>
            ) : transactions.length === 0 ? (
                <View style={styles.emptyWrap}>
                    <Ionicons name="receipt-outline" size={40} color={theme.colors.textSubtle} />
                    <Text style={styles.emptyTitle}>No hay movimientos</Text>
                    <Text style={styles.emptySubtitle}>
                        No se encontraron registros con los filtros actuales.
                    </Text>
                    {onOpenTransactionModal && (
                        <TouchableOpacity
                            style={styles.emptyAddBtn}
                            onPress={() => onOpenTransactionModal('expense')}
                        >
                            <Ionicons name="add" size={18} color="#FFFFFF" />
                            <Text style={styles.emptyAddBtnText}>Registrar Movimiento</Text>
                        </TouchableOpacity>
                    )}
                </View>
            ) : (
                <FlatList
                    data={transactions}
                    keyExtractor={(item) => String(item.id)}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    renderItem={({ item }) => {
                        const isIncome = item.type === 'income';
                        return (
                            <View style={styles.trxRow}>
                                <View style={styles.trxLeft}>
                                    <View style={[styles.badge, isIncome ? styles.badgeIncome : styles.badgeExpense]}>
                                        <Ionicons
                                            name={isIncome ? 'arrow-down' : 'arrow-up'}
                                            size={15}
                                            color={isIncome ? theme.colors.emerald : theme.colors.rose}
                                        />
                                    </View>
                                    <View style={styles.trxInfo}>
                                        <Text style={styles.trxTitle} numberOfLines={1}>
                                            {item.description || (isIncome ? 'Ingreso' : 'Gasto')}
                                        </Text>
                                        <Text style={styles.trxMeta} numberOfLines={1}>
                                            {item.categoryFinance?.name || 'General'} • {getPaymentMethodLabel(item.paymentMethod, item.type)} • {item.date}
                                        </Text>
                                    </View>
                                </View>
                                <View style={styles.trxRight}>
                                    <Text style={[styles.amountText, isIncome ? styles.textEmerald : styles.textRose]}>
                                        {isIncome ? '+' : '-'} {formatCurrency(item.amount, currency)}
                                    </Text>
                                    <TouchableOpacity
                                        onPress={() => handleDelete(item.id, item.description)}
                                        style={styles.deleteBtn}
                                        accessibilityLabel="Eliminar movimiento"
                                    >
                                        <Ionicons name="trash-outline" size={16} color={theme.colors.rose} />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        );
                    }}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.bg
    },
    searchHeader: {
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 6
    },
    searchBarWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.card,
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: theme.radii.md,
        paddingHorizontal: 12
    },
    searchIcon: {
        marginRight: 8
    },
    searchInput: {
        flex: 1,
        paddingVertical: 10,
        fontSize: 14,
        color: theme.colors.text
    },
    searchClearBtn: {
        padding: 4
    },
    filterPillsRow: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        gap: 8,
        marginVertical: 10
    },
    filterPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 7,
        paddingHorizontal: 14,
        borderRadius: theme.radii.full,
        backgroundColor: theme.colors.card,
        borderWidth: 1,
        borderColor: theme.colors.border
    },
    filterPillActive: {
        backgroundColor: theme.colors.primaryLight,
        borderColor: theme.colors.primary
    },
    filterPillIncomeActive: {
        backgroundColor: theme.colors.emeraldLight,
        borderColor: theme.colors.emerald
    },
    filterPillExpenseActive: {
        backgroundColor: theme.colors.roseLight,
        borderColor: theme.colors.rose
    },
    filterPillText: {
        fontSize: 12,
        fontWeight: '600',
        color: theme.colors.textMuted
    },
    filterPillTextActive: {
        color: theme.colors.primary,
        fontWeight: '700'
    },
    filterPillIncomeTextActive: {
        color: theme.colors.emerald,
        fontWeight: '700'
    },
    filterPillExpenseTextActive: {
        color: theme.colors.rose,
        fontWeight: '700'
    },
    summaryBanner: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: theme.colors.card,
        marginHorizontal: 16,
        padding: 12,
        borderRadius: theme.radii.md,
        borderWidth: 1,
        borderColor: theme.colors.border,
        marginBottom: 10
    },
    statBox: {
        flex: 1,
        alignItems: 'center'
    },
    statDivider: {
        width: 1,
        height: 24,
        backgroundColor: theme.colors.border
    },
    statLabel: {
        fontSize: 11,
        color: theme.colors.textMuted,
        fontWeight: '500'
    },
    statNum: {
        fontSize: 13,
        fontWeight: '700',
        marginTop: 2
    },
    textEmerald: { color: theme.colors.emerald },
    textRose: { color: theme.colors.rose },
    loaderWrap: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    emptyWrap: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
        gap: 6
    },
    emptyTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: theme.colors.text,
        marginTop: 6
    },
    emptySubtitle: {
        fontSize: 13,
        color: theme.colors.textMuted,
        textAlign: 'center'
    },
    emptyAddBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: theme.colors.primary,
        paddingVertical: 10,
        paddingHorizontal: 18,
        borderRadius: theme.radii.md,
        marginTop: 12
    },
    emptyAddBtnText: {
        color: '#FFFFFF',
        fontSize: 13,
        fontWeight: '700'
    },
    listContent: {
        paddingHorizontal: 16,
        paddingBottom: 20
    },
    trxRow: {
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
    badge: {
        width: 34,
        height: 34,
        borderRadius: theme.radii.sm,
        justifyContent: 'center',
        alignItems: 'center'
    },
    badgeIncome: { backgroundColor: theme.colors.emeraldLight },
    badgeExpense: { backgroundColor: theme.colors.roseLight },
    trxInfo: { flex: 1 },
    trxTitle: { fontSize: 14, fontWeight: '600', color: theme.colors.text },
    trxMeta: { fontSize: 11, color: theme.colors.textMuted, marginTop: 2 },
    trxRight: { alignItems: 'flex-end', gap: 4 },
    amountText: { fontSize: 14, fontWeight: '700' },
    deleteBtn: { padding: 4 }
});
